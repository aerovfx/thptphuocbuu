import 'package:flutter/material.dart';
import '../../services/news_service.dart';
import '../../widgets/theme_toggle.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  List<dynamic> _articles = [];
  bool _isLoading = true;
  String? _error;
  int _page = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadNews();
  }

  Future<void> _loadNews({bool refresh = false}) async {
    if (refresh) {
      _page = 1;
      _articles = [];
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await NewsService.getNews(page: _page);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          if (refresh) {
            _articles = result['articles'] ?? [];
          } else {
            _articles.addAll(result['articles'] ?? []);
          }
          _hasMore = result['hasMore'] ?? false;
          _page++;
        } else {
          _error = result['error'] ?? 'Không thể tải tin tức';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tin tức'),
        actions: const [ThemeToggle()],
      ),
      body: _error != null && _articles.isEmpty
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
                    onPressed: () => _loadNews(refresh: true),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => _loadNews(refresh: true),
              child: _articles.isEmpty && _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _articles.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.article_outlined,
                                size: 64,
                                color: theme.colorScheme.onSurface.withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chưa có tin tức nào',
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _articles.length + (_hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _articles.length) {
                              if (_hasMore && !_isLoading) {
                                _loadNews();
                              }
                              return _isLoading
                                  ? const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(child: CircularProgressIndicator()),
                                    )
                                  : const SizedBox.shrink();
                            }

                            final article = _articles[index];
                            final author = article['author'];
                            final featuredImage = article['featuredImage'];

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              clipBehavior: Clip.antiAlias,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (featuredImage != null)
                                    Image.network(
                                      featuredImage,
                                      height: 200,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                    ),
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (article['isTopNews'] == true)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: theme.colorScheme.primary,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              'Tin nổi bật',
                                              style: TextStyle(
                                                color: theme.colorScheme.onPrimary,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        if (article['isTopNews'] == true)
                                          const SizedBox(height: 8),
                                        Text(
                                          article['title'] ?? 'Không có tiêu đề',
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        if (article['excerpt'] != null) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            article['excerpt'],
                                            style: TextStyle(
                                              color: theme.colorScheme.onSurface.withOpacity(0.7),
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 12,
                                              backgroundImage: author['avatar'] != null
                                                  ? NetworkImage(author['avatar'])
                                                  : null,
                                              child: author['avatar'] == null
                                                  ? Text(
                                                      (author['firstName']?[0] ?? 'A').toUpperCase(),
                                                      style: const TextStyle(fontSize: 10),
                                                    )
                                                  : null,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                '${author['firstName'] ?? ''} ${author['lastName'] ?? ''}',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                                                ),
                                              ),
                                            ),
                                            if (article['publishedAt'] != null)
                                              Text(
                                                DateTime.parse(article['publishedAt'])
                                                    .toString()
                                                    .split(' ')[0],
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
    );
  }
}

