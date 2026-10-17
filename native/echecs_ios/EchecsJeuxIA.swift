import UIKit
import WebKit
import Network

// Application iPhone native : WebKit intégré + moteur de fichiers HTTP en boucle locale.
// Tous les jeux et moteurs JS sont inclus dans l'IPA et fonctionnent sans Internet.
private final class OfflineGameServer {
    private let queue = DispatchQueue(label: "fr.echecsjeux.ios.http")
    private var listener: NWListener?
    private let root: URL
    static let port: UInt16 = 49281

    init?(root: URL?) {
        guard let root = root, FileManager.default.fileExists(atPath: root.path) else { return nil }
        self.root = root.standardizedFileURL
    }

    func start(ready: @escaping (Result<URL, Error>) -> Void) {
        do {
            let params = NWParameters.tcp
            params.requiredLocalEndpoint = .hostPort(host: "127.0.0.1", port: NWEndpoint.Port(rawValue: Self.port)!)
            let l = try NWListener(using: params, on: NWEndpoint.Port(rawValue: Self.port)!)
            self.listener = l
            var responded = false
            l.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    if !responded {
                        responded = true
                        ready(.success(URL(string: "http://127.0.0.1:\(Self.port)/index.html?native=ios")!))
                    }
                case .failed(let error):
                    if !responded { responded = true; ready(.failure(error)) }
                default: break
                }
            }
            l.newConnectionHandler = { [weak self] connection in self?.handle(connection) }
            l.start(queue: queue)
        } catch { ready(.failure(error)) }
    }

    private func handle(_ connection: NWConnection) {
        connection.start(queue: queue)
        receive(connection, buffer: Data())
    }

    private func receive(_ connection: NWConnection, buffer: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, complete, error in
            guard let self = self else { connection.cancel(); return }
            var request = buffer
            if let data = data { request.append(data) }
            if request.range(of: Data("\r\n\r\n".utf8)) != nil {
                self.respond(connection, request: request)
            } else if complete || error != nil || request.count > 16384 {
                connection.cancel()
            } else {
                self.receive(connection, buffer: request)
            }
        }
    }

    private func respond(_ connection: NWConnection, request: Data) {
        guard let line = String(data: request, encoding: .utf8)?.components(separatedBy: "\r\n").first else {
            connection.cancel()
            return
        }
        let parts = line.split(separator: " ", omittingEmptySubsequences: true)
        guard parts.count >= 2, parts[0] == "GET" || parts[0] == "HEAD" else {
            send(connection, code: 405, body: Data(), mime: "text/plain")
            return
        }
        let rawPath = String(parts[1]).components(separatedBy: "?").first ?? "/"
        guard let decoded = rawPath.removingPercentEncoding,
              !decoded.contains("\\"),
              !decoded.components(separatedBy: "/").contains(".."),
              !decoded.contains("\0") else {
            send(connection, code: 400, body: Data(), mime: "text/plain")
            return
        }
        let relative = decoded == "/" ? "index.html" : String(decoded.drop(while: { $0 == "/" }))
        let file = root.appendingPathComponent(relative).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"),
              FileManager.default.fileExists(atPath: file.path),
              let data = try? Data(contentsOf: file) else {
            send(connection, code: 404, body: Data("Fichier introuvable".utf8), mime: "text/plain")
            return
        }
        let mime: String
        switch file.pathExtension.lowercased() {
        case "html": mime = "text/html"
        case "js", "mjs": mime = "text/javascript"
        case "css": mime = "text/css"
        case "json", "webmanifest": mime = "application/json"
        case "png": mime = "image/png"
        case "jpg", "jpeg": mime = "image/jpeg"
        case "webp": mime = "image/webp"
        case "svg": mime = "image/svg+xml"
        case "pdf": mime = "application/pdf"
        case "woff": mime = "font/woff"
        case "woff2": mime = "font/woff2"
        default: mime = "application/octet-stream"
        }
        send(connection, code: 200, body: parts[0] == "HEAD" ? Data() : data, mime: mime, length: data.count)
    }

    private func send(_ connection: NWConnection, code: Int, body: Data, mime: String, length: Int? = nil) {
        let reason = code == 200 ? "OK" : code == 404 ? "Not Found" : "Bad Request"
        let header = "HTTP/1.1 \(code) \(reason)\r\nContent-Type: \(mime); charset=utf-8\r\nContent-Length: \(length ?? body.count)\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n"
        var payload = Data(header.utf8)
        payload.append(body)
        connection.send(content: payload, completion: .contentProcessed { _ in connection.cancel() })
    }
}

private final class GamesViewController: UIViewController, WKNavigationDelegate {
    private var server: OfflineGameServer?
    private var web: WKWebView!
    private let message = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.07, green: 0.12, blue: 0.20, alpha: 1)
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // stockage propre a l'app iOS ; aucune purge
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        message.text = "Chargement des jeux hors ligne…"
        message.textColor = .white
        message.textAlignment = .center
        message.numberOfLines = 0
        message.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(message)
        NSLayoutConstraint.activate([
            message.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            message.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            message.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 22),
            message.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -22)
        ])
        guard let server = OfflineGameServer(root: Bundle.main.resourceURL?.appendingPathComponent("GameWeb")) else {
            message.text = "Les moteurs de jeux manquent dans cette installation."
            return
        }
        self.server = server
        server.start { [weak self] result in
            DispatchQueue.main.async {
                guard let self = self else { return }
                switch result {
                case .success(let url):
                    self.web.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData))
                case .failure:
                    self.message.text = "Le serveur de jeu local n'a pas démarré. Ferme l'application puis réessaie."
                }
            }
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { message.isHidden = true }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        message.isHidden = false
        message.text = "Erreur de chargement local : \(error.localizedDescription)"
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        message.isHidden = false
        message.text = "Jeux indisponibles : \(error.localizedDescription)"
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "http", url.host == "127.0.0.1", url.port == Int(OfflineGameServer.port) {
            decisionHandler(.allow)
        } else if action.navigationType == .linkActivated, url.scheme == "https" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        } else { decisionHandler(.cancel) }
    }
}

@main
final class ChessGamesApp: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.rootViewController = GamesViewController()
        w.makeKeyAndVisible()
        window = w
        return true
    }
}
