import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alicia_native/services/chat_gateway.dart';
import 'package:alicia_native/services/network_status.dart';

void main() {
  group('Réseaux mobiles natifs', () {
    test('Wi-Fi détecté comme Wi-Fi, non comme Ethernet', () {
      expect(classifyConnection([ConnectivityResult.wifi]), LinkKind.wifi);
    });
    test('Ethernet détecté séparément', () {
      expect(classifyConnection([ConnectivityResult.ethernet]), LinkKind.ethernet);
    });
    test('Le mobile est bloqué par défaut', () {
      final n = AliciaNetwork();
      n.update([ConnectivityResult.mobile]);
      expect(n.permitted, false);
      n.changeCellularPermission(true);
      expect(n.permitted, true);
      n.dispose();
    });
    test('Pas de réseau signifie pas de requêtes', () {
      final n = AliciaNetwork();
      n.update([ConnectivityResult.none]);
      expect(n.permitted, false);
      n.dispose();
    });
    test('Liaison physique ne prouve pas Internet disponible', () {
      expect(classifyConnection([ConnectivityResult.other]), LinkKind.other);
    });
  });

  group('Passerelle IA native', () {
    test('Autorise un serveur HTTPS configuré', () {
      final url = AliciaChatGateway.validateEndpoint('https://alicia.exemple.fr/api/chat');
      expect(url.scheme, 'https');
    });
    test('Refuse une URL HTTP non chiffrée sur un réseau privé', () {
      expect(
        () => AliciaChatGateway.validateEndpoint('http://192.168.1.1:8765/api/local/chat'),
        throwsFormatException,
      );
    });
    test('N’accepte pas de secret dans les paramètres de l’URL', () {
      expect(() => AliciaChatGateway.validateEndpoint('https://utilisateur:secret@exemple.fr/'),
        throwsFormatException);
    });
    test('Aucun appel automatique sans moteur', () {
      expect(AliciaChatGateway().configured, false);
    });
  });
}
