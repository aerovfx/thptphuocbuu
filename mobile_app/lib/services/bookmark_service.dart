import 'dart:convert';
import 'api_service.dart';

class BookmarkService {
  // Get all bookmarks
  static Future<Map<String, dynamic>> getBookmarks() async {
    try {
      final response = await ApiService.get('/api/bookmarks');

      print('[BookmarkService] Response status: ${response.statusCode}');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        print('[BookmarkService] ERROR: Received HTML response instead of JSON');
        return {
          'success': false,
          'error': 'Unauthorized',
          'bookmarks': [],
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[BookmarkService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi',
          'bookmarks': [],
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        print('[BookmarkService] Unauthorized/Forbidden: ${response.statusCode}');
        return {
          'success': false,
          'error': 'Unauthorized',
          'bookmarks': [],
        };
      }

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);
          return {
            'success': true,
            'bookmarks': data['bookmarks'] ?? [],
          };
        } catch (e) {
          print('[BookmarkService] JSON parse error: $e');
          return {
            'success': false,
            'error': 'Lỗi parse JSON',
            'bookmarks': [],
          };
        }
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error': errorData['error'] ?? 'Không thể tải đánh dấu',
            'bookmarks': [],
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
            'bookmarks': [],
          };
        }
      }
    } catch (e) {
      print('[BookmarkService] Error: $e');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
        'bookmarks': [],
      };
    }
  }

  // Bookmark a post
  static Future<Map<String, dynamic>> bookmarkPost(String postId) async {
    try {
      final response = await ApiService.post('/api/posts/$postId/bookmark', {});

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'bookmarked': data['bookmarked'] ?? true,
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Đánh dấu thất bại',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Unbookmark a post
  static Future<Map<String, dynamic>> unbookmarkPost(String postId) async {
    try {
      final response = await ApiService.delete('/api/posts/$postId/bookmark');

      if (response.statusCode == 200) {
        return {
          'success': true,
          'bookmarked': false,
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Bỏ đánh dấu thất bại',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }
}

