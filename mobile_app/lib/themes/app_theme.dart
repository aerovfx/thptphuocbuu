import 'package:flutter/material.dart';
import '../providers/theme_provider.dart';

class ThemeConfig {
  // BLUELOCK Light Theme Colors (matching web app)
  static const Color bluelockBlue = Color(0xFF2563EB); // Primary blue text
  static const Color bluelockBlueDark = Color(0xFF1E40AF); // Darker blue
  static const Color bluelockBlueMedium = Color(0xFF3B82F6); // Medium blue
  static const Color bluelockGreen = Color(0xFF00FF88); // Primary accent
  static const Color bluelockGreenBright = Color(0xFF00FFAA); // Bright accent
  static const Color bluelockWhite = Color(0xFFFFFFFF); // Pure white background
  static const Color bluelockLightGray = Color(0xFFF8F9FA); // Light gray
  static const Color bluelockMediumGray = Color(0xFFE9ECEF); // Medium gray
  static const Color bluelockTextMuted = Color(0xFF64748B); // Muted text

  // Dark Theme Colors (X.com style - matching web app)
  static const Color darkBlack = Color(0xFF000000); // Pure black background
  static const Color darkGray900 = Color(0xFF111111); // Dark gray
  static const Color darkGray800 = Color(0xFF1A1A1A); // Card background
  static const Color darkGray700 = Color(0xFF333333); // Borders
  static const Color darkGray600 = Color(0xFF555555); // Hover states
  static const Color darkWhite = Color(0xFFFFFFFF); // White text

  static ThemeData getLightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      
      // Color Scheme
      colorScheme: const ColorScheme.light(
        primary: bluelockBlue,
        secondary: bluelockGreen,
        surface: bluelockWhite,
        background: bluelockWhite,
        error: Colors.red,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: bluelockBlue,
        onBackground: bluelockBlue,
        onError: Colors.white,
      ),

      // Scaffold
      scaffoldBackgroundColor: bluelockWhite,

      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: bluelockWhite,
        foregroundColor: bluelockBlue,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: bluelockBlue,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color: bluelockLightGray,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: bluelockBlueMedium, width: 1),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bluelockLightGray,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: bluelockBlueMedium),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: bluelockBlueMedium),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: bluelockGreen, width: 2),
        ),
        labelStyle: const TextStyle(color: bluelockBlue),
        hintStyle: const TextStyle(color: bluelockTextMuted),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: bluelockGreen,
          foregroundColor: Colors.black,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: bluelockBlue,
        ),
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: bluelockWhite,
        selectedItemColor: bluelockGreen,
        unselectedItemColor: bluelockTextMuted,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold),
        type: BottomNavigationBarType.fixed,
      ),

      // Text Theme
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: bluelockBlue, fontSize: 32, fontWeight: FontWeight.bold),
        displayMedium: TextStyle(color: bluelockBlue, fontSize: 28, fontWeight: FontWeight.bold),
        displaySmall: TextStyle(color: bluelockBlue, fontSize: 24, fontWeight: FontWeight.bold),
        headlineLarge: TextStyle(color: bluelockBlue, fontSize: 22, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: bluelockBlue, fontSize: 20, fontWeight: FontWeight.bold),
        headlineSmall: TextStyle(color: bluelockBlue, fontSize: 18, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: bluelockBlue, fontSize: 16, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(color: bluelockBlue, fontSize: 14, fontWeight: FontWeight.w600),
        titleSmall: TextStyle(color: bluelockBlue, fontSize: 12, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: bluelockBlue, fontSize: 16),
        bodyMedium: TextStyle(color: bluelockBlue, fontSize: 14),
        bodySmall: TextStyle(color: bluelockTextMuted, fontSize: 12),
        labelLarge: TextStyle(color: bluelockBlue, fontSize: 14, fontWeight: FontWeight.w500),
        labelMedium: TextStyle(color: bluelockBlue, fontSize: 12, fontWeight: FontWeight.w500),
        labelSmall: TextStyle(color: bluelockTextMuted, fontSize: 10),
      ),

      // Icon Theme
      iconTheme: const IconThemeData(
        color: bluelockBlue,
        size: 24,
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: bluelockMediumGray,
        thickness: 1,
      ),
    );
  }

  static ThemeData getDarkTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: darkWhite,
        secondary: bluelockGreen,
        surface: darkGray800,
        background: darkBlack,
        error: Colors.red,
        onPrimary: darkBlack,
        onSecondary: darkBlack,
        onSurface: darkWhite,
        onBackground: darkWhite,
        onError: darkWhite,
      ),

      // Scaffold
      scaffoldBackgroundColor: darkBlack,

      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBlack,
        foregroundColor: darkWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: darkWhite,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color: darkGray800,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: darkGray700, width: 1),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkGray800,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkGray700),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkGray700),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: bluelockGreen, width: 2),
        ),
        labelStyle: const TextStyle(color: darkWhite),
        hintStyle: const TextStyle(color: darkGray600),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: darkGray800,
          foregroundColor: darkWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: darkGray700),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: darkWhite,
        ),
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkBlack,
        selectedItemColor: bluelockGreen,
        unselectedItemColor: darkGray600,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold),
        type: BottomNavigationBarType.fixed,
      ),

      // Text Theme
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: darkWhite, fontSize: 32, fontWeight: FontWeight.bold),
        displayMedium: TextStyle(color: darkWhite, fontSize: 28, fontWeight: FontWeight.bold),
        displaySmall: TextStyle(color: darkWhite, fontSize: 24, fontWeight: FontWeight.bold),
        headlineLarge: TextStyle(color: darkWhite, fontSize: 22, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: darkWhite, fontSize: 20, fontWeight: FontWeight.bold),
        headlineSmall: TextStyle(color: darkWhite, fontSize: 18, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: darkWhite, fontSize: 16, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(color: darkWhite, fontSize: 14, fontWeight: FontWeight.w600),
        titleSmall: TextStyle(color: darkWhite, fontSize: 12, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: darkWhite, fontSize: 16),
        bodyMedium: TextStyle(color: darkWhite, fontSize: 14),
        bodySmall: TextStyle(color: darkGray600, fontSize: 12),
        labelLarge: TextStyle(color: darkWhite, fontSize: 14, fontWeight: FontWeight.w500),
        labelMedium: TextStyle(color: darkWhite, fontSize: 12, fontWeight: FontWeight.w500),
        labelSmall: TextStyle(color: darkGray600, fontSize: 10),
      ),

      // Icon Theme
      iconTheme: const IconThemeData(
        color: darkWhite,
        size: 24,
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: darkGray700,
        thickness: 1,
      ),
    );
  }

  static ThemeData getTheme(AppTheme appTheme) {
    return appTheme == AppTheme.light ? getLightTheme() : getDarkTheme();
  }
}

