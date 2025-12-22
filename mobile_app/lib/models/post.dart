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
    return Post(
      id: json['id'] as String,
      content: json['content'] as String,
      type: json['type'] as String,
      imageUrl: json['imageUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      linkUrl: json['linkUrl'] as String?,
      author: PostAuthor.fromJson(json['author'] as Map<String, dynamic>),
      likesCount: json['likesCount'] as int,
      commentsCount: json['commentsCount'] as int,
      isLiked: json['isLiked'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
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
    return PostAuthor(
      id: json['id'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
      role: json['role'] as String,
      brandBadge: json['brandBadge'] as String?,
    );
  }
}

