import 'dart:convert';
import 'dart:io';

/// Client réseau natif. HTTPS obligatoire (localhost HTTP réservé aux simulateurs).
/// Ne dépend ni de Safari, ni d'une clé API publique dans le code.
class AliciaChatGateway {
  AliciaChatGateway({this.endpoint, this.accessCode});
  final Uri? endpoint;
  final String? accessCode;
  bool get configured => endpoint != null;

  static Uri validateEndpoint(String text) {
    final uri = Uri.tryParse(text.trim());
    if (uri == null || !uri.hasAuthority ||
        (uri.scheme != 'https' &&
            !(uri.scheme == 'http' && (uri.host == 'localhost' || uri.host == '127.0.0.1')))) {
      throw const FormatException('Adresse HTTPS complète requise. HTTP réservé à localhost.');
    }
    if (uri.userInfo.isNotEmpty || uri.hasFragment) {
      throw const FormatException('Adresse non autorisée.');
    }
    return uri;
  }

  Future<String> answer(List<Map<String, String>> messages, String mode) async {
    final target = endpoint;
    if (target == null) {
      throw StateError('Aucun moteur IA natif connecté. Configure une adresse HTTPS de serveur Alicia.');
    }
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 12);
    try {
      final request = await client.postUrl(target).timeout(const Duration(seconds: 15));
      request.headers.contentType = ContentType.json;
      if ((accessCode ?? '').trim().isNotEmpty) {
        request.headers.set('X-App-Code', accessCode!.trim());
      }
      final history = messages.take(12).map((entry) {
        final raw = entry['content'] ?? '';
        return {
          'role': entry['role'] == 'assistant' ? 'assistant' : 'user',
          'content': raw.length > 5000 ? raw.substring(0, 5000) : raw,
        };
      }).toList();
      request.add(utf8.encode(jsonEncode({
        'messages': history, 'mode': mode,
        'verify': false, 'web': false, 'review': false, 'notes': <String>[],
      })));
      final response = await request.close().timeout(const Duration(seconds: 60));
      if (response.contentLength > 1000000) {
        throw const FormatException('Réponse trop volumineuse.');
      }
      final output = await utf8.decoder.bind(response).join().timeout(const Duration(seconds: 60));
      if (output.length > 1000000) throw const FormatException('Réponse trop volumineuse.');
      final data = jsonDecode(output);
      if (data is! Map) throw const FormatException('Réponse serveur invalide.');
      if (response.statusCode != 200) {
        throw StateError((data['error'] ?? 'Serveur indisponible').toString());
      }
      final result = data['answer'];
      if (result is! String || result.trim().isEmpty) {
        throw const FormatException('Réponse IA vide.');
      }
      return result.trim();
    } finally {
      client.close(force: true);
    }
  }
}
