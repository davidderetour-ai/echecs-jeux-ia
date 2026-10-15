import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import 'services/chat_gateway.dart';
import 'services/network_status.dart';
import 'services/voice.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AliciaNativeApp());
}

class AliciaNativeApp extends StatelessWidget {
  const AliciaNativeApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Alicia — Assistant natif',
    debugShowCheckedModeBanner: false,
    theme: AliciaPalette.theme(),
    home: const AliciaHome(),
  );
}

class ConversationLine {
  const ConversationLine(this.role, this.text);
  final String role;
  final String text;
}

/// Interface Flutter dessinée par le moteur natif de Flutter.
/// Aucun WebView, Safari, Javascript Puter ni écran HTML embarqué.
class AliciaHome extends StatefulWidget {
  const AliciaHome({super.key});
  @override
  State<AliciaHome> createState() => _AliciaHomeState();
}

class _AliciaHomeState extends State<AliciaHome> {
  final _network = AliciaNetwork();
  final _voice = AliciaVoice();
  final _speech = stt.SpeechToText();
  final _composer = TextEditingController();
  final _serverUrl = TextEditingController();
  final _accessCode = TextEditingController();
  final _scroll = ScrollController();

  AliciaChatGateway _gateway = AliciaChatGateway();
  final List<ConversationLine> _history = [];
  bool _demoConversation = true;
  bool _waiting = false;
  bool _listening = false;
  String _mode = 'Général';
  String _style = 'douce';
  String _face = 'souriante';
  String? _feedback;

  @override
  void initState() {
    super.initState();
    unawaited(_network.initialize());
  }

  @override
  void dispose() {
    _composer.dispose();
    _serverUrl.dispose();
    _accessCode.dispose();
    _scroll.dispose();
    _network.dispose();
    unawaited(_voice.stop());
    unawaited(_speech.stop());
    super.dispose();
  }

