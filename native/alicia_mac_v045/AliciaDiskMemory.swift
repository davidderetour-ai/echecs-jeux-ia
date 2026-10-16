import Foundation

// Stockage local Alicia indépendant du navigateur WebKit.
// Données : ~/Library/Application Support/AliciaOriginal/
final class AliciaDiskMemory {
    static let shared = AliciaDiskMemory()
    private let serial = DispatchQueue(label: "fr.alicia.memory")
    private let maxSize = 300_000
    private var path: URL? {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?.appendingPathComponent("AliciaOriginal", isDirectory: true)
            .appendingPathComponent("original-memory-v1.json")
    }
    typealias Response = (String, Data)
    private func failure(_ code: String, _ message: String) -> Response {
        let data = (try? JSONSerialization.data(withJSONObject: ["error": message])) ?? Data()
        return (code, data)
    }
    private func valid(_ data: Data) -> Bool {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              obj["schema"] as? Int == 1,
              let items = obj["examples"] as? [[String: Any]],
              items.count <= 220 else { return false }
        return items.allSatisfy {
            guard let q = $0["q"] as? String, let a = $0["a"] as? String else {return false}
            return !q.isEmpty && q.count <= 260 && !a.isEmpty && a.count <= 1600
        }
    }
    func respond(method: String, content: Data) -> Response {
        serial.sync {
            guard let url = path else {return failure("500 Internal Server Error", "Dossier de mémoire indisponible")}
            if method == "GET" {
                guard let data = try? Data(contentsOf: url) else {
                    return failure("404 Not Found", "Aucune sauvegarde native sur ce Mac")
                }
                return valid(data) ? ("200 OK", data)
                    : failure("422 Unprocessable Entity", "Mémoire native invalide")
            }
            guard method == "POST" else {return failure("405 Method Not Allowed", "Méthode refusée")}
            guard content.count <= maxSize && valid(content) else {
                return failure("400 Bad Request", "Sauvegarde invalide ou trop volumineuse")
            }
            do {
                let dir = url.deletingLastPathComponent()
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                if FileManager.default.fileExists(atPath: url.path) {
                    let previous = dir.appendingPathComponent("original-memory-v1.previous.json")
                    try? FileManager.default.removeItem(at: previous)
                    try? FileManager.default.copyItem(at: url, to: previous)
                }
                try content.write(to: url, options: .atomic)
                guard (try? Data(contentsOf: url)) == content else {
                    return failure("500 Internal Server Error", "Vérification de la sauvegarde impossible")
                }
                return ("200 OK", Data("{\"saved\":true}".utf8))
            } catch {return failure("500 Internal Server Error", "Écriture locale impossible : \(error.localizedDescription)")}
        }
    }
}
