import 'package:flutter/material.dart';
import '../../services/bookmark_service.dart';
import '../../services/post_service.dart';
import '../../models/post.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/post_card.dart';

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});

  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  List<String> _bookmarkIds = [];
  List<Post> _posts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  Future<void> _loadBookmarks() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final bookmarksResult = await BookmarkService.getBookmarks();

    if (!mounted) return;

    if (bookmarksResult['success'] == true) {
      final bookmarks = bookmarksResult['bookmarks'] ?? [];
      _bookmarkIds = bookmarks
          .map((b) => b['postId'] as String)
          .where((id) => id != null)
          .toList();

      // Load posts for bookmarked IDs
      if (_bookmarkIds.isNotEmpty) {
        // For now, load all posts and filter
        // TODO: Create API endpoint to get posts by IDs
        final postsResult = await PostService.getPosts(limit: 100);
        if (postsResult['success'] == true) {
          final allPosts = postsResult['posts'] as List<Post>;
          _posts = allPosts
              .where((post) => _bookmarkIds.contains(post.id))
              .toList();
        }
      }

      setState(() {
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
        _error = bookmarksResult['error'] ?? 'Không thể tải đánh dấu';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đánh dấu'),
        actions: const [ThemeToggle()],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: theme.colorScheme.error,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: theme.textTheme.bodyLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadBookmarks,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : _posts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.bookmark_border,
                            size: 64,
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Chưa có bài viết nào được đánh dấu',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadBookmarks,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _posts.length,
                        itemBuilder: (context, index) {
                          return PostCard(post: _posts[index]);
                        },
                      ),
                    ),
    );
  }
}

