import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

enum LinkKind { wifi, ethernet, cellular, offline, other }

/// Détecte la famille de réseau par plugin natif ; ne lit jamais le SSID.
LinkKind classifyConnection(List<ConnectivityResult> routes) {
  if (routes.isEmpty || (routes.length == 1 && routes.contains(ConnectivityResult.none))) {
    return LinkKind.offline;
  }
  if (routes.contains(ConnectivityResult.ethernet)) return LinkKind.ethernet;
  if (routes.contains(ConnectivityResult.wifi)) return LinkKind.wifi;
  if (routes.contains(ConnectivityResult.mobile)) return LinkKind.cellular;
  return LinkKind.other;
}

class AliciaNetwork extends ChangeNotifier {
  AliciaNetwork({Connectivity? connectivity}) : _connectivity = connectivity ?? Connectivity();
  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  LinkKind link = LinkKind.other;
  bool allowCellular = false;

  bool get permitted => link == LinkKind.wifi || link == LinkKind.ethernet || (allowCellular && link == LinkKind.cellular);
  bool get isOnlineLink => link != LinkKind.offline && link != LinkKind.other;
  String get label => switch (link) {
    LinkKind.wifi => 'Wi-Fi détecté',
    LinkKind.ethernet => 'Ethernet détecté',
    LinkKind.cellular => allowCellular ? 'Réseau mobile autorisé' : 'Réseau mobile bloqué',
    LinkKind.offline => 'Hors ligne',
    LinkKind.other => 'Connexion à vérifier',
  };
  void changeCellularPermission(bool value) { allowCellular = value; notifyListeners(); }
  void update(List<ConnectivityResult> routes) {
    link = classifyConnection(routes);
    notifyListeners();
  }
  Future<void> initialize() async {
    try { update(await _connectivity.checkConnectivity()); } catch (_) { link = LinkKind.other; notifyListeners(); }
    _subscription = _connectivity.onConnectivityChanged.listen(update, onError: (_) { link = LinkKind.other; notifyListeners(); });
  }
  @override
  void dispose() { _subscription?.cancel(); super.dispose(); }
}