  void _notify(String text) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), behavior: SnackBarBehavior.floating, duration: const Duration(seconds: 5)),
    );
  }

  Future<void> _speak(String text) async {
    try {
      _voice.style = _style;
      await _voice.speak(text);
    } catch (_) {
      _notify('La synthèse vocale française est indisponible sur cet appareil.');
    }
  }

  Future<void> _express(String kind) async {
    setState(() => _face = kind);
    try {
      await _voice.emotion(kind);
    } catch (_) {
      _notify('Ce son n’est pas disponible sur cet appareil.');
    }
  }

  Future<void> _mic() async {
    if (_listening) {
      await _speech.stop();
      if (mounted) setState(() => _listening = false);
      return;
    }
    try {
      final available = await _speech.initialize(
        onError: (error) { if (mounted) _notify('Dictée : vérifie les autorisations du microphone.'); },
      );
      if (!available) { _notify('Dictée vocale non disponible.'); return; }
      if (mounted) setState(() => _listening = true);
      await _speech.listen(
        localeId: 'fr_FR',
        onResult: (result) {
          if (!mounted) return;
          _composer.text = result.recognizedWords;
          _composer.selection = TextSelection.collapsed(offset: _composer.text.length);
          if (result.finalResult) setState(() => _listening = false);
        },
      );
    } catch (_) {
      if (mounted) setState(() => _listening = false);
      _notify('Impossible de démarrer la dictée. Active le microphone dans les réglages du téléphone.');
    }
  }

  Future<void> _send() async {
    final question = _composer.text.trim();
    if (_waiting || question.isEmpty) return;
    _composer.clear();
    setState(() {
      _demoConversation = false;
      _feedback = null;
      _history.add(ConversationLine('user', question));
      _waiting = true;
    });
    try {
      if (!_network.permitted) throw StateError(
        'Réseau non autorisé : connecte le Wi-Fi ou l’Ethernet. Le mobile est bloqué par défaut.',
      );
      if (!_gateway.configured) throw StateError(
        'Le modèle de discussion natif n’est pas encore configuré. '
        'Ouvre ⚙ et indique un serveur Alicia HTTPS. '
        'L’interface, le réseau et la voix fonctionnent déjà sans Safari.',
      );
      final answer = await _gateway.answer(
        _history.map((m) => {'role': m.role, 'content': m.text}).toList(),
        _mode.toLowerCase(),
      );
      if (!mounted) return;
      setState(() => _history.add(ConversationLine('assistant', answer)));
      unawaited(_speak(answer));
    } catch (error) {
      if (mounted) setState(() => _feedback = error.toString().replaceFirst('Bad state: ', ''));
    } finally {
      if (mounted) setState(() => _waiting = false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  void _openSettings() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF122041),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(20, 24, 20, MediaQuery.viewInsetsOf(sheetContext).bottom + 22),
        child: SingleChildScrollView(child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Réglages natifs d’Alicia', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 10),
            const Text(
              'Cette version ne passe pas par Safari. Le chat nécessite un véritable moteur IA '
              'accessible via HTTPS. Puter et son authentification Web ne sont pas encore reliés à cette app native.',
              style: TextStyle(fontSize: 13, color: AliciaPalette.muted),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _serverUrl,
              keyboardType: TextInputType.url,
              autocorrect: false,
              decoration: const InputDecoration(
                labelText: 'Adresse HTTPS du moteur Alicia',
                hintText: 'https://exemple.fr/.netlify/functions/chat',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _accessCode,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Code d’accès personnel (facultatif)'),
            ),
            const SizedBox(height: 10),
            const Text(
              'Aucun code ni secret n’est enregistré sur le téléphone dans ce prototype. '
              'Une API distante peut être payante ; aucun fournisseur n’est activé automatiquement.',
              style: TextStyle(fontSize: 11, color: AliciaPalette.muted),
            ),
            AnimatedBuilder(
              animation: _network,
              builder: (context, _) => SwitchListTile.adaptive(
                title: const Text('Autoriser les données mobiles'),
                subtitle: const Text('Désactivé par défaut ; privilégier Wi-Fi/Ethernet.'),
                value: _network.allowCellular,
                onChanged: _network.changeCellularPermission,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(width: double.infinity, child: FilledButton(
              onPressed: () {
                try {
                  final text = _serverUrl.text.trim();
                  final Uri? uri = text.isEmpty ? null : AliciaChatGateway.validateEndpoint(text);
                  setState(() => _gateway = AliciaChatGateway(endpoint: uri, accessCode: _accessCode.text));
                  Navigator.pop(sheetContext);
                  _notify(uri == null ? 'Mode démonstration. Aucun serveur IA connecté.' : 'Serveur HTTPS enregistré pour cette session.');
                } catch (e) {
                  _notify('Adresse refusée : entre un véritable serveur Alicia HTTPS.');
                }
              },
              child: const Text('Appliquer les réglages'),
            )),
          ],
        )),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AliciaPalette.backdrop),
        child: SafeArea(
          child: Column(children: [
            _header(),
            Expanded(child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 20),
              children: [
                _hero(),
                const SizedBox(height: 12),
                LayoutBuilder(builder: (context, constraints) {
                  if (constraints.maxWidth < 340) return Column(children: [
                    _voiceCard(), const SizedBox(height: 12), _emotionCard(),
                  ]);
                  return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(child: _voiceCard()),
                    const SizedBox(width: 10),
                    Expanded(child: _emotionCard()),
                  ]);
                }),
                const SizedBox(height: 12),
                _expertise(),
                const SizedBox(height: 12),
                _conversation(),
              ],
            )),
            _inputBar(),
          ]),
        ),
      ),
    );
  }

  Widget _header() => Padding(
    padding: const EdgeInsets.fromLTRB(17, 12, 12, 8),
    child: Row(children: [
      Container(
        width: 45, height: 45,
        decoration: BoxDecoration(
          gradient: AliciaPalette.blueGradient,
          borderRadius: BorderRadius.circular(15),
          boxShadow: const [BoxShadow(color: Color(0x6C7167F8), blurRadius: 18)],
        ),
        alignment: Alignment.center,
        child: const Text('✧', style: TextStyle(fontSize: 32)),
      ),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('ALICIA', style: TextStyle(fontSize: 26, color: Color(0xFFB4C9FF), letterSpacing: 5, fontWeight: FontWeight.w400)),
        Text('Assistant · Code · Diagnostic · Création',
          maxLines: 2, style: TextStyle(fontSize: 9.5, color: AliciaPalette.muted.withValues(alpha: .95))),
      ])),
      IconButton(
        tooltip: 'Réglages du serveur et du réseau',
        onPressed: _openSettings,
        icon: const Icon(Icons.settings_outlined, color: Color(0xFFBBCFFF)),
      ),
    ]),
  );

  Widget _hero() => GlassCard(
    padding: EdgeInsets.zero,
    child: ClipRRect(
      borderRadius: BorderRadius.circular(21),
      child: SizedBox(
        height: 234,
        child: Row(children: [
          Expanded(flex: 52, child: SvgPicture.asset(
            'assets/alicia_portrait.svg',
            fit: BoxFit.cover,
            semanticsLabel: 'Portrait original illustré d’Alicia, cheveux blonds et yeux bleus',
          )),
          Expanded(flex: 48, child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 13),
            decoration: const BoxDecoration(gradient: LinearGradient(
              colors: [Color(0xAA122047), Color(0xFF101A3A)],
            )),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [
                Icon(Icons.circle, color: AliciaPalette.green, size: 9),
                SizedBox(width: 7),
                Expanded(child: Text('Alicia est prête', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 12),
              const Text('Pour expliquer, créer et t’accompagner.', style: TextStyle(
                height: 1.4, fontSize: 12, color: AliciaPalette.muted,
              )),
              const SizedBox(height: 14),
              _tag('✦ Créative'),
              const SizedBox(height: 6),
              _tag('♥ Bienveillante'),
              const SizedBox(height: 6),
              _tag('⌘ Polyvalente'),
              const Spacer(),
              Align(
                alignment: Alignment.centerRight,
                child: Text('Alicia ♡', style: TextStyle(fontSize: 18,
                  fontStyle: FontStyle.italic, color: AliciaPalette.primary.withValues(alpha: .9))),
              ),
            ]),
          )),
        ]),
      ),
    ),
  );

  Widget _tag(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    decoration: BoxDecoration(
      color: const Color(0xFF182856),
      border: Border.all(color: const Color(0xFF4761A2)),
      borderRadius: BorderRadius.circular(30),
    ),
    child: Text(text, style: const TextStyle(fontSize: 10, color: Color(0xFFE1EAFF))),
  );

  Widget _voiceCard() => GlassCard(
    padding: const EdgeInsets.fromLTRB(11, 14, 11, 13),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle(Icons.mic_none_rounded, 'Voix d’Alicia'),
      const SizedBox(height: 12),
      _selectionPill(const Icon(Icons.language, size: 18, color: AliciaPalette.primary), 'Français'),
      const SizedBox(height: 9),
      DropdownButtonHideUnderline(child: DropdownButton<String>(
        isExpanded: true, value: _style,
        dropdownColor: const Color(0xFF1A2C54),
        style: const TextStyle(fontSize: 12, color: AliciaPalette.onSurface),
        items: const [
          DropdownMenuItem(value: 'douce', child: Text('Douce et calme')),
          DropdownMenuItem(value: 'naturelle', child: Text('Naturelle')),
          DropdownMenuItem(value: 'dynamique', child: Text('Dynamique')),
        ],
        onChanged: (v) { if (v != null) setState(() => _style = v); },
      )),
      const SizedBox(height: 12),
      Container(
        width: double.infinity,
        decoration: BoxDecoration(gradient: AliciaPalette.blueGradient, borderRadius: BorderRadius.circular(17)),
        child: TextButton.icon(
          onPressed: () => _speak('Bonjour, je suis Alicia. Comment puis-je t’aider aujourd’hui ?'),
          icon: const Icon(Icons.play_circle_fill, color: Colors.white, size: 19),
          label: const Text('Écouter Alicia', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
        ),
      ),
    ]),
  );

  Widget _selectionPill(Widget icon, String value) => Container(
    width: double.infinity, padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
    decoration: BoxDecoration(
      color: const Color(0xFF1C2B56),
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: AliciaPalette.stroke),
    ),
    child: Row(children: [icon, const SizedBox(width: 7),
      Expanded(child: Text(value, maxLines: 1, overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 12))),
    ]),
  );

  Widget _emotionCard() => GlassCard(
    padding: const EdgeInsets.fromLTRB(11, 14, 11, 13),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle(Icons.sentiment_satisfied_alt, 'Émotions'),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _emotionButton('😂', 'Rire', 'rire')),
        const SizedBox(width: 7),
        Expanded(child: _emotionButton('😢', 'Tristesse', 'tristesse')),
      ]),
      const SizedBox(height: 7),
      Row(children: [
        Expanded(child: _emotionButton('😨', 'Peur', 'peur')),
        const SizedBox(width: 7),
        Expanded(child: _emotionButton('😠', 'Colère', 'colere')),
      ]),
      const SizedBox(height: 7),
      Text('Expression : $_face',
        maxLines: 1, overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 10, color: AliciaPalette.muted)),
    ]),
  );

  Widget _emotionButton(String emoji, String label, String kind) => InkWell(
    onTap: () => _express(kind),
    borderRadius: BorderRadius.circular(14),
    child: Container(
      height: 70,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kind == 'colere' ? const Color(0xFF9E4971) : AliciaPalette.stroke),
        gradient: LinearGradient(colors: kind == 'colere'
          ? [const Color(0xFF452743), const Color(0xFF21162D)]
          : [const Color(0xFF2A315F), const Color(0xFF182348)]),
      ),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(emoji, style: const TextStyle(fontSize: 26)),
        const SizedBox(height: 3),
        Text(label, maxLines: 1, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600)),
      ]),
    ),
  );

  Widget _sectionTitle(IconData icon, String title) => Row(children: [
    Icon(icon, size: 21, color: AliciaPalette.primary),
    const SizedBox(width: 6),
    Flexible(child: Text(title, maxLines: 1, style: const TextStyle(
      fontSize: 14.5, fontWeight: FontWeight.w700, color: AliciaPalette.onSurface))),
  ]);

  Widget _expertise() => GlassCard(
    padding: const EdgeInsets.all(14),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle(Icons.extension_outlined, 'Mode d’expertise'),
      const SizedBox(height: 11),
      Wrap(spacing: 7, runSpacing: 7, children: [
        for (final mode in const ['Général', 'Code', 'Réparation', 'Création', 'Professeur'])
          ChoiceChip(
            label: Text(mode, style: TextStyle(
              fontSize: 11.5,
              color: _mode == mode ? const Color(0xFF0C1334) : AliciaPalette.onSurface,
              fontWeight: _mode == mode ? FontWeight.bold : FontWeight.normal,
            )),
            selected: _mode == mode,
            showCheckmark: false,
            selectedColor: const Color(0xFF99CAFF),
            backgroundColor: const Color(0xFF1C2A56),
            side: const BorderSide(color: Color(0xFF4D61A0)),
            onSelected: (_) => setState(() => _mode = mode),
          ),
      ]),
    ]),
  );

  Widget _conversation() => GlassCard(
    padding: const EdgeInsets.all(14),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: _sectionTitle(Icons.chat_bubble_outline, 'Conversation')),
        TextButton(
          onPressed: () => setState(() {
            _history.clear(); _demoConversation = false; _feedback = null;
          }),
          child: const Text('Effacer', style: TextStyle(fontSize: 11)),
        ),
      ]),
      const SizedBox(height: 12),
      if (_demoConversation) ...[
        const Text('Aperçu visuel · conversation d’exemple', style: TextStyle(
          color: AliciaPalette.muted, fontSize: 10.5)),
        const SizedBox(height: 10),
        _bubble('Peux-tu m’expliquer une batterie lithium ?', 'user'),
        _bubble('Une batterie stocke et restitue de l’énergie grâce au déplacement d’ions lithium.',
          'assistant'),
      ] else if (_history.isEmpty) ...[
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Text('Écris un message ou utilise la dictée. Connecte d’abord ton modèle IA dans ⚙.',
            style: TextStyle(color: AliciaPalette.muted, fontSize: 12)),
        ),
      ] else ...[
        for (final message in _history) _bubble(message.text, message.role),
      ],
      if (_waiting) const Padding(
        padding: EdgeInsets.all(8),
        child: Row(children: [SizedBox(height: 15, width: 15, child: CircularProgressIndicator(strokeWidth: 2)),
          SizedBox(width: 10), Text('Alicia attend le moteur IA…')]),
      ),
      if (_feedback != null) Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(_feedback!, style: const TextStyle(fontSize: 12, color: AliciaPalette.orange)),
      ),
    ]),
  );

  Widget _bubble(String text, String role) => Align(
    alignment: role == 'user' ? Alignment.centerRight : Alignment.centerLeft,
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 350),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(17),
          border: Border.all(color: role == 'user' ? const Color(0xFF7883FF) : AliciaPalette.stroke),
          color: role == 'user' ? const Color(0xFF323F91) : const Color(0xFF202C55),
        ),
        child: Text(text, style: const TextStyle(fontSize: 12.5, height: 1.45, color: AliciaPalette.onSurface)),
      ),
    ),
  );

  Widget _inputBar() => Container(
    padding: const EdgeInsets.fromLTRB(10, 10, 10, 13),
    decoration: const BoxDecoration(
      border: Border(top: BorderSide(color: Color(0xFF334D8F))),
      color: Color(0xF7101834),
    ),
    child: Row(children: [
      IconButton.filledTonal(
        tooltip: _listening ? 'Arrêter la dictée' : 'Dicter une question',
        onPressed: _mic,
        icon: Icon(_listening ? Icons.stop_circle_outlined : Icons.mic_none, color: AliciaPalette.primary),
      ),
      const SizedBox(width: 7),
      Expanded(child: TextField(
        controller: _composer,
        minLines: 1, maxLines: 3,
        textCapitalization: TextCapitalization.sentences,
        textInputAction: TextInputAction.send,
        onSubmitted: (_) => _send(),
        style: const TextStyle(fontSize: 15, color: AliciaPalette.onSurface),
        decoration: InputDecoration(
          hintText: 'Écris ton message à Alicia…',
          hintStyle: const TextStyle(fontSize: 12, color: AliciaPalette.muted),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
        ),
      )),
      const SizedBox(width: 8),
      Container(
        decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AliciaPalette.blueGradient),
        child: IconButton(
          tooltip: 'Envoyer',
          onPressed: _waiting ? null : _send,
          icon: const Icon(Icons.send_rounded, color: Colors.white),
        ),
      ),
    ]),
  );
}
