import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/home_service.dart';
import '../../models/user.dart';
import '../../widgets/theme_toggle.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  User? _user;
  bool _isLoading = true;
  DateTime _currentTime = DateTime.now();
  
  // Weather Data
  Map<String, dynamic>? _weather;
  
  // Tasks Data
  List<Map<String, dynamic>> _tasks = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
    _startClock();
  }

  void _startClock() {
    // Update time every second
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
        _startClock();
      }
    });
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await HomeService.getHomeData();

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          if (result['user'] != null) {
            _user = User.fromJson(result['user']);
          }
          _weather = result['weather'];
          _tasks = result['tasks'];
        } else {
          _error = result['error'] ?? 'Không thể tải dữ liệu';
        }
      });
    }
  }

  String _getGreeting() {
    final hour = _currentTime.hour;
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  String _getDayOfWeek() {
    // Vietnamese formatting
    final Map<int, String> days = {
      DateTime.monday: 'Thứ Hai',
      DateTime.tuesday: 'Thứ Ba',
      DateTime.wednesday: 'Thứ Tư',
      DateTime.thursday: 'Thứ Năm',
      DateTime.friday: 'Thứ Sáu',
      DateTime.saturday: 'Thứ Bảy',
      DateTime.sunday: 'Chủ Nhật',
    };
    return days[_currentTime.weekday] ?? '';
  }

  String _getDate() {
    return DateFormat('dd/MM/yyyy').format(_currentTime);
  }

  String _getTime() {
    return DateFormat('HH:mm').format(_currentTime);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                // 1. Background Image Header
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: size.height * 0.35,
                  child: Image.asset(
                    'assets/images/home_header_bg.png',
                    fit: BoxFit.cover,
                  ),
                ),
                
                // 2. Translucent Overlay
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: size.height * 0.35,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.5),
                          Colors.transparent,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),

                // 3. Scrollable Content
                RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        SizedBox(height: size.height * 0.18),
                        
                        // 4. Floating Social User Card
                        _buildSocialUserCard(theme),
                        
                        const SizedBox(height: 24),
                        
                        // 5. Quick Stats Bar
                        _buildQuickStatsBar(theme),
                        
                        const SizedBox(height: 24),
                        
                        // 6. Create Post Prompt
                        _buildCreatePostPrompt(theme),
                        
                        const SizedBox(height: 24),
                        
                        // 7. "What's New?" Section (Post Feed Preview)
                        _buildWhatsNewSection(theme),
                        
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),

                // 8. Navigation Bar (Overlay)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      child: Row(
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _getGreeting(),
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  color: Colors.white70,
                                ),
                              ),
                              Text(
                                'PhuocBuu Social',
                                style: GoogleFonts.outfit(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          _buildHeaderAction(Icons.search, () {}),
                          const SizedBox(width: 15),
                          _buildHeaderAction(Icons.notifications_none, () {}),
                          const SizedBox(width: 15),
                          const ThemeToggle(),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildHeaderAction(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  Widget _buildSocialUserCard(ThemeData theme) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF004D40), // Dark Teal
            Color(0xFF00897B), // Lighter Teal
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    backgroundImage: _user?.avatar != null ? NetworkImage(_user!.avatar!) : null,
                    child: _user?.avatar == null 
                      ? Text(
                          _user?.fullName.substring(0, 1).toUpperCase() ?? 'U',
                          style: GoogleFonts.outfit(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold),
                        )
                      : null,
                  ),
                  if (_user?.isVerified ?? false)
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.verified, color: Colors.blue, size: 16),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _user?.fullName ?? 'NGƯỜI DÙNG',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      '@${_user?.firstName.toLowerCase() ?? 'username'}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.qr_code_2, color: Colors.white, size: 32),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSimpleStat('Followers', _formatNumber(_user?.followersCount ?? 0)),
              _buildStatDivider(),
              _buildSimpleStat('Following', _formatNumber(_user?.followingCount ?? 0)),
              _buildStatDivider(),
              _buildSimpleStat('Sức ảnh hưởng', 'Rank A+'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSimpleStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: Colors.white60,
          ),
        ),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(height: 30, width: 1, color: Colors.white24);
  }

  Widget _buildQuickStatsBar(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(child: _buildStatMiniCard('Lượt tiếp cận', _formatNumber(_user?.reachCount ?? 0), Icons.trending_up, Colors.green)),
          const SizedBox(width: 12),
          Expanded(child: _buildStatMiniCard('Lượt thích', '1.1K', Icons.favorite, Colors.red)),
        ],
      ),
    );
  }

  Widget _buildStatMiniCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: color.withOpacity(0.8),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCreatePostPrompt(ThemeData theme) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: theme.primaryColor.withOpacity(0.1),
            backgroundImage: _user?.avatar != null ? NetworkImage(_user!.avatar!) : null,
            child: _user?.avatar == null 
              ? Text(_user?.fullName[0].toUpperCase() ?? 'U') 
              : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Có gì mới vậy ${_user?.firstName ?? ''}?',
              style: GoogleFonts.inter(
                color: theme.textTheme.bodySmall?.color?.withOpacity(0.6),
                fontSize: 14,
              ),
            ),
          ),
          Icon(Icons.image_outlined, color: theme.primaryColor),
          const SizedBox(width: 12),
          Icon(Icons.videocam_outlined, color: theme.primaryColor),
        ],
      ),
    );
  }

  Widget _buildWhatsNewSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Xu hướng mới nhất',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              Text(
                'Xem tất cả',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: 5,
            itemBuilder: (context, index) {
              return Container(
                width: 150,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  image: DecorationImage(
                    image: NetworkImage('https://picsum.photos/300/400?random=$index'),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black.withOpacity(0.8),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const CircleAvatar(
                        radius: 12,
                        backgroundImage: NetworkImage('https://i.pravatar.cc/100'),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Xu hướng #$index',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTimeCard(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _getTime(),
            style: GoogleFonts.outfit(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _getDayOfWeek(),
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          Text(
            _getDate(),
            style: GoogleFonts.inter(
              fontSize: 14,
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherMiniCard(ThemeData theme) {
    final temp = _weather?['temperature'] ?? 28;
    final condition = _weather?['condition'] ?? 'Nắng';
    
    // Determine icon based on condition
    IconData icon = Icons.wb_sunny;
    if (condition.toLowerCase().contains('mưa')) icon = Icons.water_drop;
    if (condition.toLowerCase().contains('mây')) icon = Icons.cloud;

    return Container(
      padding: const EdgeInsets.all(16),
      height: 106, // Match approximate height of TimeCard
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 4),
          Text(
            '$temp°C',
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            condition,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskList(ThemeData theme) {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'Lỗi: $_error',
            style: GoogleFonts.inter(color: theme.colorScheme.error),
          ),
        ),
      );
    }

    if (_tasks.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(30),
        width: double.infinity,
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.1),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 48,
              color: theme.colorScheme.primary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'Tuyệt vời! Bạn không có công việc nào.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: _tasks.map((task) => _buildTaskItem(task, theme)).toList(),
    );
  }

  Widget _buildTaskItem(Map<String, dynamic> task, ThemeData theme) {
    final isDocument = task['type'] == 'DOCUMENT_TASK';
    final source = task['source'] ?? '';
    final title = task['title'] ?? 'Công việc không tên';
    final description = task['description'];
    final dueDateStr = task['dueDate'];
    
    DateTime? dueDate;
    if (dueDateStr != null) {
      dueDate = DateTime.tryParse(dueDateStr);
    }

    Color badgeColor = isDocument ? Colors.orange : Colors.blue;
    IconData icon = isDocument ? Icons.description : Icons.assignment;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: badgeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: badgeColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
                      ),
                      child: Text(
                        source,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (dueDate != null)
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 12,
                            color: dueDate.isBefore(DateTime.now()) 
                                ? theme.colorScheme.error 
                                : theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            DateFormat('dd/MM HH:mm').format(dueDate),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: dueDate.isBefore(DateTime.now())
                                  ? theme.colorScheme.error
                                  : theme.colorScheme.onSurface.withOpacity(0.5),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                if (description != null && description.toString().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
