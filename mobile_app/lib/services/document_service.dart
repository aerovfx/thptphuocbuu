import 'dart:convert';
import 'api_service.dart';

class DocumentService {
  // Get all documents
  static Future<Map<String, dynamic>> getDocuments({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await ApiService.get(
        '/api/documents',
        queryParams: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      print('[DocumentService] Response status: ${response.statusCode}');
      print('[DocumentService] Response headers: ${response.headers}');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        print('[DocumentService] ERROR: Received HTML response instead of JSON');
        return {
          'success': false,
          'error': 'Lỗi kết nối: Server trả về HTML thay vì JSON (có thể do lỗi 404 hoặc Redirect)',
          'documents': [],
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[DocumentService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi',
          'documents': [],
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        print('[DocumentService] Unauthorized/Forbidden: ${response.statusCode}');
        return {
          'success': false,
          'error': 'Unauthorized',
          'documents': [],
        };
      }

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);
          // API returns array directly
          final documents = data is List ? data : (data['documents'] ?? []);
          return {
            'success': true,
            'documents': documents,
            'hasMore': documents.length >= limit,
          };
        } catch (e) {
          print('[DocumentService] JSON parse error: $e');
          return {
            'success': false,
            'error': 'Lỗi parse JSON',
            'documents': [],
          };
        }
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error': errorData['error'] ?? 'Không thể tải văn bản',
            'documents': [],
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
            'documents': [],
          };
        }
      }
    } catch (e) {
      print('[DocumentService] Error: $e');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
        'documents': [],
      };
    }
  }

  // Get document by ID
  static Future<Map<String, dynamic>> getDocument(String documentId) async {
    try {
      final response = await ApiService.get('/api/documents/$documentId');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        return {
          'success': false,
          'error': 'Lỗi kết nối: Server trả về HTML',
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        return {
          'success': false,
          'error': 'Unauthorized',
        };
      }

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);
          return {
            'success': true,
            'document': data,
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'Lỗi parse JSON',
          };
        }
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error': errorData['error'] ?? 'Không thể tải văn bản',
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          };
        }
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }
}

