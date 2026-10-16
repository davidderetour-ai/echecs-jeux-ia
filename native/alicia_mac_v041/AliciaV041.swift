import SwiftUI
import AppKit
import WebKit
import Network
import Darwin
import Foundation

// Alicia Mac V0.4.1 : conteneur natif WebKit du code de l'interface Safari.
// Le moteur IA externe (Puter) reste un service en ligne choisi par l'utilisateur.
// Serveur local strictement lie a 127.0.0.1, sans exposition au reseau.
@main
struct AliciaMacFullApp: App {
    var body: some Scene {
        WindowGroup("Alicia Mac V0.4.1") {
            AliciaFullView()
                .frame(minWidth: 900, minHeight: 680)
        }
    }
}

final class AliciaLoopbackServer: ObservableObject {
    @Published var baseURL: URL?
    @Published var errorText: String?
    private let listenerQueue = DispatchQueue(label: "fr.alicia.mac.v041.socket")
    private let clientsQueue = DispatchQueue(label: "fr.alicia.mac.v041.clients", attributes: .concurrent)
    private let root: URL
    private let sdkLock = NSLock()
    private var sdkCache: Data?
    private var sdkDiagnostic = "Téléchargement du moteur Puter non encore tenté."

    init() {
        guard let folder = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true) else {
            root = URL(fileURLWithPath: "/nonexistent")
            errorText = "Les ressources locales d'Alicia sont absentes."
            return
        }
        root = folder.standardizedFileURL
        guard FileManager.default.fileExists(atPath: root.appendingPathComponent("index.html").path) else {
            errorText = "Le fichier Web/index.html est absent. Retélécharge l'application GitHub."
            return
        }
        listenerQueue.async { [weak self] in self?.serve() }
    }

    // POSIX IPv4 local seulement. NWListener(using:on:) échouait avant de pouvoir
    // afficher l'interface sur le MacBook Pro Intel sous macOS Big Sur.
    private func serve() {
        var failure = "Le serveur local n'a pas pu démarrer."
        for port in [UInt16(8767), 8768, 8769] {
            let fd = Darwin.socket(AF_INET, SOCK_STREAM, 0)
            if fd < 0 {
                failure = "Impossible de créer la connexion locale : \(lastErrno())."
                continue
            }
            var yes: Int32 = 1
            _ = withUnsafePointer(to: &yes) {
                Darwin.setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, $0,
                                  socklen_t(MemoryLayout<Int32>.size))
            }
            var address = sockaddr_in()
            address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
            address.sin_family = sa_family_t(AF_INET)
            address.sin_port = port.bigEndian
            address.sin_addr = in_addr(s_addr: UInt32(0x7f000001).bigEndian)
            let bindResult = withUnsafePointer(to: &address) { ptr in
                ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                    Darwin.bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
                }
            }
            if bindResult != 0 {
                failure = "Impossible de réserver 127.0.0.1:\(port) : \(lastErrno())."
                _ = Darwin.close(fd)
                continue
            }
            if Darwin.listen(fd, 16) != 0 {
                failure = "Impossible d'écouter sur 127.0.0.1:\(port) : \(lastErrno())."
                _ = Darwin.close(fd)
                continue
            }
            NSLog("Alicia serveur local démarré sur 127.0.0.1:%d", Int32(port))
            DispatchQueue.main.async {
                self.errorText = nil
                self.baseURL = URL(string: "http://127.0.0.1:\(port)/")
            }
            while true {
                var clientAddress = sockaddr_storage()
                var addressLength = socklen_t(MemoryLayout<sockaddr_storage>.size)
                let client = withUnsafeMutablePointer(to: &clientAddress) { ptr in
                    ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                        Darwin.accept(fd, $0, &addressLength)
                    }
                }
                if client < 0 {
                    if errno == EINTR { continue }
                    NSLog("Alicia accept a échoué : %@", lastErrno())
                    break
                }
                clientsQueue.async { [weak self] in
                    guard let self = self else {
                        _ = Darwin.close(client)
                        return
                    }
                    self.handle(client)
                }
            }
            _ = Darwin.close(fd)
            failure = "La réception de connexions locales s'est interrompue : \(lastErrno())."
            break
        }
        DispatchQueue.main.async { self.errorText = failure }
    }

    private func lastErrno() -> String {
        return String(cString: strerror(errno))
    }

    // Télécharger officiellement Puter.js en HTTPS dans le processus natif.
    // Le script est ensuite servi en local pour réduire les problèmes WebKit
    // avec les scripts externes sur les anciens Mac. Aucun identifiant n'est collecté.
    private func puterSDK() -> Data? {
        sdkLock.lock()
        defer { sdkLock.unlock() }
        if let data = sdkCache { return data }
        guard let url = URL(string: "https://js.puter.com/v2/") else { return nil }
        let conf = URLSessionConfiguration.ephemeral
        conf.timeoutIntervalForRequest = 14
        conf.timeoutIntervalForResource = 18
        let session = URLSession(configuration: conf)
        var request = URLRequest(url: url)
        request.setValue("Alicia-Mac/0.4", forHTTPHeaderField: "User-Agent")
        let sem = DispatchSemaphore(value: 0)
        var result: Data?
        var message = "Pas de réponse du serveur HTTPS officiel."
        let task = session.dataTask(with: request) { data, response, error in
            if let response = response as? HTTPURLResponse {
                message = "Réponse HTTPS Puter : \(response.statusCode)"
                if response.statusCode == 200,
                   let data = data,
                   data.count > 1000, data.count < 9_000_000 {
                    result = data
                }
            } else if let error = error {
                message = "Erreur réseau Puter : \(error.localizedDescription)"
            }
            sem.signal()
        }
        task.resume()
        if sem.wait(timeout: .now() + 20) == .timedOut {
            task.cancel()
            message = "Délai Puter dépassé après 20 secondes."
        }
        session.finishTasksAndInvalidate()
        sdkDiagnostic = result == nil ? message : "Puter.js téléchargé via HTTPS."
        if let data = result { sdkCache = data }
        return result
    }

    private func handle(_ fd: Int32) {
        defer { _ = Darwin.close(fd) }
        var timeout = timeval(tv_sec: 6, tv_usec: 0)
        _ = withUnsafePointer(to: &timeout) {
            Darwin.setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, $0,
                              socklen_t(MemoryLayout<timeval>.size))
        }
        var yes: Int32 = 1
        _ = withUnsafePointer(to: &yes) {
            Darwin.setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, $0,
                              socklen_t(MemoryLayout<Int32>.size))
        }
        var request = Data()
        while request.count < 16384 {
            var buffer = [UInt8](repeating: 0, count: 4096)
            let count = buffer.withUnsafeMutableBytes { ptr -> Int in
                Darwin.recv(fd, ptr.baseAddress!, ptr.count, 0)
            }
            if count <= 0 { break }
            request.append(contentsOf: buffer.prefix(count))
            if request.range(of: Data([13, 10, 13, 10])) != nil { break }
        }
        guard let requestText = String(data: request, encoding: .utf8),
              request.range(of: Data([13, 10, 13, 10])) != nil,
              let line = requestText.components(separatedBy: "\r\n").first else {
            send(fd, "400 Bad Request", "text/plain; charset=utf-8",
                 Data("Requête invalide".utf8))
            return
        }
        let components = line.split(separator: " ")
        guard components.count >= 3 &&
            (components[0] == "GET" || components[0] == "HEAD" ||
             components[0] == "POST" || components[0] == "DELETE") else {
            send(fd, "405 Method Not Allowed", "text/plain; charset=utf-8",
                 Data("Méthode refusée".utf8))
            return
        }
        let method = String(components[0])
        let isHead = method == "HEAD"
        let uri = String(components[1]).components(separatedBy: "?").first ?? "/"
        // Contrôle Host et Origin pour éviter l'envoi de jetons depuis un autre site.
        let headerLines = requestText.components(separatedBy: "\r\n")
        var headers: [String: String] = [:]
        for item in headerLines.dropFirst() {
            guard let index = item.firstIndex(of: ":") else { continue }
            let key = item[..<index].trimmingCharacters(in: .whitespaces).lowercased()
            let value = item[item.index(after: index)...].trimmingCharacters(in: .whitespaces)
            headers[key] = value
        }
        let host = headers["host"] ?? ""
        let allowedHosts = ["127.0.0.1:8767", "127.0.0.1:8768", "127.0.0.1:8769"]
        guard allowedHosts.contains(host) else {
            send(fd, "403 Forbidden", "text/plain", Data("Hôte non autorisé".utf8))
            return
        }
        if uri.hasPrefix("/api/native-puter/") {
            if method == "POST" || method == "DELETE" {
                guard headers["origin"] == "http://" + host,
                      headers["content-type"]?.lowercased().hasPrefix("application/json") == true || method == "DELETE" else {
                    send(fd, "403 Forbidden", "application/json",
                         Data(#"{"error":"Origine du navigateur non autorisée"}"#.utf8))
                    return
                }
            }
            guard let sizeText = headers["content-length"],
                  let length = Int(sizeText), length >= 0, length <= 65000,
                  let headerEnd = request.range(of: Data([13, 10, 13, 10]))?.upperBound else {
                // Les requêtes GET et DELETE peuvent ne pas avoir de Content-Length.
                if method == "GET" || method == "DELETE" {
                    if let reply = AliciaNativePuter.shared.respond(path: uri, method: method, body: Data()) {
                        send(fd, reply.status, reply.mime, reply.body, isHead: isHead)
                    }
                    return
                }
                send(fd, "413 Payload Too Large", "application/json",
                     Data(#"{"error":"Taille de message refusée"}"#.utf8))
                return
            }
            var body = Data(request[headerEnd..<request.endIndex])
            if body.count > length {
                body = Data(body.prefix(length))
            }
            while body.count < length {
                var bytes = [UInt8](repeating: 0, count: min(4096, length - body.count))
                let count = bytes.withUnsafeMutableBytes { ptr in
                    Darwin.recv(fd, ptr.baseAddress!, ptr.count, 0)
                }
                if count <= 0 { break }
                body.append(contentsOf: bytes.prefix(count))
            }
            guard body.count == length else {
                send(fd, "400 Bad Request", "application/json",
                     Data(#"{"error":"Message incomplet"}"#.utf8))
                return
            }
            if let reply = AliciaNativePuter.shared.respond(path: uri, method: method, body: body) {
                send(fd, reply.status, reply.mime, reply.body, isHead: isHead)
            }
            return
        }
        guard method == "GET" || method == "HEAD" else {
            send(fd, "405 Method Not Allowed", "text/plain",
                 Data("Accès en lecture seule".utf8))
            return
        }

        if uri == "/puter-sdk.js" {
            if let data = puterSDK() {
                send(fd, "200 OK", "text/javascript; charset=utf-8", data, isHead: isHead)
            } else {
                send(fd, "503 Service Unavailable", "text/javascript; charset=utf-8",
                     Data(("console.warn(" + String(reflecting: sdkDiagnostic) + ");").utf8),
                     isHead: isHead)
            }
            return
        }
        if uri == "/api/puter/status" {
            let status = sdkCache == nil ? "Puter absent : vérifie Internet et la connexion WebKit." : "SDK Puter téléchargé : connexion au compte encore nécessaire."
            let escaped = status.replacingOccurrences(of: "\"", with: "'")
            send(fd, "200 OK", "application/json; charset=utf-8",
                 Data(("{\"message\":\"" + escaped + "\"}").utf8), isHead: isHead)
            return
        }
        if uri == "/api/local/chat" || uri.hasPrefix("/.netlify/") {
            let body = Data(#"{"error":"Moteur IA local non installé sur ce Mac. Puter en ligne nécessite une connexion et un quota disponible."}"#.utf8)
            send(fd, "503 Service Unavailable", "application/json", body, isHead: isHead)
            return
        }
        guard let decoded = uri.removingPercentEncoding,
              decoded.hasPrefix("/"),
              !decoded.contains("\\"),
              !decoded.contains("\0"),
              !decoded.contains(":") else {
            send(fd, "400 Bad Request", "text/plain", Data("Chemin invalide".utf8))
            return
        }
        let name = decoded == "/" ? "index.html" : String(decoded.dropFirst())
        let path = root.appendingPathComponent(name).standardizedFileURL
        let extensions = ["html", "css", "js", "mjs", "json", "svg", "webmanifest",
                          "png", "jpg", "jpeg", "ico", "txt", "webp"]
        guard path.path.hasPrefix(root.path + "/"),
              !name.split(separator: "/").contains(".."),
              !name.hasPrefix("."),
              extensions.contains(path.pathExtension.lowercased()) else {
            send(fd, "403 Forbidden", "text/plain", Data("Fichier interdit".utf8))
            return
        }
        guard let data = try? Data(contentsOf: path, options: .mappedIfSafe) else {
            send(fd, "404 Not Found", "text/plain", Data("Fichier absent".utf8))
            return
        }
        let types: [String: String] = [
            "html": "text/html; charset=utf-8",
            "css": "text/css; charset=utf-8",
            "js": "text/javascript; charset=utf-8",
            "mjs": "text/javascript; charset=utf-8",
            "json": "application/json; charset=utf-8",
            "webmanifest": "application/manifest+json",
            "svg": "image/svg+xml",
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "ico": "image/x-icon",
            "webp": "image/webp",
            "txt": "text/plain; charset=utf-8"
        ]
        send(fd, "200 OK", types[path.pathExtension.lowercased()] ??
             "application/octet-stream", data, isHead: isHead)
    }

    private func send(_ fd: Int32, _ status: String, _ mime: String, _ data: Data,
                      isHead: Bool = false) {
        let headers = "HTTP/1.1 \(status)\r\n" +
            "Content-Type: \(mime)\r\n" +
            "Content-Length: \(data.count)\r\n" +
            "Cache-Control: no-store\r\n" +
            "X-Content-Type-Options: nosniff\r\n" +
            "X-Frame-Options: DENY\r\n" +
            "Connection: close\r\n\r\n"
        var output = Data(headers.utf8)
        if !isHead { output.append(data) }
        output.withUnsafeBytes { ptr in
            guard let base = ptr.baseAddress else { return }
            var sent = 0
            while sent < ptr.count {
                let n = Darwin.send(fd, base.advanced(by: sent), ptr.count - sent, 0)
                if n <= 0 { break }
                sent += n
            }
        }
    }
}

struct AliciaFullView: View {
    @StateObject private var server = AliciaLoopbackServer()
    var body: some View {
        Group {
            if let url = server.baseURL {
                AliciaWebView(url: url)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "sparkles").font(.largeTitle)
                    Text("Alicia V0.4.1 prépare son interface…")
                    if let error = server.errorText {
                        Text(error).foregroundColor(.orange)
                    } else {
                        Text("Serveur local privé 127.0.0.1")
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.04, green: 0.06, blue: 0.16))
            }
        }
    }
}

struct AliciaWebView: NSViewRepresentable {
    let url: URL
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.preferences.javaScriptEnabled = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        let script = WKUserScript(source: "window.AliciaNativeMac = true;",
                                  injectionTime: .atDocumentStart,
                                  forMainFrameOnly: true)
        configuration.userContentController.addUserScript(script)
        let browser = WKWebView(frame: .zero, configuration: configuration)
        browser.uiDelegate = context.coordinator
        browser.navigationDelegate = context.coordinator
        browser.allowsBackForwardNavigationGestures = true
        browser.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData))
        return browser
    }

    func updateNSView(_ view: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKUIDelegate, WKNavigationDelegate {
        private var popupWindows: [NSWindow] = []

        func webView(_ webView: WKWebView,
                     runOpenPanelWith parameters: WKOpenPanelParameters,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping ([URL]?) -> Void) {
            let dialog = NSOpenPanel()
            dialog.canChooseFiles = true
            dialog.canChooseDirectories = parameters.allowsDirectories
            dialog.allowsMultipleSelection = parameters.allowsMultipleSelection
            dialog.begin { result in
                completionHandler(result == .OK ? dialog.urls : nil)
            }
        }

        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            // La fenetre de connexion Puter doit pouvoir renvoyer son resultat
            // a la fenetre Alicia. Pas de redirection d'identifiants vers Alicia.
            let popup = WKWebView(frame: NSRect(x: 0, y: 0, width: 580, height: 680),
                                  configuration: configuration)
            popup.uiDelegate = self
            popup.navigationDelegate = self
            let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 580, height: 680),
                                  styleMask: [.titled, .closable, .resizable],
                                  backing: .buffered, defer: false)
            window.title = "Connexion / lien externe — Alicia"
            window.contentView = popup
            window.center()
            window.makeKeyAndOrderFront(nil)
            popupWindows.append(window)
            return popup
        }

        func webViewDidClose(_ webView: WKWebView) {
            if let idx = popupWindows.firstIndex(where: { $0.contentView === webView }) {
                popupWindows[idx].close()
                popupWindows.remove(at: idx)
            }
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let target = action.request.url else {
                decisionHandler(.cancel)
                return
            }
            let scheme = target.scheme?.lowercased() ?? ""
            if scheme == "http" && target.host == "127.0.0.1" {
                decisionHandler(.allow)
                return
            }
            if scheme == "https" || scheme == "about" || scheme == "data" || scheme == "blob" {
                decisionHandler(.allow)
                return
            }
            decisionHandler(.cancel)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            NSLog("Alicia WebKit navigation : %@", error.localizedDescription)
        }
    }
}
