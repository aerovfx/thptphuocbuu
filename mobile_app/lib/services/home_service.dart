import 'dart:convert';
import 'api_service.dart';
import '../models/user.dart';

class HomeService {
  static Future<Map<String, dynamic>> getHomeData() async {
    try {
      final response = await ApiService.get('/api/mobile/home');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'user': data['user'],
          'weather': data['weather'],
          'tasks': List<Map<String, dynamic>>.from(data['tasks']),
        };
      } else {
        return {
          'success': false,
          'error': 'Failed to load home data: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('[HomeService] Error: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}
