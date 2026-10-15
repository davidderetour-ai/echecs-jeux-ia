import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/signature_status.dart';

/// Ce suivi ne peut pas vérifier les certificats iOS ou le renouvellement.
class SignatureCard extends StatefulWidget {
  const SignatureCard({super.key});
  @override
  State<SignatureCard> createState() => _SignatureCardState();
}

class _SignatureCardState extends State<SignatureCard> with WidgetsBindingObserver {
  static const keyExpiry = 'alicia_altstore_iphone_expiry_v1';
  DateTime? expiry;
  bool loading = true;
  Timer? refreshClock;
  DateTime now = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadDate();
    refreshClock = Timer.periodic(const Duration(minutes: 15), (_) {
      if (mounted) setState(() => now = DateTime.now());
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      setState(() => now = DateTime.now());
      _loadDate();
    }
  }

  Future<void> _loadDate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(keyExpiry);
      final parsed = raw == null ? null : DateTime.tryParse(raw);
      if (mounted) setState(() { expiry = parsed; loading = false; });
    } catch (_) {
      if (mounted) setState(() { expiry = null; loading = false; });
    }
  }

  Future<void> _editDate() async {
    final today = DateTime.now();
    final choice = await showDatePicker(
      context: context,
      helpText: 'Expiration indiquée dans AltStore',
      initialDate: expiry ?? today.add(const Duration(days: 7)),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (choice == null || !mounted) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(keyExpiry, choice.toIso8601String());
      if (mounted) setState(() { expiry = choice; now = DateTime.now(); });
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible de mémoriser la date.')),
      );
    }
  }

  Future<void> _clearDate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(keyExpiry);
      if (mounted) setState(() => expiry = null);
    } catch (_) {}
  }

  @override
  void dispose() {
    refreshClock?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  String _formatDate(DateTime value) {
    String part(int n) => n.toString().padLeft(2,'0');
    return part(value.day) + '/' + part(value.month) + '/' + value.year.toString();
  }

  @override
  Widget build(BuildContext context) {
    final level = signatureLevel(expiry, now);
    final warn = level == SignatureLevel.due || level == SignatureLevel.soon ||
        level == SignatureLevel.expired;
    final color = level == SignatureLevel.unknown ? Colors.amberAccent :
        warn ? Colors.deepOrangeAccent : Colors.lightGreenAccent;
    final isMac = Platform.isMacOS;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xff202c58), Color(0xff151e45)]),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: warn ? const Color(0xffe59a72) : const Color(0xff627eb8)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(isMac ? Icons.laptop_mac : Icons.verified_user_outlined, color: color, size: 23),
          const SizedBox(width: 9),
          Expanded(child: Text(isMac ? 'Mac · Suivi de l’iPhone' : 'iPhone · Signature AltStore',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14))),
          Icon(Icons.circle, color: color, size: 10),
        ]),
        const SizedBox(height: 8),
        Text(loading ? 'Lecture de la date…' : signatureLabel(expiry, now),
          style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(height: 6),
        Text(isMac
          ? 'Le Mac ne nécessite pas de renouvellement tous les 7 jours. '
            'AltServer peut renouveler l’application iPhone quand les deux appareils communiquent.'
          : 'AltStore tente le renouvellement lorsque le Mac exécute AltServer. '
            'Alicia ne peut pas confirmer ce renouvellement automatiquement.',
          style: const TextStyle(color: Color(0xffc7d5f1), fontSize: 11.5, height: 1.4)),
        if (expiry != null) Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('Date indiquée : ' + _formatDate(expiry!) + ' (saisie manuelle)',
            style: const TextStyle(color: Color(0xffabc1e9), fontSize: 11)),
        ),
        const SizedBox(height: 9),
        Wrap(spacing: 8, runSpacing: 7, children: [
          OutlinedButton.icon(onPressed: _editDate,
            icon: const Icon(Icons.edit_calendar, size: 17),
            label: const Text('Date dans AltStore')),
          if (expiry != null) TextButton(onPressed: _clearDate,
            child: const Text('Effacer la date')),
        ]),
        const Text('Vérifie la date dans AltStore → Mes apps après un renouvellement. '
          'Alicia ne lit pas directement le certificat. '
          'La date n’est pas synchronisée entre Mac et iPhone.',
          style: TextStyle(color: Color(0xff9fb1d4), fontSize: 10.5, height: 1.4)),
      ]),
    );
  }
}
