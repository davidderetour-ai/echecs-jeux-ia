import 'package:flutter/material.dart';

/// Palette inspirée de la maquette utilisateur. Aucun navigateur intégré.
abstract final class AliciaPalette {
  static const background = Color(0xFF080E22);
  static const surface = Color(0xFF131F42);
  static const stroke = Color(0xFF51639F);
  static const primary = Color(0xFF6BB9FF);
  static const secondary = Color(0xFF9F70FF);
  static const onSurface = Color(0xFFEAF2FF);
  static const muted = Color(0xFFB8C8E6);
  static const green = Color(0xFF2CE89D);
  static const red = Color(0xFFFF5575);
  static const orange = Color(0xFFFFC46D);
  static const blueGradient = LinearGradient(
    colors: [Color(0xFF47ABFC), Color(0xFF6F74F5), Color(0xFFAF5AE9)],
  );
  static const backdrop = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF071028), Color(0xFF162251), Color(0xFF090E24)],
  );
  static ThemeData theme() => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    colorScheme: const ColorScheme.dark(primary: primary, secondary: secondary, surface: surface),
    textTheme: const TextTheme(
      bodyMedium: TextStyle(fontSize: 14, color: onSurface),
      titleLarge: TextStyle(fontSize: 20, color: onSurface, fontWeight: FontWeight.bold),
      titleMedium: TextStyle(fontSize: 16, color: onSurface, fontWeight: FontWeight.w700),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF1C2D59),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: stroke)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: stroke)),
    ),
  );
}

class GlassCard extends StatelessWidget {
  const GlassCard({super.key, required this.child, this.padding = const EdgeInsets.all(16)});
  final Widget child;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AliciaPalette.stroke.withValues(alpha: .72)),
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1C2B56), Color(0xFF0E1938)],
      ),
      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .32), blurRadius: 22, offset: const Offset(0, 9))],
    ),
    child: child,
  );
}
