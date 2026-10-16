import 'dart:math' as math;
import 'dart:typed_data';
import 'package:audioplayers/audioplayers.dart';

/// Effets de synthèse originaux, 100 % locaux : ce ne sont pas des voix
/// enregistrées ni des émotions réellement ressenties par l'assistant.
enum AliciaEmotion { laugh, sadness, fear, anger }

class AliciaEmotionAudio {
  final AudioPlayer _player = AudioPlayer();

  Future<void> play(AliciaEmotion emotion) async {
    await _player.stop();
    await _player.play(
      BytesSource(synthesizeEmotionWav(emotion), mimeType: 'audio/wav'),
    );
  }

  Future<void> stop() => _player.stop();
  Future<void> dispose() => _player.dispose();
}

/// Fichier WAV PCM 16 bits/mono, généré hors connexion (pas de clé API).
Uint8List synthesizeEmotionWav(AliciaEmotion emotion) {
  const rate = 22050;
  final duration = switch (emotion) {
    AliciaEmotion.laugh => 1.55,
    AliciaEmotion.sadness => 1.95,
    AliciaEmotion.fear => 1.25,
    AliciaEmotion.anger => 1.45,
  };
  final length = (duration * rate).round();
  final bytes = ByteData(44 + length * 2);
  void chars(int pos, String value) {
    for (var i = 0; i < value.length; i++) {
      bytes.setUint8(pos + i, value.codeUnitAt(i));
    }
  }
  chars(0, 'RIFF');
  bytes.setUint32(4, 36 + length * 2, Endian.little);
  chars(8, 'WAVE');
  chars(12, 'fmt ');
  bytes.setUint32(16, 16, Endian.little);
  bytes.setUint16(20, 1, Endian.little);
  bytes.setUint16(22, 1, Endian.little);
  bytes.setUint32(24, rate, Endian.little);
  bytes.setUint32(28, rate * 2, Endian.little);
  bytes.setUint16(32, 2, Endian.little);
  bytes.setUint16(34, 16, Endian.little);
  chars(36, 'data');
  bytes.setUint32(40, length * 2, Endian.little);

  for (var i = 0; i < length; i++) {
    final t = i / rate;
    final phase = switch (emotion) {
      AliciaEmotion.laugh => (t * 4.8) % 1.0,
      AliciaEmotion.sadness => (t * 1.5) % 1.0,
      AliciaEmotion.fear => (t * 5.8) % 1.0,
      AliciaEmotion.anger => (t * 2.6) % 1.0,
    };
    final gate = switch (emotion) {
      AliciaEmotion.laugh => math.pow(math.sin(math.pi * phase), 4).toDouble(),
      AliciaEmotion.sadness => math.sin(math.pi * phase).abs(),
      AliciaEmotion.fear => math.pow(math.sin(math.pi * phase), 2).toDouble(),
      AliciaEmotion.anger => math.sin(math.pi * phase).abs(),
    };
    final pitch = switch (emotion) {
      AliciaEmotion.laugh => 300 + 58 * math.sin(2 * math.pi * t * 3),
      AliciaEmotion.sadness => 240 - 50 * phase + 12 * math.sin(2 * math.pi * t * 5),
      AliciaEmotion.fear => 430 + 120 * math.sin(2 * math.pi * t * 8),
      AliciaEmotion.anger => 135 - 26 * phase + 9 * math.sin(2 * math.pi * t * 7),
    };
    // Vibrato continu via intégrale approchée de fréquence variable.
    final wave = math.sin(2 * math.pi * t * pitch);
    final envelope = math.min(1.0, math.min(t * 17, (duration - t) * 15));
    final value = (wave * gate * envelope * 0.24).clamp(-1.0, 1.0);
    bytes.setInt16(44 + i * 2, (value * 32767).round(), Endian.little);
  }
  return bytes.buffer.asUint8List();
}
