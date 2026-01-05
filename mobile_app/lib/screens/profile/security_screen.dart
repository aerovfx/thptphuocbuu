import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  bool _is2FAEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Bảo mật', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Đăng nhập'),
          _buildActionTile(
            Icons.vpn_key_outlined, 
            'Đổi mật khẩu', 
            'Nên đặt mật khẩu mạnh để bảo vệ tài khoản',
            () {},
          ),
          SwitchListTile(
            secondary: const Icon(Icons.verified_user_outlined),
            title: Text('Xác thực 2 yếu tố (2FA)', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('Tăng thêm một lớp bảo mật khi đăng nhập.', style: GoogleFonts.inter(fontSize: 12)),
            value: _is2FAEnabled,
            onChanged: (val) => setState(() => _is2FAEnabled = val),
            activeColor: Colors.teal,
          ),
          
          _buildSectionHeader('Hoạt động đăng nhập'),
          _buildActionTile(
            Icons.devices_outlined, 
            'Thiết bị đã đăng nhập', 
            'Xem danh sách các thiết bị đang sử dụng tài khoản này',
            () {},
          ),
          
          _buildSectionHeader('Tài khoản liên kết'),
          _buildSocialLinkTile('Google', 'vietchung@gmail.com', true),
          _buildSocialLinkTile('Apple', 'Chưa liên kết', false),
          
          const SizedBox(height: 32),
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
        ),
      ),
    );
  }

  Widget _buildActionTile(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }

  Widget _buildSocialLinkTile(String platform, String subtitle, bool isLinked) {
    return ListTile(
      leading: Icon(platform == 'Google' ? Icons.g_mobiledata : Icons.apple, size: 32),
      title: Text(platform, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 12)),
      trailing: TextButton(
        onPressed: () {},
        child: Text(isLinked ? 'Hủy liên kết' : 'Liên kết', style: TextStyle(color: isLinked ? Colors.red : Colors.teal)),
      ),
    );
  }
}
