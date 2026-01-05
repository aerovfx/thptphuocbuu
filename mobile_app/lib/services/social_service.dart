import 'dart:convert';
import 'api_service.dart';
import '../utils/constants.dart';

class SocialService {
  // Follow/Unfollow a user
  static Future<Map<String, dynamic>> toggleFollow(String userId) async {
    try {
      final response = await ApiService.post(
        '/api/social/follow',
        {'targetUserId': userId},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {
        'success': false,
        'error': 'Không thể thực hiện yêu cầu',
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  // Get followers list
  static Future<Map<String, dynamic>> getFollowers(String userId, {int page = 1}) async {
    try {
      final response = await ApiService.get('/api/social/followers/$userId?page=$page');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'error': 'Lỗi khi tải danh sách'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Get following list
  static Future<Map<String, dynamic>> getFollowing(String userId, {int page = 1}) async {
    try {
      final response = await ApiService.get('/api/social/following/$userId?page=$page');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'error': 'Lỗi khi tải danh sách'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Get user social stats (Reach, Likes, etc.)
  static Future<Map<String, dynamic>> getSocialStats() async {
    try {
      final response = await ApiService.get('/api/social/stats');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'error': 'Lỗi khi tải thống kê'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
