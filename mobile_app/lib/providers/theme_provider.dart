import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppTheme { light, dark }

class ThemeProvider extends ChangeNotifier {
  AppTheme _theme = AppTheme.dark;
  bool _isLoading = true;

  AppTheme get theme => _theme;
  bool get isLoading => _isLoading;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTheme = prefs.getString('theme');
      if (savedTheme != null) {
        _theme = savedTheme == 'light' ? AppTheme.light : AppTheme.dark;
      } else {
        // Default to dark theme (matching web app)
        _theme = AppTheme.dark;
      }
    } catch (e) {
      // Default to dark theme on error
      _theme = AppTheme.dark;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleTheme() async {
    _theme = _theme == AppTheme.dark ? AppTheme.light : AppTheme.dark;
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('theme', _theme == AppTheme.light ? 'light' : 'dark');
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> setTheme(AppTheme theme) async {
    if (_theme == theme) return;
    
    _theme = theme;
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('theme', theme == AppTheme.light ? 'light' : 'dark');
    } catch (e) {
      // Handle error silently
    }
  }
}

