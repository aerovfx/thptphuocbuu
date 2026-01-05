import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/post.dart';
import '../../services/post_service.dart';
import '../../widgets/post_card.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/modern_header.dart';
import '../../widgets/modern_search_bar.dart';
import '../post/create_post_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> with SingleTickerProviderStateMixin {
  List<Post> _posts = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _currentPage = 1;
  final ScrollController _scrollController = ScrollController();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      if (_hasMore && !_isLoading) {
        _loadMorePosts();
      }
    }
  }

  Future<void> _loadPosts() async {
    setState(() {
      _isLoading = true;
    });

    final result = await PostService.getPosts(page: 1);
    
    setState(() {
      if (result['success'] == true) {
        _posts = result['posts'] as List<Post>;
        _hasMore = result['pagination']['hasMore'] as bool? ?? false;
      }
      _isLoading = false;
    });
  }

  Future<void> _loadMorePosts() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _isLoading = true;
    });

    _currentPage++;
    final result = await PostService.getPosts(page: _currentPage);
    
    setState(() {
      if (result['success'] == true) {
        final newPosts = result['posts'] as List<Post>;
        _posts.addAll(newPosts);
        _hasMore = result['pagination']['hasMore'] as bool? ?? false;
      }
      _isLoading = false;
    });
  }

  Future<void> _refresh() async {
    _currentPage = 1;
    _posts.clear();
    await _loadPosts();
  }

  Future<void> _navigateToCreatePost() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => const CreatePostScreen(),
        fullscreenDialog: true,
      ),
    );

    // Refresh feed if post was created successfully
    if (result == true) {
      await _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Modern Header
            ModernHeader(
              greeting: _getGreeting(),
              userName: 'Học sinh', // TODO: Get from user data
              onSettingsTap: () {
                // Navigate to settings
              },
            ),
            const SizedBox(height: 16),
            // Search Bar
            ModernSearchBar(
              hintText: 'Tìm kiếm bài viết...',
              onTap: () {
                // Navigate to search screen
              },
              readOnly: true,
            ),
            const SizedBox(height: 20),
            // Section Header with Theme Toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text(
                    'Bài viết',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const Spacer(),
                  const ThemeToggle(),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Tab Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: theme.cardColor,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: theme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: theme.primaryColor,
                  unselectedLabelColor: theme.textTheme.bodySmall?.color,
                  labelStyle: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  unselectedLabelStyle: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.normal,
                  ),
                  tabs: const [
                    Tab(text: 'Dành cho bạn'),
                    Tab(text: 'Đang theo dõi'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildFeedView(),
                  _buildFeedView(),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToCreatePost,
        backgroundColor: theme.colorScheme.secondary,
        child: const Icon(Icons.add, size: 28, color: Colors.black),
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  Widget _buildFeedView() {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: _isLoading && _posts.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _posts.isEmpty
              ? Center(
                  child: Text(
                    'Không có bài viết nào',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                )
              : ListView.builder(
                  controller: _scrollController,
                  itemCount: _posts.length + (_hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _posts.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    return PostCard(
                      post: _posts[index],
                      onDeleted: _refresh,
                    );
                  },
                ),
    );
  }
}

