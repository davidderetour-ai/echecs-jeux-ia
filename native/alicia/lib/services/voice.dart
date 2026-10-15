import 'package:flutter_tts/flutter_tts.dart';

/// Synthèse via les voix du système iOS/Android, sans clonage de voix humaine.
class AliciaVoice {
  AliciaVoice({FlutterTts? engine}) : _engine = engine ?? FlutterTts();
  final FlutterTts _engine;
  String style = 'douce';

  Future<void> speak(String text) async {
    if (text.trim().isEmpty) return;
    await _engine.setLanguage('fr-FR');
    final rate = switch (style) { 'naturelle' => .5, 'dynamique' => .57, _ => .45 };
    final pitch = switch (style) { 'dynamique' => 1.08, 'naturelle' => 1.0, _ => 1.05 };
    await _engine.setSpeechRate(rate);
    await _engine.setPitch(pitch);
    await _engine.speak(text.length > 2200 ? text.substring(0, 2200) : text);
  }

  Future<void> emotion(String kind) async {
    final phrase = switch (kind) {
      'rire' => 'Ha ha ha !',
      'tristesse' => 'Oh... Snif... c’est triste.',
      'peur' => 'Oh ! J’ai eu peur !',
      'colere' => 'Grrr ! Je ne suis pas contente !',
      _ => '',
    };
    await stop();
    if (phrase.isNotEmpty) await speak(phrase);
  }

  Future<void> stop() async { await _engine.stop(); }
}
