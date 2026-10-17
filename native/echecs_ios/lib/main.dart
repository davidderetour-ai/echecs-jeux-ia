import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'local_game_server.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NativeChessApp());
}

class NativeChessApp extends StatelessWidget {
  const NativeChessApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Échecs & Jeux IA',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff13243e)),
      ),
      home: const NativeChessScreen(),
    );
  }
}

class NativeChessScreen extends StatefulWidget {
  const NativeChessScreen({super.key});

  @override
  State<NativeChessScreen> createState() => _NativeChessScreenState();
}

class _NativeChessScreenState extends State<NativeChessScreen> {
  final LocalGameServer _server = LocalGameServer();
  WebViewController? _web;
  String? _problem;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    unawaited(_open());
  }

  Future<void> _open() async {
    try {
      final url = await _server.start();
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(const Color(0xfff4f6fb))
        ..setNavigationDelegate(NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (e) {
            if (e.isForMainFrame == true && mounted) {
              setState(() => _problem = 'Impossible de charger le jeu : ${e.description}');
            }
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null && uri.host == '127.0.0.1' &&
                uri.port == LocalGameServer.port && uri.scheme == 'http') {
              return NavigationDecision.navigate;
            }
            if (uri != null && uri.scheme == 'https') {
              unawaited(launchUrl(uri, mode: LaunchMode.externalApplication));
            }
            return NavigationDecision.prevent;
          },
        ));
      await controller.loadRequest(url);
      if (mounted) setState(() {
        _web = controller;
        _problem = null;
      });
    } catch (error) {
      if (mounted) setState(() {
        _problem = 'Impossible de démarrer les jeux hors ligne : $error';
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    unawaited(_server.stop());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: _problem != null
            ? Center(child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 45),
                  const SizedBox(height: 12),
                  Text(_problem!, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  const Text('Aucune sauvegarde locale n’a été effacée.'),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: _open, child: const Text('Réessayer')),
                ]),
              ))
            : Stack(children: [
                if (_web != null) Positioned.fill(child: WebViewWidget(controller: _web!)),
                if (_loading) const Align(
                  alignment: Alignment.topCenter,
                  child: LinearProgressIndicator(minHeight: 3),
                ),
              ]),
      ),
    );
  }
}
