import Foundation

@main
struct HostServerSmoke {
    static func main() {
        guard CommandLine.arguments.count > 1,
              let server = OfflineGameServer(root: URL(fileURLWithPath: CommandLine.arguments[1])) else {
            fputs("Local file server: ressources introuvables\n", stderr)
            exit(2)
        }
        let started = DispatchSemaphore(value: 0)
        var base: URL?
        var failure: String?
        server.start { result in
            switch result {
            case .success(let url): base = url
            case .failure(let error): failure = String(describing: error)
            }
            started.signal()
        }
        guard started.wait(timeout: .now() + 10) == .success, let url = base else {
            fputs("Serveur local : démarrage échoué \(failure ?? "timeout")\n", stderr)
            exit(3)
        }
        for path in ["index.html", "app.js", "go.html", "go.js", "dames-francaises.html", "styles.css"] {
            let location = URL(string: path, relativeTo: url)!
            let lock = DispatchSemaphore(value: 0)
            var status = 0
            var size = 0
            var detail: String?
            URLSession.shared.dataTask(with: location) { data, response, error in
                status = (response as? HTTPURLResponse)?.statusCode ?? 0
                size = data?.count ?? 0
                detail = error?.localizedDescription
                lock.signal()
            }.resume()
            guard lock.wait(timeout: .now() + 10) == .success, status == 200, size > 100 else {
                fputs("Ressource refusée: \(path) status=\(status) size=\(size) erreur=\(detail ?? "aucune")\n", stderr)
                exit(4)
            }
            print("OK HTTP local \(path): \(size) octets")
        }
        print("OK : serveur de fichiers local répond à toutes les ressources essentielles")
    }
}
