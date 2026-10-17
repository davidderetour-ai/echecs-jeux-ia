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
            // requiredLocalEndpoint + on: doublonnait la configuration du port,
            // provoquant POSIX EINVAL (22) lors du test d'intégration.
            // Écoute TCP standard, requêtes acceptées uniquement depuis 127.0.0.1.
            let l = try NWListener(using: .tcp, on: NWEndpoint.Port(rawValue: Self.port)!)
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
        guard case .hostPort(let host, _) = connection.endpoint,
              String(describing: host) == "127.0.0.1" || String(describing: host) == "::1" else {
            connection.cancel()
            return
        }
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
    private var startupTimeout: DispatchWorkItem?
    private var expectedLocalPage: URL?
    private var diagnosticRequested = false
    private let displayVersion = "3.8.8"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.07, green: 0.12, blue: 0.20, alpha: 1)
        // Barre UIKit indépendante de WebKit : visible même quand la page
        // web est blanche. Affiche la vraie version installée dans l'iPhone.
        let nativeBar = UIView()
        nativeBar.translatesAutoresizingMaskIntoConstraints = false
        nativeBar.backgroundColor = UIColor(red: 0.07, green: 0.12, blue: 0.20, alpha: 1)
        view.addSubview(nativeBar)

        let title = UILabel()
        title.text = "Échecs & Jeux IA · v" + displayVersion
        title.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
        title.textColor = .white
        title.translatesAutoresizingMaskIntoConstraints = false
        nativeBar.addSubview(title)

        let controls = UIStackView()
        controls.axis = .horizontal
        controls.distribution = .fillEqually
        controls.spacing = 6
        controls.translatesAutoresizingMaskIntoConstraints = false
        nativeBar.addSubview(controls)
        for (name, action) in [
            ("Accueil", #selector(nativeHome)),
            ("Go", #selector(nativeGo)),
            ("Dames", #selector(nativeDames)),
            ("Diagnostic", #selector(nativeDiagnostic))
        ] {
            let button = UIButton(type: .system)
            button.setTitle(name, for: .normal)
            button.setTitleColor(.white, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .semibold)
            button.backgroundColor = UIColor(red: 0.15, green: 0.27, blue: 0.44, alpha: 1)
            button.layer.cornerRadius = 7
            button.addTarget(self, action: action, for: .touchUpInside)
            controls.addArrangedSubview(button)
        }
        NSLayoutConstraint.activate([
            nativeBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            nativeBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            nativeBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            nativeBar.heightAnchor.constraint(equalToConstant: 80),
            title.topAnchor.constraint(equalTo: nativeBar.topAnchor, constant: 5),
            title.leadingAnchor.constraint(equalTo: nativeBar.leadingAnchor, constant: 12),
            controls.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 8),
            controls.leadingAnchor.constraint(equalTo: nativeBar.leadingAnchor, constant: 8),
            controls.trailingAnchor.constraint(equalTo: nativeBar.trailingAnchor, constant: -8),
            controls.heightAnchor.constraint(equalToConstant: 31)
        ])
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // conserver les parties et réglages
        config.websiteDataStore = .default() // stockage propre a l'app iOS ; aucune purge
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0.07, green: 0.12, blue: 0.20, alpha: 1)
        web.scrollView.backgroundColor = web.backgroundColor
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: nativeBar.bottomAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        message.text = "Chargement des jeux hors ligne…"
        message.textColor = .white
        message.backgroundColor = UIColor(red: 0.08, green: 0.16, blue: 0.28, alpha: 0.96)
        message.layer.cornerRadius = 14
        message.layer.masksToBounds = true
        message.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
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
                    self.checkLocalServerAndLoad(url)
                case .failure:
                    self.message.text = "Le serveur de jeu local n'a pas démarré. Ferme l'application puis réessaie."
                }
            }
        }
    }

    private func showStatus(_ info: String) {
        message.isHidden = false
        message.text = "Échecs & Jeux IA v" + displayVersion + "\n\n" + info
        NSLog("[Échecs iOS] %@", info)
    }

    @objc private func nativeHome() { navigate("index.html") }
    @objc private func nativeGo() { navigate("go.html") }
    @objc private func nativeDames() { navigate("dames-francaises.html") }

    private func navigate(_ path: String) {
        diagnosticRequested = false
        guard server != nil,
              let url = URL(string: "http://127.0.0.1:\(OfflineGameServer.port)/" + path) else {
            showStatus("Le serveur local n'est pas encore prêt.")
            return
        }
        showStatus("Ouverture de " + path + "…")
        web.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData))
    }

    // Chaque jeu a son propre HTML : seul l'accueil possède .header et #content.
    // Le Go utilise #size et #cv, les dames #roles et #board, etc.
    // Cette expression permet de vérifier la vraie page, et non d'afficher un
    // avertissement "HTML incomplet" devant un plateau pourtant fonctionnel.
    private let pageStatusJavaScript = """
    (function(){
      const path = location.pathname.toLowerCase();
      const go = path.endsWith('/go.html');
      const dames = path.endsWith('/dames-francaises.html');
      const paix = path.endsWith('/peace.html');
      const visible = document.body && document.body.innerText.trim().length > 120;
      const valid = go ? !!(document.getElementById('size') && document.getElementById('cv'))
        : dames ? !!(document.getElementById('roles') && document.getElementById('board'))
        : paix ? !!visible
        : !!(document.querySelector('.header') && document.getElementById('content'));
      return JSON.stringify({
        page:path,
        valide:valid,
        jeu:go?'go':dames?'dames':paix?'defis':'accueil',
        applicationPrete:(go||dames||paix) ? valid : window.__appReady === true,
        texte:document.body ? document.body.innerText.length : 0,
        erreur:window.__startupError||'',
        reseau:navigator.onLine
      });
    })()
    """

    @objc private func nativeDiagnostic() {
        if diagnosticRequested && !message.isHidden {
            diagnosticRequested = false
            message.isHidden = true
            return
        }
        diagnosticRequested = true
        web.evaluateJavaScript(pageStatusJavaScript) { [weak self] value, error in
            guard let self = self, self.diagnosticRequested else { return }
            let detail = (value as? String) ?? error?.localizedDescription ?? "Pas de résultat WebKit"
            self.showStatus("Diagnostic local (aucun envoi Internet) :\n" + detail +
              "\n\nTouche encore Diagnostic pour fermer ce message.")
        }
    }

    // Ne pas masquer le diagnostic au simple succès de navigation :
    // WKWebView peut afficher une page blanche même si l'URL est "finie".
    private func checkLocalServerAndLoad(_ url: URL) {
        expectedLocalPage = url
        showStatus("Vérification des  jeux intégrés…")
        URLSession.shared.dataTask(with: URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)) {
            [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard error == nil,
                      let http = response as? HTTPURLResponse, http.statusCode == 200,
                      let data = data, let html = String(data: data, encoding: .utf8),
                       html.contains("id=") && html.contains("content") else {
                    self.showStatus("Le serveur local ne renvoie pas le menu des jeux. Vérifie la connexion locale. Détail : " + (error?.localizedDescription ?? "Code HTTP ou contenu inattendu"))
                    return
                }
                self.showStatus("Ouverture des plateaux…")
                self.web.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData))
                self.startupTimeout?.cancel()
                let timeout = DispatchWorkItem { [weak self] in
                    guard let self = self, !self.message.isHidden else { return }
                    self.showStatus("Le chargement du jeu dépasse 12 secondes. Ferme puis rouvre l’application et envoie une capture de ce message.")
                }
                self.startupTimeout = timeout
                DispatchQueue.main.asyncAfter(deadline: .now() + 12, execute: timeout)
            }
        }.resume()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let url = webView.url, url.host == "127.0.0.1" else {
            showStatus("Une page externe ou inconnue a été chargée.")
            return
        }
        webView.evaluateJavaScript(pageStatusJavaScript) { [weak self, weak webView] result, error in
            guard let self = self, let webView = webView,
                  webView.url?.path == url.path else { return }
            let raw = (result as? String) ?? ""
            let info = raw.data(using: .utf8).flatMap {
                (try? JSONSerialization.jsonObject(with: $0)) as? [String: Any]
            }
            if error == nil, info?["valide"] as? Bool == true {
                self.startupTimeout?.cancel()
                if !self.diagnosticRequested {
                    self.message.isHidden = true
                }
            } else {
                self.showStatus("Le contenu de ce jeu n'est pas prêt : " +
                    (error?.localizedDescription ?? raw))
            }
        }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        showStatus("Le moteur WebKit a été interrompu. Ferme puis rouvre l'application.")
    }
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
