import 'package:flutter/material.dart';

/// Tema VAN MOD: brutalisme minimalis.
///
/// Gelap pekat, garis tegas 1px, bayangan keras tanpa blur, dan aksen lime
/// yang dipakai seperlunya — tegas tapi adem dipandang.
class VanTheme {
  static const Color bg = Color(0xFF0A0C08);
  static const Color surface = Color(0xFF11150E);
  static const Color surface2 = Color(0xFF1A2013);
  static const Color line = Color(0xFF26301F);
  static const Color lime = Color(0xFFB2F800);
  static const Color text = Color(0xFFEDF3E4);
  static const Color muted = Color(0xFF8B987D);
  static const Color danger = Color(0xFFFF5C5C);
  static const Color onLime = Color(0xFF0A0C08);

  static const BorderRadius radius =
      BorderRadius.all(Radius.circular(8));
  static const BorderRadius radiusSm =
      BorderRadius.all(Radius.circular(4));

  /// Bayangan keras khas brutalisme (offset solid, tanpa blur).
  static const List<BoxShadow> hardShadow = <BoxShadow>[
    BoxShadow(color: Colors.black54, offset: Offset(3, 3)),
  ];

  static TextStyle get kicker => const TextStyle(
        fontFamily: 'monospace',
        fontSize: 11,
        letterSpacing: 2,
        fontWeight: FontWeight.w700,
        color: lime,
      );

  static TextStyle get mono => const TextStyle(
        fontFamily: 'monospace',
        color: muted,
        fontSize: 12,
      );

  static ThemeData get dark {
    final ColorScheme scheme = const ColorScheme.dark(
      primary: lime,
      onPrimary: onLime,
      secondary: lime,
      onSecondary: onLime,
      surface: surface,
      onSurface: text,
      error: danger,
      onError: Colors.white,
      outline: line,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      textTheme: const TextTheme(
        displaySmall: TextStyle(
            fontFamily: 'Archivo Black',
            color: text,
            fontWeight: FontWeight.w400,
            letterSpacing: 0),
        titleLarge: TextStyle(fontFamily: 'Archivo Black', color: text, fontWeight: FontWeight.w400, fontSize: 19),
        titleMedium: TextStyle(color: text, fontWeight: FontWeight.w700),
        titleSmall: TextStyle(color: text, fontWeight: FontWeight.w700),
        bodyLarge: TextStyle(color: text, height: 1.45),
        bodyMedium: TextStyle(color: text, height: 1.45),
        bodySmall: TextStyle(color: muted),
        labelLarge: TextStyle(color: text, fontWeight: FontWeight.w700),
        labelMedium: TextStyle(color: muted),
        labelSmall: TextStyle(color: muted),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        foregroundColor: text,
        elevation: 0,
        centerTitle: false,
        shape: Border(bottom: BorderSide(color: line)),
        titleTextStyle: TextStyle(
            color: text, fontSize: 19, fontWeight: FontWeight.w800),
      ),
      cardTheme: const CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: radius,
          side: BorderSide(color: line),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: lime,
          foregroundColor: onLime,
          disabledBackgroundColor: surface2,
          disabledForegroundColor: muted,
          elevation: 0,
          shape: const RoundedRectangleBorder(borderRadius: radius),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: lime,
          side: const BorderSide(color: lime, width: 1.5),
          shape: const RoundedRectangleBorder(borderRadius: radius),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: lime,
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: lime,
        foregroundColor: onLime,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: radius),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: surface2,
        labelStyle: TextStyle(color: muted),
        hintStyle: TextStyle(color: muted),
        border: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: lime, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: danger, width: 1.5),
        ),
        contentPadding:
            EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
      chipTheme: const ChipThemeData(
        backgroundColor: surface2,
        selectedColor: lime,
        labelStyle: TextStyle(color: text, fontWeight: FontWeight.w600),
        secondaryLabelStyle:
            TextStyle(color: onLime, fontWeight: FontWeight.w700),
        side: BorderSide(color: line),
        shape: RoundedRectangleBorder(borderRadius: radius),
        showCheckmark: false,
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: lime,
        unselectedItemColor: muted,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
        unselectedLabelStyle: TextStyle(fontSize: 12),
        elevation: 0,
      ),
      tabBarTheme: const TabBarThemeData(
        labelColor: lime,
        unselectedLabelColor: muted,
        indicatorColor: lime,
        indicatorSize: TabBarIndicatorSize.tab,
        labelStyle: TextStyle(fontWeight: FontWeight.w800),
      ),
      dividerTheme: const DividerThemeData(
        color: line,
        thickness: 1,
        space: 1,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: lime,
        linearTrackColor: lime.withValues(alpha: 0.15),
        circularTrackColor: lime.withValues(alpha: 0.15),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: surface2,
        contentTextStyle: TextStyle(color: text),
        actionTextColor: lime,
        shape: RoundedRectangleBorder(
          borderRadius: radius,
          side: BorderSide(color: line),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: const DialogThemeData(
        backgroundColor: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: line),
        ),
        titleTextStyle:
            TextStyle(color: text, fontSize: 18, fontWeight: FontWeight.w800),
        contentTextStyle: TextStyle(color: text, height: 1.5),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: lime,
        textColor: text,
        subtitleTextStyle: TextStyle(color: muted),
      ),
      iconTheme: const IconThemeData(color: muted),
      scrollbarTheme: const ScrollbarThemeData(
        thumbColor: WidgetStatePropertyAll<Color>(line),
        trackColor: WidgetStatePropertyAll<Color>(Colors.transparent),
        thickness: WidgetStatePropertyAll<double>(8),
        radius: Radius.circular(4),
        minThumbLength: 48,
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: lime,
        selectionColor: lime.withValues(alpha: 0.3),
        selectionHandleColor: lime,
      ),
    );
  }
}
