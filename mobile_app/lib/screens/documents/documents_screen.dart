import 'package:flutter/material.dart';
import '../../services/document_service.dart';
import '../../widgets/theme_toggle.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  List<dynamic> _documents = [];
  bool _isLoading = true;
  String? _error;
  int _page = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments({bool refresh = false}) async {
    if (refresh) {
      _page = 1;
      _documents = [];
      _hasMore = true;
    }

    if (!_hasMore && !refresh) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await DocumentService.getDocuments(page: _page, limit: 20);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success'] == true) {
          final newDocuments = result['documents'] ?? [];
          if (refresh) {
            _documents = newDocuments;
          } else {
            _documents.addAll(newDocuments);
          }
          _hasMore = result['hasMore'] ?? false;
          if (_hasMore) {
            _page++;
          }
        } else {
          _error = result['error'] ?? 'Không thể tải văn bản';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Văn bản'),
        actions: const [ThemeToggle()],
      ),
      body: _error != null && _documents.isEmpty
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
                    onPressed: () => _loadDocuments(refresh: true),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => _loadDocuments(refresh: true),
              child: _documents.isEmpty && _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _documents.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.description_outlined,
                                size: 64,
                                color: theme.colorScheme.onSurface.withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chưa có văn bản nào',
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _documents.length + (_hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _documents.length) {
                              if (_hasMore && !_isLoading) {
                                // Load more when reaching the end
                                WidgetsBinding.instance.addPostFrameCallback((_) {
                                  _loadDocuments();
                                });
                              }
                              return _isLoading
                                  ? const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(child: CircularProgressIndicator()),
                                    )
                                  : const SizedBox.shrink();
                            }

                            final document = _documents[index];
                            final uploadedBy = document['uploadedBy'];

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: Icon(
                                  Icons.description,
                                  color: theme.colorScheme.primary,
                                  size: 32,
                                ),
                                title: Text(
                                  document['title'] ?? 'Không có tiêu đề',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (document['type'] != null)
                                      Text('Loại: ${document['type']}'),
                                    if (uploadedBy != null)
                                      Text(
                                        'Người tải: ${uploadedBy['firstName'] ?? ''} ${uploadedBy['lastName'] ?? ''}',
                                      ),
                                    if (document['createdAt'] != null)
                                      Text(
                                        'Ngày: ${DateTime.parse(document['createdAt']).toString().split(' ')[0]}',
                                      ),
                                  ],
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  // TODO: Navigate to document detail
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Xem chi tiết: ${document['title']}'),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        ),
            ),
    );
  }
}

