import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';

class ThemeToggle extends StatelessWidget {
  const ThemeToggle({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    
    return IconButton(
      icon: themeProvider.theme == AppTheme.dark
          ? const Icon(Icons.light_mode)
          : const Icon(Icons.dark_mode),
      onPressed: () {
        themeProvider.toggleTheme();
      },
      tooltip: themeProvider.theme == AppTheme.dark
          ? 'Chuyển sang chế độ sáng'
          : 'Chuyển sang chế độ tối',
    );
  }
}

