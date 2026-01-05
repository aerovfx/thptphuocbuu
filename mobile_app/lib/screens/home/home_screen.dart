import 'package:flutter/material.dart';
import '../welcome/welcome_screen.dart';
import '../social/social_screen.dart';
import '../documents/documents_screen.dart';
import '../messages/messages_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../../widgets/modern_bottom_nav.dart';
import '../../utils/storage.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  String _userRole = 'USER';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final userData = await StorageService.getUserData();
    if (mounted) {
      setState(() {
        _userRole = userData?['role'] ?? 'USER';
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> _getVisibleTabs() {
    final List<Map<String, dynamic>> allTabs = [
      {'screen': const WelcomeScreen(), 'label': 'Trang chủ', 'icon': Icons.home_outlined, 'selectedIcon': Icons.home, 'roles': ['ADMIN', 'TEACHER', 'BGH', 'STUDENT', 'PARENT', 'USER']},
      {'screen': const SocialScreen(), 'label': 'Mạng xã hội', 'icon': Icons.people_outlined, 'selectedIcon': Icons.people, 'roles': ['ADMIN', 'TEACHER', 'BGH', 'STUDENT', 'USER']},
      {'screen': const DocumentsScreen(), 'label': 'Văn bản', 'icon': Icons.description_outlined, 'selectedIcon': Icons.description, 'roles': ['ADMIN', 'TEACHER', 'BGH']},
      {'screen': const MessagesScreen(), 'label': 'Tin nhắn', 'icon': Icons.message_outlined, 'selectedIcon': Icons.message, 'roles': ['ADMIN', 'TEACHER', 'BGH', 'STUDENT', 'PARENT', 'USER']},
      {'screen': const NotificationsScreen(), 'label': 'Thông báo', 'icon': Icons.notifications_outlined, 'selectedIcon': Icons.notifications, 'roles': ['ADMIN', 'TEACHER', 'BGH', 'STUDENT', 'PARENT', 'USER']},
      {'screen': const ProfileScreen(), 'label': 'Cá nhân', 'icon': Icons.person_outline, 'selectedIcon': Icons.person, 'roles': ['ADMIN', 'TEACHER', 'BGH', 'STUDENT', 'PARENT', 'USER']},
    ];

    // Filter tabs based on role
    return allTabs.where((tab) {
      final List<String> allowedRoles = tab['roles'] as List<String>;
      return allowedRoles.contains(_userRole);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final visibleTabs = _getVisibleTabs();
    
    // Ensure index is within bounds if tabs changed
    if (_currentIndex >= visibleTabs.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      body: visibleTabs[_currentIndex]['screen'] as Widget,
      bottomNavigationBar: ModernBottomNav(
        currentIndex: _currentIndex,
        tabs: visibleTabs,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}

