import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/auth_service.dart';
import '../../models/user.dart';
import '../../main.dart';
import '../../widgets/theme_toggle.dart';
import './settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = true;
  dynamic _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.getCurrentUser();
    setState(() {
      _user = user;
      _isLoading = false;
    });
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AuthService.logout();
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MyApp()),
        );
      }
    }
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _user == null
              ? Center(
                  child: Text(
                    'Không thể tải thông tin',
                    style: theme.textTheme.bodyLarge,
                  ),
                )
              : DefaultTabController(
                  length: 3,
                  child: NestedScrollView(
                    headerSliverBuilder: (context, innerBoxIsScrolled) {
                      final user = _user as User;
                      return [
                        SliverAppBar(
                          expandedHeight: 280,
                          pinned: true,
                          stretch: true,
                          actions: [
                            const ThemeToggle(),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.settings_outlined),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                                );
                              },
                            ),
                            const SizedBox(width: 8),
                          ],
                          flexibleSpace: FlexibleSpaceBar(
                            background: Stack(
                              fit: StackFit.expand,
                              children: [
                                // Cover Photo
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        theme.primaryColor,
                                        theme.primaryColor.withOpacity(0.5),
                                      ],
                                    ),
                                  ),
                                  child: Image.network(
                                    'https://picsum.photos/800/400',
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                // Gradient Overlay
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.bottomCenter,
                                      end: Alignment.topCenter,
                                      colors: [
                                        theme.colorScheme.surface,
                                        Colors.transparent,
                                      ],
                                    ),
                                  ),
                                ),
                                // Profile Info
                                Positioned(
                                  bottom: 60,
                                  left: 20,
                                  right: 20,
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Stack(
                                        children: [
                                          Container(
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              border: Border.all(color: theme.colorScheme.surface, width: 4),
                                            ),
                                            child: CircleAvatar(
                                              radius: 45,
                                              backgroundImage: user.avatar != null
                                                  ? NetworkImage(user.avatar as String)
                                                  : null,
                                              child: user.avatar == null
                                                  ? Text(
                                                      user.firstName[0].toUpperCase(),
                                                      style: const TextStyle(fontSize: 40),
                                                    )
                                                  : null,
                                            ),
                                          ),
                                          if (user.isVerified)
                                            Positioned(
                                              right: 4,
                                              bottom: 4,
                                              child: Container(
                                                padding: const EdgeInsets.all(2),
                                                decoration: BoxDecoration(
                                                  color: theme.colorScheme.surface,
                                                  shape: BoxShape.circle,
                                                ),
                                                child: const Icon(Icons.verified, color: Colors.blue, size: 24),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              user.fullName,
                                              style: GoogleFonts.outfit(
                                                fontSize: 24,
                                                fontWeight: FontWeight.bold,
                                                color: theme.colorScheme.onSurface,
                                              ),
                                            ),
                                            Text(
                                              '@${user.firstName.toLowerCase()}',
                                              style: GoogleFonts.inter(
                                                fontSize: 14,
                                                color: theme.colorScheme.onSurface.withOpacity(0.7),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 16),
                                // Bio
                                Text(
                                  user.bio ?? 'Chưa có tiểu sử. Hãy cập nhật để mọi người biết thêm về bạn!',
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    height: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                // Social Links Placeholders
                                Row(
                                  children: [
                                    _buildSocialChip(Icons.link, 'github.com/phuocbuu', theme),
                                    const SizedBox(width: 8),
                                    _buildSocialChip(Icons.location_on_outlined, 'Vung Tau, VN', theme),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                // Stats Row
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    _buildStatItem('Followers', _formatNumber(user.followersCount)),
                                    _buildStatItem('Following', _formatNumber(user.followingCount)),
                                    _buildStatItem('Reach', _formatNumber(user.reachCount)),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                // Action Buttons
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () {},
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: theme.primaryColor,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                        ),
                                        child: const Text('Chỉnh sửa hồ sơ', style: TextStyle(fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Container(
                                      decoration: BoxDecoration(
                                        color: theme.colorScheme.surfaceVariant,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: IconButton(
                                        onPressed: _handleLogout,
                                        icon: const Icon(Icons.logout, color: Colors.red),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),
                              ],
                            ),
                          ),
                        ),
                        SliverPersistentHeader(
                          pinned: true,
                          delegate: _SliverAppBarDelegate(
                            TabBar(
                              labelColor: theme.primaryColor,
                              unselectedLabelColor: theme.colorScheme.onSurface.withOpacity(0.6),
                              indicatorColor: theme.primaryColor,
                              tabs: const [
                                Tab(text: 'Dòng thời gian'),
                                Tab(text: 'Nhãn'),
                                Tab(text: 'Thống kê'),
                              ],
                            ),
                          ),
                        ),
                      ];
                    },
                    body: TabBarView(
                      children: [
                        _buildTimelineTab(theme),
                        _buildTaggedTab(theme),
                        _buildStatsTab(theme),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSocialChip(IconData icon, String label, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: theme.primaryColor),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineTab(ThemeData theme) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder: (context, index) {
        return Container(
          height: 150,
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(child: Text('Bài viết #${10 - index}')),
        );
      },
    );
  }

  Widget _buildTaggedTab(ThemeData theme) {
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: 15,
      itemBuilder: (context, index) {
        return Container(
          color: theme.colorScheme.surfaceVariant,
          child: Image.network('https://picsum.photos/200/200?random=$index', fit: BoxFit.cover),
        );
      },
    );
  }

  Widget _buildStatsTab(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Phân tích tương tác', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildStatCard('Tăng trưởng người theo dõi', '+12% tuần này', Icons.trending_up, Colors.green),
          const SizedBox(height: 12),
          _buildStatCard('Lượt xem hồ sơ', '1,240 (30 ngày)', Icons.visibility, Colors.blue),
          const SizedBox(height: 12),
          _buildStatCard('Tỷ lệ tương tác', '4.8%', Icons.bolt, Colors.amber),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String subtitle, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}

