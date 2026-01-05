import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../models/post.dart';
import '../services/post_service.dart';
import '../services/bookmark_service.dart';
import '../utils/storage.dart';

class PostCard extends StatefulWidget {
  final Post post;
  final VoidCallback? onDeleted;

  const PostCard({
    super.key,
    required this.post,
    this.onDeleted,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  late bool _isLiked;
  late int _likesCount;
  bool _isLiking = false;
  bool _isBookmarked = false;
  bool _isBookmarking = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _likesCount = widget.post.likesCount;
    _loadCurrentUser();
    _checkBookmarkStatus();
  }

  Future<void> _checkBookmarkStatus() async {
    try {
      final result = await BookmarkService.getBookmarks();
      if (result['success'] == true && mounted) {
        final bookmarks = result['bookmarks'] ?? [];
        final bookmarkIds = bookmarks
            .map((b) => b['postId'] as String?)
            .where((id) => id != null)
            .toList();
        setState(() {
          _isBookmarked = bookmarkIds.contains(widget.post.id);
        });
      }
    } catch (e) {
      // Silently fail - bookmark status is not critical
      print('Error checking bookmark status: $e');
    }
  }

  Future<void> _loadCurrentUser() async {
    final userData = await StorageService.getUserData();
    if (userData != null && mounted) {
      setState(() {
        _currentUserId = userData['id'] as String?;
      });
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return DateFormat('dd/MM/yyyy').format(date);
    } else if (difference.inDays > 0) {
      return '${difference.inDays} ngày trước';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} phút trước';
    } else {
      return 'Vừa xong';
    }
  }

  Future<void> _toggleLike() async {
    if (_isLiking) return;

    setState(() {
      _isLiking = true;
    });

    final result = await PostService.likePost(widget.post.id);

    if (mounted) {
      if (result['success'] == true) {
        setState(() {
          _isLiked = result['liked'] as bool;
          _likesCount = result['likesCount'] as int;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Thao tác thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() {
        _isLiking = false;
      });
    }
  }

  Future<void> _toggleBookmark() async {
    if (_isBookmarking) return;

    setState(() {
      _isBookmarking = true;
    });

    final result = _isBookmarked
        ? await BookmarkService.unbookmarkPost(widget.post.id)
        : await BookmarkService.bookmarkPost(widget.post.id);

    if (mounted) {
      if (result['success'] == true) {
        setState(() {
          _isBookmarked = result['bookmarked'] as bool? ?? !_isBookmarked;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isBookmarked ? 'Đã đánh dấu' : 'Đã bỏ đánh dấu',
            ),
            duration: const Duration(seconds: 1),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Thao tác thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() {
        _isBookmarking = false;
      });
    }
  }

  Future<void> _showOptionsMenu() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Chỉnh sửa'),
                onTap: () => Navigator.pop(context, 'edit'),
              ),
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Xóa', style: TextStyle(color: Colors.red)),
                onTap: () => Navigator.pop(context, 'delete'),
              ),
              ListTile(
                leading: const Icon(Icons.cancel),
                title: const Text('Hủy'),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );

    if (result == 'edit') {
      _showEditDialog();
    } else if (result == 'delete') {
      _confirmDelete();
    }
  }

  Future<void> _showEditDialog() async {
    final controller = TextEditingController(text: widget.post.content);

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Chỉnh sửa bài viết'),
          content: TextField(
            controller: controller,
            maxLines: 5,
            decoration: const InputDecoration(
              hintText: 'Nhập nội dung...',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Lưu'),
            ),
          ],
        );
      },
    );

    if (result == true) {
      await _updatePost(controller.text);
    }
  }

  Future<void> _updatePost(String newContent) async {
    if (newContent.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nội dung không được để trống')),
      );
      return;
    }

    final result = await PostService.updatePost(
      postId: widget.post.id,
      content: newContent.trim(),
    );

    if (mounted) {
      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã cập nhật bài viết'),
            backgroundColor: Colors.green,
          ),
        );
        // Refresh the feed
        if (widget.onDeleted != null) {
          widget.onDeleted!();
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Cập nhật thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Xóa bài viết'),
          content: const Text('Bạn có chắc chắn muốn xóa bài viết này?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: const Text('Xóa'),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      await _deletePost();
    }
  }

  Future<void> _deletePost() async {
    final result = await PostService.deletePost(widget.post.id);

    if (mounted) {
      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã xóa bài viết'),
            backgroundColor: Colors.green,
          ),
        );
        // Notify parent to refresh
        if (widget.onDeleted != null) {
          widget.onDeleted!();
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Xóa bài viết thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bool isMyPost = _currentUserId != null && _currentUserId == widget.post.author.id;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author info
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: theme.primaryColor.withOpacity(0.1),
                  backgroundImage: widget.post.author.avatar != null
                      ? CachedNetworkImageProvider(widget.post.author.avatar!)
                      : null,
                  child: widget.post.author.avatar == null
                      ? Text(
                          widget.post.author.name[0].toUpperCase(),
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: theme.primaryColor,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            widget.post.author.name,
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          if (widget.post.author.brandBadge != null) ...[
                            const SizedBox(width: 4),
                            Icon(
                              Icons.verified,
                              size: 16,
                              color: theme.colorScheme.primary,
                            ),
                          ],
                        ],
                      ),
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 13,
                            color: theme.textTheme.bodySmall?.color,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(widget.post.createdAt),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: theme.textTheme.bodySmall?.color,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (isMyPost)
                  IconButton(
                    icon: const Icon(Icons.more_horiz),
                    onPressed: _showOptionsMenu,
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Content
            Text(
              widget.post.content,
              style: GoogleFonts.inter(
                fontSize: 15,
                height: 1.5,
                color: theme.colorScheme.onSurface,
              ),
            ),

            // Media
            if (widget.post.imageUrl != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: CachedNetworkImage(
                  imageUrl: widget.post.imageUrl!,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => const Icon(Icons.error),
                ),
              ),
            ],

            if (widget.post.videoUrl != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 200,
                  color: Colors.black,
                  child: const Center(
                    child: Icon(Icons.play_circle_outline, size: 64, color: Colors.white),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 12),

            // Actions
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    _isLiked ? Icons.favorite : Icons.favorite_border,
                    color: _isLiked ? Colors.red : Colors.grey[600],
                  ),
                  onPressed: _isLiking ? null : _toggleLike,
                ),
                Text(
                  '$_likesCount',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: theme.textTheme.bodySmall?.color,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.chat_bubble_outline,
                  color: Colors.grey[600],
                  size: 20,
                ),
                const SizedBox(width: 4),
                Text(
                  '${widget.post.commentsCount}',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: theme.textTheme.bodySmall?.color,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.repeat,
                  color: Colors.grey[600],
                  size: 20,
                ),
                const Spacer(),
                IconButton(
                  icon: Icon(
                    _isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                    color: _isBookmarked ? Colors.amber : Colors.grey[600],
                    size: 20,
                  ),
                  onPressed: _isBookmarking ? null : _toggleBookmark,
                  tooltip: _isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu',
                ),
                Icon(
                  Icons.share_outlined,
                  color: Colors.grey[600],
                  size: 20,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
