import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:http/http.dart' as http;
import '../models/post.dart';
import 'api_service.dart';
import '../utils/constants.dart';
import '../utils/storage.dart';

class PostService {
  // Get posts feed
  static Future<Map<String, dynamic>> getPosts({int page = 1, int limit = 20}) async {
    try {
      print('[PostService] Fetching posts - page: $page, limit: $limit');

      final response = await ApiService.get(
        ApiConstants.postsEndpoint,
        queryParams: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      print('[PostService] Response status: ${response.statusCode}');
      print('[PostService] Response headers: ${response.headers}');

      // Check if response is HTML instead of JSON
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html') || response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
        print('[PostService] ERROR: Received HTML response instead of JSON');
        print('[PostService] Response body preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');
        return {
          'success': false,
          'error': 'Lỗi parse JSON: Server trả về HTML thay vì JSON',
          'posts': <Post>[],
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[PostService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi',
          'posts': <Post>[],
        };
      }

      // Handle 401/403 - Unauthorized
      if (response.statusCode == 401 || response.statusCode == 403) {
        print('[PostService] Unauthorized/Forbidden: ${response.statusCode}');
        return {
          'success': false,
          'error': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          'posts': <Post>[],
        };
      }

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);

          // Check if response is array (direct posts) or object
          if (data is List) {
            final postsList = data
                .map((post) => Post.fromJson(post as Map<String, dynamic>))
                .toList();

            return {
              'success': true,
              'posts': postsList,
              'pagination': {'hasMore': false, 'total': postsList.length},
            };
          } else if (data is Map) {
            final postsList = (data['posts'] as List? ?? data as List)
                .map((post) => Post.fromJson(post as Map<String, dynamic>))
                .toList();

            return {
              'success': true,
              'posts': postsList,
              'pagination': data['pagination'] ?? {'hasMore': false},
            };
          }
        } catch (jsonError) {
          print('[PostService] JSON error: $jsonError');
          return {
            'success': false,
            'error': 'Lỗi parse JSON',
            'posts': <Post>[],
          };
        }
      }

