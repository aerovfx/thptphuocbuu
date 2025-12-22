import 'dart:convert';
import '../models/post.dart';
import 'api_service.dart';
import '../utils/constants.dart';

class PostService {
  // Get posts feed
  static Future<Map<String, dynamic>> getPosts({int page = 1, int limit = 20}) async {
    try {
      final response = await ApiService.get(
        ApiConstants.postsEndpoint,
        queryParams: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          final postsList = (data['posts'] as List)
              .map((post) => Post.fromJson(post as Map<String, dynamic>))
              .toList();

          return {
            'success': true,
            'posts': postsList,
            'pagination': data['pagination'] as Map<String, dynamic>,
          };
        }
      }

      return {
        'success': false,
        'error': 'Không thể tải danh sách bài viết',
        'posts': <Post>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
        'posts': <Post>[],
      };
    }
  }
}

