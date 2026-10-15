import 'package:connectivity_plus/connectivity_plus.dart';

/// Indique le type de liaison rapporté par le système, PAS le nom/SSID du Wi-Fi.
/// Être connecté au Wi-Fi ne garantit pas l'accès Internet ni l'absence de bascule.
enum NetworkKind { wifi, ethernet, cellular, disconnected, unknown }

NetworkKind classifyNetwork(List<ConnectivityResult> results) {
  if (results.contains(ConnectivityResult.wifi)) return NetworkKind.wifi;
  if (results.contains(ConnectivityResult.ethernet)) return NetworkKind.ethernet;
  if (results.contains(ConnectivityResult.mobile)) return NetworkKind.cellular;
  if (results.isEmpty || results.every((x) => x == ConnectivityResult.none)) {
    return NetworkKind.disconnected;
  }
  return NetworkKind.unknown;
}

extension NetworkKindPresentation on NetworkKind {
  String get title => switch (this) {
    NetworkKind.wifi => 'Wi-Fi',
    NetworkKind.ethernet => 'Ethernet',
    NetworkKind.cellular => 'Réseau mobile · IA bloquée',
    NetworkKind.disconnected => 'Déconnecté',
    NetworkKind.unknown => 'Réseau à vérifier',
  };
  bool get canUseAiNetwork => this == NetworkKind.wifi || this == NetworkKind.ethernet;
}
