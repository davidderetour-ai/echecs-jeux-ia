/// Dates de signature renseignées volontairement depuis AltStore.
/// Ce décompte n'atteste PAS un renouvellement effectif.
enum SignatureLevel { unknown, valid, soon, due, expired }

int calendarDaysRemaining(DateTime expiry, DateTime now) {
  final date = DateTime.utc(expiry.year, expiry.month, expiry.day);
  final current = DateTime.utc(now.year, now.month, now.day);
  return date.difference(current).inDays;
}

SignatureLevel signatureLevel(DateTime? expiry, DateTime now) {
  if (expiry == null) return SignatureLevel.unknown;
  final days = calendarDaysRemaining(expiry, now);
  if (days < 0) return SignatureLevel.expired;
  if (days == 0) return SignatureLevel.due;
  if (days <= 2) return SignatureLevel.soon;
  return SignatureLevel.valid;
}

String signatureLabel(DateTime? expiry, DateTime now) {
  if (expiry == null) return 'Expiration non renseignée';
  final days = calendarDaysRemaining(expiry, now);
  if (days < 0) return 'Date déclarée dépassée';
  if (days == 0) return 'Expiration déclarée aujourd’hui';
  if (days == 1) return '1 jour restant (déclaré)';
  return '$days jours restants (déclarés)';
}
