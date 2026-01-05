import 'package:flutter/material.dart';
import '../../services/message_service.dart';
import '../../widgets/theme_toggle.dart';
import 'conversation_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<dynamic> _conversations = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await MessageService.getConversations();
    
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          _conversations = result['conversations'] ?? [];
        } else {
          _error = result['error'] ?? 'Không thể tải tin nhắn';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tin nhắn'),
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
                        onPressed: _loadConversations,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : _conversations.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.message_outlined,
                            size: 64,
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Chưa có tin nhắn nào',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadConversations,
                      child: ListView.builder(
                        itemCount: _conversations.length,
                        itemBuilder: (context, index) {
                          final conversation = _conversations[index];
                          final user = conversation['user'];
                          final lastMessage = conversation['lastMessage'];
                          final unreadCount = conversation['unreadCount'] ?? 0;
                          
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: user['avatar'] != null
                                  ? NetworkImage(user['avatar'])
                                  : null,
                              child: user['avatar'] == null
                                  ? Text(
                                      (user['firstName']?[0] ?? 'U').toUpperCase(),
                                    )
                                  : null,
                            ),
                            title: Text(
                              '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}',
                              style: TextStyle(
                                fontWeight: unreadCount > 0
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                            subtitle: lastMessage != null
                                ? Text(
                                    lastMessage['content'] ?? '',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  )
                                : const Text('Bắt đầu cuộc trò chuyện'),
                            trailing: unreadCount > 0
                                ? Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      unreadCount > 9 ? '9+' : '$unreadCount',
                                      style: TextStyle(
                                        color: theme.colorScheme.onPrimary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )
                                : null,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ConversationScreen(
                                    userId: user['id'],
                                    userName: '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}',
                                    userAvatar: user['avatar'],
                                  ),
                                ),
                              ).then((_) => _loadConversations());
                            },
                          );
                        },
                      ),
                    ),
    );
  }
}

