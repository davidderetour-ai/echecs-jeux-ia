import SwiftUI
import AppKit
import WebKit
import Network
import Foundation

// Alicia Mac V0.3 : conteneur natif WebKit du code de l'interface Safari.
// Le moteur IA externe (Puter) reste un service en ligne choisi par l'utilisateur.
// Serveur local strictement lie a 127.0.0.1, sans exposition au reseau.
@main
struct AliciaMacFullApp: App {
    var body: some Scene {
        WindowGroup("Alicia Mac V0.3") {
            AliciaFullView()
                .frame(minWidth: 900, minHeight: 680)
        }
    }
}

final class AliciaLoopbackServer: ObservableObject {
    @Published var baseURL: URL?
    @Published var errorText: String?
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "fr.alicia.mac.v03.loopback")
    private let root: URL

    init() {
        guard let folder = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true) else {
            root = URL(fileURLWithPath: "/nonexistent")
            errorText = "Les ressources d'Alicia sont manquantes."
            return
        }
        root = folder.standardizedFileURL
        start()
    }

    private func start() {
        do {
            let parameters = NWParameters.tcp
            // Port fixe pour conserver les préférences locales entre les lancements.
            // Si le port est déjà occupé, échouer au lieu de charger un autre service.
            guard let port = NWEndpoint.Port(rawValue: 8767) else {
                throw NSError(domain: "Alicia", code: 8767)
            }
            parameters.requiredLocalEndpoint = .hostPort(host: .ipv4(.loopback), port: port)
            let server = try NWListener(using: parameters, on: port)
            listener = server
            server.newConnectionHandler = { [weak self] connection in
                self?.handle(connection)
            }
            server.stateUpdateHandler = { [weak self, weak server] state in
                switch state {
                case .ready:
                    guard let port = server?.port?.rawValue else { return }
                    DispatchQueue.main.async {
                        self?.baseURL = URL(string: "http://127.0.0.1:\(port)/")
                    }
                case .failed(let error):
                    DispatchQueue.main.async {
                        self?.errorText = "Le serveur local n'a pas démarré : \(error.localizedDescription)"
                    }
                default:
                    break
                }
            }
            server.start(queue: queue)
        } catch {
            errorText = "Échec du serveur local : \(error.localizedDescription)"
        }
    }

    private func handle(_ connection: NWConnection) {
        connection.start(queue: queue)
        receiveHeader(connection, Data())
    }

    private func receiveHeader(_ connection: NWConnection, _ accumulated: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] chunk, _, isComplete, error in
            guard let self = self else { connection.cancel(); return }
            var data = accumulated
            if let chunk = chunk { data.append(chunk) }
            if data.count > 16384 || error != nil {
                self.reply(connection, status: "431 Request Header Fields Too Large",
                           type: "text/plain; charset=utf-8",
                           bytes: Data("Requête trop longue.".utf8))
                return
            }
            if data.range(of: Data([13,10,13,10])) != nil {
                self.process(connection, data)
            } else if isComplete {
                connection.cancel()
            } else {
                self.receiveHeader(connection, data)
            }
        }
    }

    private func process(_ connection: NWConnection, _ header: Data) {
        guard let request = String(data: header, encoding: .utf8),
              let line = request.components(separatedBy: "\r\n").first else {
            reply(connection, status: "400 Bad Request", type: "text/plain",
                  bytes: Data("Requête invalide".utf8))
            return
        }
        let components = line.split(separator: " ", omittingEmptySubsequences: false)
        guard components.count >= 3,
              components[0] == "GET" || components[0] == "HEAD" else {
            reply(connection, status: "405 Method Not Allowed", type: "text/plain",
                  bytes: Data("Lecture seule.".utf8))
            return
        }
        // Pas d'API IA locale embarquee : signaler precisement cette limite.
        let uri = String(components[1]).components(separatedBy: "?").first ?? "/"
        if uri == "/api/local/chat" || uri.hasPrefix("/.netlify/") {
            reply(connection, status: "503 Service Unavailable", type: "application/json",
                  bytes: Data(#"{"error":"Moteur IA local ou API Netlify non connecté à cette installation Mac. Choisis Puter pour une IA en ligne, sous réserve du compte et des quotas."}"#.utf8))
            return
        }
        guard let decoded = uri.removingPercentEncoding,
              decoded.hasPrefix("/"),
              !decoded.contains("\\"),
              !decoded.contains("\0") else {
            reply(connection, status: "400 Bad Request", type: "text/plain",
                  bytes: Data("Chemin invalide".utf8))
            return
        }
        let name = decoded == "/" ? "index.html" : String(decoded.dropFirst())
        // Normalisation + verification de chemin (pas d'evasion du dossier Web).
        let target = root.appendingPathComponent(name).standardizedFileURL
        guard target.path.hasPrefix(root.path + "/"),
              !name.split(separator: "/").contains(".."),
              !name.hasPrefix("."),
              ["html", "css", "js", "mjs", "json", "svg", "webmanifest",
               "png", "jpg", "jpeg", "ico", "txt"].contains(target.pathExtension.lowercased()) else {
            reply(connection, status: "403 Forbidden", type: "text/plain",
                  bytes: Data("Fichier non autorisé".utf8))
            return
        }
        guard let body = try? Data(contentsOf: target, options: .mappedIfSafe) else {
            reply(connection, status: "404 Not Found", type: "text/plain",
                  bytes: Data("Fichier introuvable".utf8))
            return
        }
        let types = [
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
            "txt": "text/plain; charset=utf-8"
        ]
        let type = types[target.pathExtension.lowercased()] ?? "application/octet-stream"
        reply(connection, status: "200 OK", type: type,
              bytes: components[0] == "HEAD" ? Data() : body,
              declaredLength: body.count)
    }

    private func reply(_ connection: NWConnection, status: String, type: String,
                       bytes: Data, declaredLength: Int? = nil) {
        let headers = "HTTP/1.1 \(status)\r\n" +
            "Content-Type: \(type)\r\n" +
            "Content-Length: \(declaredLength ?? bytes.count)\r\n" +
            "Cache-Control: no-store\r\n" +
            "X-Content-Type-Options: nosniff\r\n" +
            "X-Frame-Options: DENY\r\n" +
            "Connection: close\r\n\r\n"
        var response = Data(headers.utf8)
        response.append(bytes)
        connection.send(content: response, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }

    deinit { listener?.cancel() }
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
                    Text("Alicia V0.3 prépare son interface…")
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
