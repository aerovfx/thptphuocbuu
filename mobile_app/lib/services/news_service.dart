import 'dart:convert';
import 'api_service.dart';

class NewsService {
  // Get news articles
  static Future<Map<String, dynamic>> getNews({
    String? category,
    String? department,
    bool featured = false,
    bool topNews = false,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'offset': ((page - 1) * limit).toString(),
      };

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (department != null && department.isNotEmpty) {
        queryParams['department'] = department;
      }
      if (featured) {
        queryParams['featured'] = 'true';
      }
      if (topNews) {
        queryParams['topNews'] = 'true';
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await ApiService.get(
        '/api/news',
        queryParams: queryParams,
      );

      print('[NewsService] Response status: ${response.statusCode}');
      print('[NewsService] Response headers: ${response.headers}');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        print('[NewsService] ERROR: Received HTML response instead of JSON');
        return {
          'success': false,
          'error': 'Unauthorized',
          'articles': [],
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[NewsService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi',
          'articles': [],
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        print('[NewsService] Unauthorized/Forbidden: ${response.statusCode}');
        return {
          'success': false,
          'error': 'Unauthorized',
          'articles': [],
        };
      }

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);
          final articles = data['articles'] ?? [];
          final total = data['total'] ?? 0;
          
          return {
            'success': true,
            'articles': articles,
            'total': total,
            'hasMore': articles.length >= limit,
          };
        } catch (e) {
          print('[NewsService] JSON parse error: $e');
          return {
            'success': false,
            'error': 'Lỗi parse JSON',
            'articles': [],
          };
        }
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error': errorData['error'] ?? 'Không thể tải tin tức',
            'articles': [],
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
            'articles': [],
          };
        }
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
        'articles': [],
      };
    }
  }

  // Get news article by slug
  static Future<Map<String, dynamic>> getNewsArticle(String slug) async {
    try {
      final response = await ApiService.get('/api/news/$slug');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'article': data,
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Không thể tải bài viết',
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

