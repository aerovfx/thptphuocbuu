import 'package:flutter/material.dart';
import '../../models/post.dart';
import '../../services/post_service.dart';
import '../../widgets/post_card.dart';
import '../../widgets/theme_toggle.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<Post> _posts = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _currentPage = 1;
  final ScrollController _scrollController = ScrollController();

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PhuocBuu'),
        centerTitle: true,
        actions: const [
          ThemeToggle(),
        ],
      ),
      body: RefreshIndicator(
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
                      return PostCard(post: _posts[index]);
                    },
                  ),
      ),
    );
  }
}

