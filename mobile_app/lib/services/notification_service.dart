import 'dart:convert';
import 'api_service.dart';

class NotificationService {
  // Get notifications
  static Future<Map<String, dynamic>> getNotifications() async {
    try {
      final response = await ApiService.get('/api/notifications');

      print('[NotificationService] Response status: ${response.statusCode}');
      print('[NotificationService] Response headers: ${response.headers}');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        print('[NotificationService] ERROR: Received HTML response instead of JSON');
        return {
          'success': false,
          'error': 'Lỗi kết nối: Server trả về HTML thay vì JSON',
          'posts': [],
          'approvals': [],
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[NotificationService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi',
          'posts': [],
          'approvals': [],
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        print('[NotificationService] Unauthorized/Forbidden: ${response.statusCode}');
        return {
          'success': false,
          'error': 'Unauthorized',
          'posts': [],
          'approvals': [],
        };
      }

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);
          return {
            'success': true,
            'posts': data['posts'] ?? [],
            'approvals': data['approvals'] ?? [],
          };
        } catch (e) {
          print('[NotificationService] JSON parse error: $e');
          return {
            'success': false,
            'error': 'Lỗi parse JSON',
            'posts': [],
            'approvals': [],
          };
        }
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error': errorData['error'] ?? 'Không thể tải thông báo',
            'posts': [],
            'approvals': [],
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
            'posts': [],
            'approvals': [],
          };
        }
      }
    } catch (e) {
      print('[NotificationService] Error: $e');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
        'posts': [],
        'approvals': [],
      };
    }
  }
}

