import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
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
    _setupUnauthorizedHandler();
  }

  void _setupUnauthorizedHandler() {
    // Set up handler to navigate to login when token expires
    ApiService.onUnauthorized = () {
      if (mounted) {
        // Clear login state and show message
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            setState(() {
              _isLoggedIn = false;
            });
            // Show snackbar using scaffold messenger
            final scaffoldMessenger = ScaffoldMessenger.maybeOf(context);
            if (scaffoldMessenger != null) {
              scaffoldMessenger.showSnackBar(
                const SnackBar(
                  content: Text('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
                  backgroundColor: Colors.orange,
                  duration: Duration(seconds: 3),
                ),
              );
            }
          }
        });
      }
    };
  }

  Future<void> _checkAuth() async {
    // Verify session with server on startup
    final sessionValid = await AuthService.checkSession();
    if (mounted) {
      setState(() {
        _isLoggedIn = sessionValid;
        _isLoading = false;
      });
    }
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

