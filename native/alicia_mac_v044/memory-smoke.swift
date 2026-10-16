import Foundation

// Test de persistance : exécuter ce binaire deux fois dans des processus distincts.
// Il doit retrouver exactement l'apprentissage écrit par le processus précédent.
@main
struct AliciaMemorySmoke {
    static func main() {
        guard CommandLine.arguments.count == 2 else {
            fatalError("Usage: smoke write | read")
        }
        let payload = Data(#"{"schema":1,"version":"0.1.0","examples":[{"q":"Quel est mon jeu préféré ?","a":"Les échecs.","created":1,"confidence":1}],"cortectNotes":[],"cortectScores":[],"history":[],"revision":1}"#.utf8)
        let action = CommandLine.arguments[1]
        if action == "write" {
            let result = AliciaDiskMemory.shared.respond(method: "POST", content: payload)
            guard result.0 == "200 OK", String(data:result.1, encoding:.utf8)?.contains("\"saved\":true") == true else {
                fatalError("Sauvegarde native non confirmée : \(result.0)")
            }
            print("✓ Mémoire enregistrée sur disque depuis le premier processus.")
        } else if action == "read" {
            let result = AliciaDiskMemory.shared.respond(method: "GET", content: Data())
            guard result.0 == "200 OK",
                  let doc = try? JSONSerialization.jsonObject(with:result.1) as? [String:Any],
                  let examples = doc["examples"] as? [[String:Any]],
                  examples.first?["a"] as? String == "Les échecs." else {
                fatalError("Mémoire non restaurée dans le second processus : \(result.0)")
            }
            print("✓ Deuxième processus : apprentissage « Les échecs » retrouvé.")
        } else {
            fatalError("Argument invalide.")
        }
    }
}
