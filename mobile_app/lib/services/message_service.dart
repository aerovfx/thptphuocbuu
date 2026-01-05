import 'dart:convert';
import 'api_service.dart';

class MessageService {
  // Get all conversations
  static Future<Map<String, dynamic>> getConversations() async {
    try {
      final response = await ApiService.get('/api/messages');

      print('[MessageService] Response status: ${response.statusCode}');
      print('[MessageService] Response headers: ${response.headers}');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        print('[MessageService] ERROR: Received HTML response instead of JSON');
        return {
          'success': false,
          'error': 'Lỗi kết nối: Server trả về HTML thay vì JSON',
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[MessageService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi',
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        print('[MessageService] Unauthorized/Forbidden: ${response.statusCode}');
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
            'conversations': data['conversations'] ?? [],
          };
        } catch (e) {
          print('[MessageService] JSON parse error: $e');
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
            'error': errorData['error'] ?? 'Không thể tải danh sách tin nhắn',
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          };
        }
      }
    } catch (e) {
      print('[MessageService] Error: $e');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Get messages with a specific user
  static Future<Map<String, dynamic>> getMessages(String userId) async {
    try {
      final response = await ApiService.get(
        '/api/messages',
        queryParams: {'userId': userId},
      );

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
            'conversation': data['conversation'],
            'messages': data['messages'] ?? [],
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
            'error': errorData['error'] ?? 'Không thể tải tin nhắn',
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

  // Send a message
  static Future<Map<String, dynamic>> sendMessage({
    required String receiverId,
    required String content,
    String? conversationId,
    String? imageUrl,
  }) async {
    try {
      final response = await ApiService.post('/api/messages', {
        'receiverId': receiverId,
        'content': content,
        if (conversationId != null) 'conversationId': conversationId,
        if (imageUrl != null) 'imageUrl': imageUrl,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': data['message'],
          'conversation': data['conversation'],
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Gửi tin nhắn thất bại',
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

