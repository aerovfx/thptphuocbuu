class Post {
  final String id;
  final String content;
  final String type;
  final String? imageUrl;
  final String? videoUrl;
  final String? linkUrl;
  final PostAuthor author;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;
  final DateTime createdAt;

  Post({
    required this.id,
    required this.content,
    required this.type,
    this.imageUrl,
    this.videoUrl,
    this.linkUrl,
    required this.author,
    required this.likesCount,
    required this.commentsCount,
    required this.isLiked,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    // Handle likes and comments count from different potential structures
    int getCount(String key) {
      if (json[key] != null) return json[key] as int;
      if (json['_count'] != null && json['_count'][key.replaceAll('Count', '')] != null) {
        return json['_count'][key.replaceAll('Count', '')] as int;
      }
      return 0;
    }

    return Post(
      id: (json['id'] ?? '').toString(),
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'TEXT',
      imageUrl: json['imageUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      linkUrl: json['linkUrl'] as String?,
      author: PostAuthor.fromJson(json['author'] as Map<String, dynamic>? ?? {}),
      likesCount: getCount('likesCount'),
      commentsCount: getCount('commentsCount'),
      isLiked: json['isLiked'] as bool? ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String) 
          : DateTime.now(),
    );
  }
}

class PostAuthor {
  final String id;
  final String name;
  final String? avatar;
  final String role;
  final String? brandBadge;

  PostAuthor({
    required this.id,
    required this.name,
    this.avatar,
    required this.role,
    this.brandBadge,
  });

  factory PostAuthor.fromJson(Map<String, dynamic> json) {
    // Handle both combined name or firstName/lastName
    String displayName = json['name'] as String? ?? '';
    if (displayName.isEmpty && (json['firstName'] != null || json['lastName'] != null)) {
      displayName = '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim();
    }
    if (displayName.isEmpty) displayName = 'Người dùng';

    return PostAuthor(
      id: (json['id'] ?? '').toString(),
      name: displayName,
      avatar: json['avatar'] as String?,
      role: json['role'] as String? ?? 'USER',
      brandBadge: json['brandBadge'] != null ? json['brandBadge'].toString() : null,
    );
  }
}

