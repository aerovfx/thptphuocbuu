import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({super.key});

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  bool _isPrivate = false;
  String _commentSetting = 'Mọi người';
  String _mentionSetting = 'Mọi người';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Quyền riêng tư', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Khả năng hiển thị'),
          SwitchListTile(
            secondary: const Icon(Icons.lock_outline),
            title: Text('Tài khoản riêng tư', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('Chỉ những người bạn phê duyệt mới có thể xem nội dung của bạn.', style: GoogleFonts.inter(fontSize: 12)),
            value: _isPrivate,
            onChanged: (val) => setState(() => _isPrivate = val),
            activeColor: Colors.teal,
          ),
          
          _buildSectionHeader('Tương tác'),
          _buildSelectionTile(
            Icons.chat_bubble_outline, 
            'Bình luận', 
            _commentSetting, 
            ['Mọi người', 'Người theo dõi', 'Không ai cả'],
            (val) => setState(() => _commentSetting = val),
          ),
          _buildSelectionTile(
            Icons.alternate_email, 
            'Nhắc tên', 
            _mentionSetting, 
            ['Mọi người', 'Người theo dõi', 'Không ai cả'],
            (val) => setState(() => _mentionSetting = val),
          ),
          
          _buildSectionHeader('Dữ liệu'),
          ListTile(
            leading: const Icon(Icons.download_outlined),
            title: Text('Tải xuống dữ liệu', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('Tải bản sao thông tin của bạn trên PhuocBuu Social.', style: GoogleFonts.inter(fontSize: 12)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () {},
          ),
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

  Widget _buildSelectionTile(IconData icon, String title, String current, List<String> options, Function(String) onSelect) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(current, style: const TextStyle(color: Colors.grey)),
          const Icon(Icons.chevron_right, size: 20),
        ],
      ),
      onTap: () {
        showModalBottomSheet(
          context: context,
          builder: (context) => Column(
            mainAxisSize: MainAxisSize.min,
            children: options.map((opt) => ListTile(
              title: Text(opt),
              trailing: opt == current ? const Icon(Icons.check, color: Colors.teal) : null,
              onTap: () {
                onSelect(opt);
                Navigator.pop(context);
              },
            )).toList(),
          ),
        );
      },
    );
  }
}
