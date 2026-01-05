import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import './privacy_screen.dart';
import './security_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Cài đặt', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Tài khoản'),
          _buildSettingTile(
            Icons.person_outline, 
            'Thông tin cá nhân', 
            'Tên hiển thị, tiểu sử, ảnh đại diện',
            () {},
          ),
          _buildSettingTile(
            Icons.phone_android, 
            'Số điện thoại', 
            '+84 123 **** 89',
            () {},
          ),
          
          _buildSectionHeader('Quyền riêng tư & Bảo mật'),
          _buildSettingTile(
            Icons.lock_outline, 
            'Quyền riêng tư', 
            'Kiểm soát ai có thể xem và tương tác với bạn',
            () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyScreen()));
            },
          ),
          _buildSettingTile(
            Icons.shield_outlined, 
            'Bảo mật', 
            'Mật khẩu, 2FA, Thiết bị đã đăng nhập',
            () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SecurityScreen()));
            },
          ),
          
          _buildSectionHeader('Thông báo'),
          _buildSettingTile(
            Icons.notifications_none, 
            'Thông báo đẩy', 
            'Lượt thích, bình luận, người theo dõi mới',
            () {},
          ),
          
          _buildSectionHeader('Hỗ trợ'),
          _buildSettingTile(Icons.help_outline, 'Trung tâm trợ giúp', null, () {}),
          _buildSettingTile(Icons.info_outline, 'Về PhuocBuu Social', 'Phiên bản 2.0.0', () {}),
          
          const SizedBox(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextButton(
              onPressed: () {},
              child: const Text('Xóa tài khoản', style: TextStyle(color: Colors.red)),
            ),
          ),
          const SizedBox(height: 50),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.teal,
          letterSpacing: 1.1,
        ),
      ),
    );
  }

  Widget _buildSettingTile(IconData icon, String title, String? subtitle, VoidCallback onTap) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.teal.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.teal, size: 20),
      ),
      title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      subtitle: subtitle != null ? Text(subtitle, style: GoogleFonts.inter(fontSize: 12)) : null,
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }
}
