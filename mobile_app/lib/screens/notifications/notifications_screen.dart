import 'package:flutter/material.dart';
import '../../services/notification_service.dart';
import '../../widgets/theme_toggle.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _posts = [];
  List<dynamic> _approvals = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await NotificationService.getNotifications();
    
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          _posts = result['posts'] ?? [];
          _approvals = result['approvals'] ?? [];
        } else {
          _error = result['error'] ?? 'Không thể tải thông báo';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
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
                        onPressed: _loadNotifications,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_approvals.isNotEmpty) ...[
                        Text(
                          'Chờ phê duyệt',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ..._approvals.map((approval) {
                          final doc = approval['outgoingDocument'] ??
                              approval['incomingDocument'];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: const Icon(Icons.pending_actions),
                              title: Text(doc?['title'] ?? 'Văn bản'),
                              subtitle: const Text('Cần phê duyệt'),
                              trailing: const Icon(Icons.chevron_right),
                            ),
                          );
                        }),
                        const SizedBox(height: 24),
                      ],
                      if (_posts.isNotEmpty) ...[
                        Text(
                          'Bài viết mới',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ..._posts.map((post) {
                          final author = post['author'];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundImage: author['avatar'] != null
                                    ? NetworkImage(author['avatar'])
                                    : null,
                                child: author['avatar'] == null
                                    ? Text(
                                        (author['firstName']?[0] ?? 'U').toUpperCase(),
                                      )
                                    : null,
                              ),
                              title: Text(
                                '${author['firstName'] ?? ''} ${author['lastName'] ?? ''}',
                              ),
                              subtitle: Text(
                                post['content'] ?? '',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: Text(
                                '${post['_count']?['likes'] ?? 0} ❤️',
                                style: theme.textTheme.bodySmall,
                              ),
                            ),
                          );
                        }),
                      ],
                      if (_posts.isEmpty && _approvals.isEmpty)
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.notifications_none,
                                size: 64,
                                color: theme.colorScheme.onSurface.withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chưa có thông báo nào',
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}

