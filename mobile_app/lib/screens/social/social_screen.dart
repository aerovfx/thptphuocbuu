import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../widgets/theme_toggle.dart';
import '../../services/post_service.dart';
import '../../models/post.dart';
import '../../widgets/post_card.dart';
import '../post/create_post_screen.dart';

class SocialScreen extends StatefulWidget {
  const SocialScreen({super.key});

  @override
  State<SocialScreen> createState() => _SocialScreenState();
}

class _SocialScreenState extends State<SocialScreen> {
  List<Post> _posts = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _currentPage = 1;
  final ScrollController _scrollController = ScrollController();
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
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

  Future<void> _loadPosts({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _posts = [];
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await PostService.getPosts(page: _currentPage);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          final newPosts = result['posts'] as List<Post>;
          newPosts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          
          if (refresh) {
            _posts = newPosts;
          } else {
            _posts.addAll(newPosts);
            _posts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          }
          _hasMore = result['pagination']?['hasMore'] as bool? ?? false;
        } else {
          _error = result['error'] ?? 'Không thể tải bài viết';
        }
      });
    }
  }

  Future<void> _loadMorePosts() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _isLoading = true;
    });

    _currentPage++;
    final result = await PostService.getPosts(page: _currentPage);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          final newPosts = result['posts'] as List<Post>;
          _posts.addAll(newPosts);
          _hasMore = result['pagination']?['hasMore'] as bool? ?? false;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('PhuocBuu Social', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        elevation: 0,
        actions: const [ThemeToggle(), SizedBox(width: 8)],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreatePostScreen()),
          );
          if (result == true) _loadPosts(refresh: true);
        },
        backgroundColor: Colors.teal,
        label: Text('Đăng bài', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        icon: const Icon(Icons.add, color: Colors.white),
      ),
      body: _error != null && _posts.isEmpty
          ? _buildErrorState(theme)
          : RefreshIndicator(
              onRefresh: () => _loadPosts(refresh: true),
              displacement: 20,
              color: Colors.teal,
              child: CustomScrollView(
                controller: _scrollController,
                slivers: [
                  // Stories Placeholder
                  SliverToBoxAdapter(
                    child: _buildStoriesBar(theme),
                  ),
                  
                  // Post List
                  if (_posts.isEmpty && !_isLoading)
                    SliverFillRemaining(
                      child: _buildEmptyState(theme),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          if (index == _posts.length) {
                            return _isLoading
                                ? const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(child: CircularProgressIndicator(color: Colors.teal)),
                                  )
                                : const SizedBox.shrink();
                          }
                          return PostCard(
                            post: _posts[index],
                            onDeleted: () => _loadPosts(refresh: true),
                          );
                        },
                        childCount: _posts.length + (_hasMore ? 1 : 0),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildStoriesBar(ThemeData theme) {
    return Container(
      height: 120,
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 10,
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildAddStory(theme);
          }
          return _buildStoryItem(theme, index);
        },
      ),
    );
  }

  Widget _buildAddStory(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                width: 64, height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.teal.withOpacity(0.1),
                ),
                child: const Icon(Icons.add, color: Colors.teal, size: 30),
              ),
              Positioned(
                bottom: 0, right: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: const Icon(Icons.add_circle, color: Colors.teal, size: 20),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Thêm tin', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildStoryItem(ThemeData theme, int index) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [Colors.teal, Colors.blue]),
            ),
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(color: theme.colorScheme.surface, shape: BoxShape.circle),
              child: CircleAvatar(
                radius: 28,
                backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=$index'),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text('Người dùng $index', style: GoogleFonts.inter(fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: theme.colorScheme.onSurface.withOpacity(0.2)),
          const SizedBox(height: 16),
          Text('Chưa có bài viết nào', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey)),
          const SizedBox(height: 8),
          Text('Hãy là người đầu tiên chia sẻ!', style: GoogleFonts.inter(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildErrorState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 80, color: Colors.red.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(_error!, style: GoogleFonts.inter(fontSize: 16)),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: () => _loadPosts(refresh: true), child: const Text('Thử lại')),
        ],
      ),
    );
  }
}