      return {
        'success': false,
        'error': 'Không thể tải bài viết (HTTP ${response.statusCode})',
        'posts': <Post>[],
      };
    } catch (e) {
      print('[PostService] Error: $e');
      return {
        'success': false,
        'error': 'Lỗi: ${e.toString()}',
        'posts': <Post>[],
      };
    }
  }

  // Create post (with images/video)
  static Future<Map<String, dynamic>> createPost({
    required String content,
    List<File>? images,
    File? video,
  }) async {
    try {
      print('[PostService] Creating post...');
      print('[PostService] Content length: ${content.length}');
      print('[PostService] Images count: ${images?.length ?? 0}');
      print('[PostService] Has video: ${video != null}');

      // 1. Get and validate token
      final token = await StorageService.getToken();
      
      if (token == null || token.isEmpty) {
        print('[PostService] ❌ ERROR: No token found!');
        return {
          'success': false,
          'error': 'Chưa đăng nhập. Vui lòng đăng nhập lại.',
        };
      }

      // Log token info (only first 20 chars for security)
      print('[PostService] Token exists: ${token.substring(0, min(20, token.length))}...');
      print('[PostService] Token length: ${token.length}');

      // 2. Validate token format (JWT should have 3 parts)
      final tokenParts = token.split('.');
      if (tokenParts.length != 3) {
        print('[PostService] ❌ ERROR: Invalid token format (not JWT)');
        return {
          'success': false,
          'error': 'Token không hợp lệ. Vui lòng đăng nhập lại.',
        };
      }

      // 3. Build multipart request
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/posts');
      print('[PostService] Request URL: $uri');
      
      final request = http.MultipartRequest('POST', uri);

      // 4. Add authorization header
      request.headers['Authorization'] = 'Bearer $token';
      request.headers['Accept'] = 'application/json';
      
      print('[PostService] Headers set:');
      print('[PostService]   - Authorization: Bearer ${token.substring(0, min(20, token.length))}...');
      print('[PostService]   - Accept: application/json');

      // 5. Add content field
      request.fields['content'] = content;
      print('[PostService] Content field added');

      // 6. Add images if any
      if (images != null && images.isNotEmpty) {
        print('[PostService] Adding ${images.length} images...');
        for (int i = 0; i < images.length; i++) {
          final image = images[i];
          print('[PostService]   - Image $i: ${image.path}');
          
          try {
            request.files.add(await http.MultipartFile.fromPath(
              'images',
              image.path,
            ));
          } catch (e) {
            print('[PostService]   - ERROR adding image $i: $e');
          }
        }
      }

      // 7. Add video if exists
      if (video != null) {
        print('[PostService] Adding video: ${video.path}');
        try {
          request.files.add(await http.MultipartFile.fromPath(
            'video',
            video.path,
          ));
        } catch (e) {
          print('[PostService]   - ERROR adding video: $e');
        }
      }

      // 8. Send request
      print('[PostService] Sending request...');
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('Request timeout after 30 seconds');
        },
      );
      
      final response = await http.Response.fromStream(streamedResponse);

      print('[PostService] Response status: ${response.statusCode}');
      print('[PostService] Response headers: ${response.headers}');
      print('[PostService] Response body: ${response.body.substring(0, min(500, response.body.length))}');

      // 9. Handle response
      if (response.statusCode == 201 || response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);
          print('[PostService] ✅ Post created successfully!');
          return {
            'success': true,
            'post': Post.fromJson(data['post'] ?? data),
          };
        } catch (e) {
          print('[PostService] ❌ ERROR parsing success response: $e');
          return {
            'success': false,
            'error': 'Lỗi parse response từ server',
          };
        }
      } else if (response.statusCode == 401) {
        print('[PostService] ❌ UNAUTHORIZED (401)');
        print('[PostService] Token might be expired or invalid');
        
        // Clear token and force re-login
        await StorageService.clearAll();
        
        return {
          'success': false,
          'error': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          'needsRelogin': true,
        };
      } else {
        try {
          final data = jsonDecode(response.body);
          final errorMsg = data['error'] ?? 'Tạo bài viết thất bại';
          print('[PostService] ❌ ERROR: $errorMsg');
          return {
            'success': false,
            'error': errorMsg,
          };
        } catch (e) {
          print('[PostService] ❌ ERROR parsing error response: $e');
          return {
            'success': false,
            'error': 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          };
        }
      }
    } on TimeoutException catch (e) {
      print('[PostService] ❌ TIMEOUT: $e');
      return {
        'success': false,
        'error': 'Kết nối quá thời gian chờ. Vui lòng thử lại.',
      };
    } on SocketException catch (e) {
      print('[PostService] ❌ NETWORK ERROR: $e');
      return {
        'success': false,
        'error': 'Không thể kết nối đến server. Kiểm tra internet.',
      };
    } catch (e, stackTrace) {
      print('[PostService] ❌ UNEXPECTED ERROR: $e');
      print('[PostService] Stack trace: $stackTrace');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Update post
  static Future<Map<String, dynamic>> updatePost({
    required String postId,
    required String content,
  }) async {
    try {
      final response = await ApiService.put(
        '/api/posts/$postId',
        {'content': content},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'post': Post.fromJson(data['post']),
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'error': data['error'] ?? 'Cập nhật bài viết thất bại',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Delete post
  static Future<Map<String, dynamic>> deletePost(String postId) async {
    try {
      final response = await ApiService.delete('/api/posts/$postId');

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Đã xóa bài viết',
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'error': data['error'] ?? 'Xóa bài viết thất bại',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Like post
  static Future<Map<String, dynamic>> likePost(String postId) async {
    try {
      final response = await ApiService.post('/api/posts/$postId/like', {});

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'liked': data['liked'] as bool,
          'likesCount': data['likesCount'] as int,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'error': data['error'] ?? 'Thao tác thất bại',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Add comment
  static Future<Map<String, dynamic>> addComment({
    required String postId,
    required String content,
  }) async {
    try {
      final response = await ApiService.post(
        '/api/posts/$postId/comments',
        {'content': content},
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'comment': data['comment'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'error': data['error'] ?? 'Thêm bình luận thất bại',
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

