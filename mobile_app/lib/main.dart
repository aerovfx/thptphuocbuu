import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'services/auth_service.dart';
import 'providers/theme_provider.dart';
import 'themes/app_theme.dart' as theme_config;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          // Show loading screen while theme is loading
          if (themeProvider.isLoading) {
            return MaterialApp(
              title: 'PhuocBuu',
              debugShowCheckedModeBanner: false,
              theme: theme_config.ThemeConfig.getDarkTheme(),
              home: const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(),
                ),
              ),
            );
          }

    return MaterialApp(
      title: 'PhuocBuu',
      debugShowCheckedModeBanner: false,
            theme: theme_config.ThemeConfig.getLightTheme(),
            darkTheme: theme_config.ThemeConfig.getDarkTheme(),
            themeMode: themeProvider.theme == AppTheme.light
                ? ThemeMode.light
                : ThemeMode.dark,
      home: const AuthWrapper(),
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final loggedIn = await AuthService.isLoggedIn();
    setState(() {
      _isLoggedIn = loggedIn;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _isLoggedIn ? const HomeScreen() : const LoginScreen();
  }
}

