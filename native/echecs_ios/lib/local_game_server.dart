import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'asset_catalog.dart';

/// Les fichiers sont embarqués dans l'application iOS. Aucune requête réseau
/// extérieure n'est nécessaire pour jouer contre les moteurs locaux.
class LocalGameServer {
  static const int port = 47821;
  HttpServer? _server;

  static String? safePath(String requestPath) {
    if (requestPath == '/' || requestPath.isEmpty) return 'index.html';
    if (!requestPath.startsWith('/') ||
        requestPath.contains('\\') ||
        requestPath.contains('\u0000')) {
      return null;
    }
    // Uri.pathSegments produit les segments décodés ; bloquer les ascensions.
    final parts = requestPath.split('/');
    if (parts.any((part) => part == '..' || part == '.')) return null;
    final name = parts.skip(1).join('/');
    if (name.isEmpty || name.startsWith('/')) return null;
    return name;
  }

  static ContentType typeFor(String file) {
    final ext = file.split('.').last.toLowerCase();
    switch (ext) {
      case 'html': return ContentType('text', 'html', charset: 'utf-8');
      case 'js':
      case 'mjs': return ContentType('text', 'javascript', charset: 'utf-8');
      case 'css': return ContentType('text', 'css', charset: 'utf-8');
      case 'json':
      case 'webmanifest': return ContentType('application', 'json', charset: 'utf-8');
      case 'svg': return ContentType('image', 'svg+xml');
      case 'png': return ContentType('image', 'png');
      case 'jpg':
      case 'jpeg': return ContentType('image', 'jpeg');
      case 'webp': return ContentType('image', 'webp');
      case 'gif': return ContentType('image', 'gif');
      case 'woff2': return ContentType('font', 'woff2');
      case 'pdf': return ContentType('application', 'pdf');
      case 'wasm': return ContentType('application', 'wasm');
      default: return ContentType.binary;
    }
  }

  Future<Uri> start() async {
    if (_server != null) {
      return Uri.parse('http://127.0.0.1:$port/index.html');
    }
    // Port stable : conserver la même origine WKWebView entre mises à jour
    // pour garder les parties et les réglages dans son localStorage privé.
    _server = await HttpServer.bind(InternetAddress.loopbackIPv4, port);
    _server!.listen((request) {
      unawaited(_serve(request));
    });
    return Uri.parse('http://127.0.0.1:$port/index.html');
  }

  Future<void> _serve(HttpRequest request) async {
    final response = request.response;
    try {
      if (request.method != 'GET' && request.method != 'HEAD') {
        response.statusCode = HttpStatus.methodNotAllowed;
        return;
      }
      final path = safePath(request.uri.path);
      if (path == null || !gameAssetPaths.contains(path)) {
        response.statusCode = HttpStatus.notFound;
        return;
      }
      final bytes = await rootBundle.load('assets/game_web/$path');
      response.headers.contentType = typeFor(path);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Access-Control-Allow-Origin', 'http://127.0.0.1:$port');
      response.contentLength = bytes.lengthInBytes;
      if (request.method == 'GET') {
        response.add(bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes));
      }
    } catch (_) {
      if (!response.headersSent) response.statusCode = HttpStatus.internalServerError;
    } finally {
      await response.close();
    }
  }

  Future<void> stop() async {
    await _server?.close(force: true);
    _server = null;
  }
}
