import Foundation
import Security

// Alicia Mac 0.4.1 : accès réseau natif à l'API Puter officielle.
// Big Sur ne peut pas initialiser la bibliothèque JS moderne : URLSession fonctionne
// indépendamment de la version de WebKit. Chaque requête nécessite un clic sur Envoyer.
// Le jeton personnel reste dans le Trousseau du Mac, jamais dans GitHub ni localStorage.
final class AliciaNativePuter {
    static let shared = AliciaNativePuter()
    private let service = "fr.alicia.mac.puter.v041"
    private let account = "personal-api-token"

    typealias Reply = (status: String, mime: String, body: Data)

    private func json(_ obj: [String: Any], status: String = "200 OK") -> Reply {
        let data = (try? JSONSerialization.data(withJSONObject: obj, options: []))
            ?? Data(#"{"error":"Erreur d'encodage JSON"}"#.utf8)
        return (status, "application/json; charset=utf-8", data)
    }
    private func error(_ message: String, _ status: String = "400 Bad Request") -> Reply {
        json(["error": message], status: status)
    }
    private func baseQuery() -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
    }
    private func readToken() -> String? {
        var query = baseQuery()
        query[kSecReturnData as String] = kCFBooleanTrue
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    private func setToken(_ token: String) -> Bool {
        let data = Data(token.utf8)
        // Le jeton ne doit pas se retrouver dans une sauvegarde synchronisée iCloud.
        var query = baseQuery()
        query.removeValue(forKey: kSecMatchLimit as String)
        let attributes: [String: Any] = [kSecValueData as String: data]
        let update = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if update == errSecSuccess { return true }
        guard update == errSecItemNotFound else { return false }
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }
    private func deleteToken() -> Bool {
        var query = baseQuery()
        query.removeValue(forKey: kSecMatchLimit as String)
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
    private func errorMessage(_ data: Data) -> String {
        if let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let nested = value["error"] as? [String: Any], let message = nested["message"] as? String {
                return String(message.prefix(260))
            }
            if let message = value["error"] as? String { return String(message.prefix(260)) }
            if let message = value["message"] as? String { return String(message.prefix(260)) }
        }
        return "Le serveur distant a rejeté la demande."
    }
    func respond(path: String, method: String, body: Data) -> Reply? {
        guard path.hasPrefix("/api/native-puter/") else { return nil }
        switch (path, method) {
        case ("/api/native-puter/status", "GET"):
            return json([
                "configured": readToken() != nil,
                "mode": "Puter REST natif",
                "message": readToken() == nil
                    ? "Compte Puter non configuré : crée un jeton personnel dans le tableau de bord Puter et colle-le ici."
                    : "Jeton Puter enregistré dans le Trousseau de ce Mac. Teste une question.",
            ])
        case ("/api/native-puter/token", "POST"):
            guard let object = try? JSONSerialization.jsonObject(with: body) as? [String: Any],
                  let token = object["token"] as? String else {
                return error("Jeton Puter invalide.")
            }
            let cleaned = token.trimmingCharacters(in: .whitespacesAndNewlines)
            guard cleaned.count >= 20 && cleaned.count <= 2048 && !cleaned.contains(" ")
                    && !cleaned.contains("\n") else {
                return error("Le jeton Puter paraît incomplet. Aucun identifiant n'a été sauvegardé.")
            }
            guard setToken(cleaned) else {
                return error("Le Trousseau du Mac a refusé l'enregistrement du jeton.", "500 Internal Server Error")
            }
            return json(["configured": true, "message": "Jeton conservé dans le Trousseau du Mac. Aucun achat effectué."])
        case ("/api/native-puter/token", "DELETE"):
            guard deleteToken() else { return error("Impossible d'effacer le jeton.", "500 Internal Server Error") }
            return json(["configured": false, "message": "Jeton personnel effacé du Trousseau du Mac."])
        case ("/api/native-puter/chat", "POST"):
            return chat(body)
        default:
            return error("Adresse native indisponible.", "404 Not Found")
        }
    }
    private func chat(_ data: Data) -> Reply {
        guard let token = readToken() else {
            return error("Jeton Puter absent. Ouvre « Connexion IA native » pour l'enregistrer.", "428 Precondition Required")
        }
        guard let jsonBody = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let messages = jsonBody["messages"] as? [[String: Any]] else {
            return error("La conversation transmise au moteur IA n'est pas valide.")
        }
        var cleaned: [[String: String]] = [[
            "role": "system",
            "content": "Tu es Alicia, assistante personnelle en français. Réponds clairement, honnêtement, avec prudence. N'invente pas de recherches Web, de modifications système ou de fichiers exécutés. Aucun achat ni action automatique.",
        ]]
        for item in messages.suffix(12) {
            guard let role = item["role"] as? String,
                  (role == "user" || role == "assistant"),
                  let content = item["content"] as? String,
                  !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { continue }
            cleaned.append(["role": role, "content": String(content.prefix(4800))])
        }
        guard cleaned.count >= 2, cleaned.last?["role"] == "user" else {
            return error("Écris une question avant d'envoyer.")
        }
        guard let url = URL(string: "https://api.puter.com/puterai/openai/v1/chat/completions") else {
            return error("Adresse du fournisseur invalide.", "500 Internal Server Error")
        }
        let payload: [String: Any] = [
            "model": "gpt-5.4-nano",
            "messages": cleaned,
            "max_tokens": 450,
            "stream": false,
        ]
        guard let encoded = try? JSONSerialization.data(withJSONObject: payload) else {
            return error("Impossible de préparer le message.")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = encoded
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 32
        configuration.timeoutIntervalForResource = 40
        let session = URLSession(configuration: configuration)
        var responseData: Data?
        var responseCode = 0
        var responseError: Error?
        let semaphore = DispatchSemaphore(value: 0)
        let task = session.dataTask(with: request) { data, response, error in
            responseData = data
            responseCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            responseError = error
            semaphore.signal()
        }
        task.resume()
        if semaphore.wait(timeout: .now() + 43) == .timedOut {
            task.cancel()
            session.invalidateAndCancel()
            return error("Le serveur Puter ne répond pas après 43 secondes. Réessaie plus tard.", "504 Gateway Timeout")
        }
        session.finishTasksAndInvalidate()
        if let failure = responseError {
            return error("Connexion HTTPS impossible : \(failure.localizedDescription)", "503 Service Unavailable")
        }
        guard let received = responseData, received.count <= 1_000_000 else {
            return error("Puter a renvoyé une réponse vide ou trop volumineuse.", "502 Bad Gateway")
        }
        guard (200...299).contains(responseCode) else {
            let explanation = errorMessage(received)
            return error("Puter (code \(responseCode)) : \(explanation). Aucun paiement automatique.", "502 Bad Gateway")
        }
        guard let result = try? JSONSerialization.jsonObject(with: received) as? [String: Any],
              let choices = result["choices"] as? [[String: Any]],
              let first = choices.first,
              let message = first["message"] as? [String: Any],
              let answer = message["content"] as? String, !answer.isEmpty else {
            return error("Puter a répondu mais aucun texte n'a été reçu.", "502 Bad Gateway")
        }
        return json(["answer": answer, "provider": "Puter REST natif", "local": false,
                     "verified": false, "sources": []])
    }
}
