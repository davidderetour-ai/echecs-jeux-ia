import 'package:flutter_test/flutter_test.dart';
import 'package:alicia_native/services/signature_status.dart';

void main() {
  final now = DateTime(2026, 10, 15);
  test('Aucun score ou délai inventé avant la saisie d’une date', () {
    expect(signatureLevel(null, now), SignatureLevel.unknown);
    expect(signatureLabel(null, now), contains('non renseignée'));
  });
  test('Sept jours calculés à partir de la date choisie', () {
    final expiry = DateTime(2026, 10, 22);
    expect(calendarDaysRemaining(expiry, now), 7);
    expect(signatureLevel(expiry, now), SignatureLevel.valid);
  });
  test('Alerte 2 jours avant l’échéance', () {
    expect(signatureLevel(DateTime(2026, 10, 17), now), SignatureLevel.soon);
    expect(signatureLevel(DateTime(2026, 10, 16), now), SignatureLevel.soon);
  });
  test('Échéance le jour même et date dépassée', () {
    expect(signatureLevel(DateTime(2026, 10, 15), now), SignatureLevel.due);
    expect(signatureLevel(DateTime(2026, 10, 14), now), SignatureLevel.expired);
  });
  test('Comparaison du calendrier local, indépendamment de l’heure', () {
    expect(calendarDaysRemaining(
      DateTime(2026, 10, 17, 2), DateTime(2026, 10, 15, 22)), 2);
  });
}
