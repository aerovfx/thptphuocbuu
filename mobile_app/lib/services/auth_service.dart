import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';
import '../utils/storage.dart';
import 'api_service.dart';
import '../utils/constants.dart';

class AuthService {
  // Google Sign-In instance
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // iOS Client ID from Google Cloud Console
    clientId: '1069154179448-b0ffktmf1ugmufv2q7521aq1d1ikv8fi.apps.googleusercontent.com',
  );

  // Register
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? dateOfBirth,
  }) async {
    try {
      print('[AuthService] Attempting registration for: $email');

      final Map<String, dynamic> body = {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
      };

      if (dateOfBirth != null && dateOfBirth.isNotEmpty) {
        body['dateOfBirth'] = dateOfBirth;
      }

      final response = await ApiService.post(
        '/api/auth/register',
        body,
      );

      print('[AuthService] Registration response status: ${response.statusCode}');

      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html')) {
        return {
          'success': false,
          'error': 'Không thể kết nối đến server',
        };
      }

      if (response.body.isEmpty) {
        return {
          'success': false,
          'error': 'Server không phản hồi',
        };
      }

      Map<String, dynamic> data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('[AuthService] Registration successful');
        return {
          'success': true,
          'message': data['message'] ?? 'Đăng ký thành công',
        };
      } else {
        final errorMsg = data['error'] as String? ?? 'Đăng ký thất bại';
        print('[AuthService] Registration failed: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      }
    } on SocketException catch (e) {
      print('[AuthService] SocketException: $e');
      return {
        'success': false,
        'error': 'Không thể kết nối đến server',
      };
    } catch (e) {
      print('[AuthService] Registration error: $e');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi: ${e.toString()}',
      };
    }
  }

  // Google Sign-In
  static Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      print('[AuthService] Attempting Google Sign-In');

      // Sign out first to force account selection
      await _googleSignIn.signOut();

      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        print('[AuthService] User cancelled Google Sign-In');
        return {
          'success': false,
          'error': 'Đăng nhập bị hủy',
        };
      }

      print('[AuthService] Google Sign-In successful: ${googleUser.email}');

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        print('[AuthService] No ID token from Google');
        return {
          'success': false,
          'error': 'Không lấy được thông tin từ Google',
        };
      }

      print('[AuthService] Got Google ID token, sending to server');

      // Send ID token to backend
      final response = await ApiService.post(
        '/api/mobile/auth/google',
        {
          'idToken': idToken,
          'email': googleUser.email,
          'displayName': googleUser.displayName ?? '',
          'photoUrl': googleUser.photoUrl ?? '',
        },
      );

      print('[AuthService] Server response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          final token = data['token'] as String?;
          if (token != null) {
            await StorageService.saveToken(token);
            final userData = data['user'] as Map<String, dynamic>?;
            if (userData != null) {
              await StorageService.saveUserData(userData);
            }
            return {
              'success': true,
              'user': User.fromJson(userData!),
              'token': token,
            };
          }
        }
      }

      final data = jsonDecode(response.body);
      final errorMsg = data['error'] as String? ?? 'Đăng nhập Google thất bại';
      return {
        'success': false,
        'error': errorMsg,
      };
    } catch (e) {
      print('[AuthService] Google Sign-In error: $e');
      return {
        'success': false,
        'error': 'Lỗi đăng nhập Google: ${e.toString()}',
      };
    }
  }

  // Login
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print('[AuthService] Attempting login for: $email');
      
      final response = await ApiService.post(
        ApiConstants.loginEndpoint,
        {
          'email': email,
          'password': password,
        },
      );

      print('[AuthService] Response status code: ${response.statusCode}');
      print('[AuthService] Response headers: ${response.headers}');

      // Check if response is HTML (error page or redirect)
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('text/html')) {
        print('[AuthService] Received HTML response instead of JSON');
        return {
          'success': false,
          'error': 'Không thể kết nối đến server. Vui lòng kiểm tra:\n'
              '1. Kết nối mạng của bạn\n'
              '2. URL server có đúng không\n'
              '3. Server có đang hoạt động không',
        };
      }

      // Check for empty response
      if (response.body.isEmpty) {
        print('[AuthService] Empty response body');
        return {
          'success': false,
          'error': 'Server không phản hồi. Vui lòng thử lại sau.',
        };
      }

      Map<String, dynamic> data;
      try {
        data = jsonDecode(response.body) as Map<String, dynamic>;
        print('[AuthService] Parsed response data: ${data.keys}');
      } catch (e) {
        print('[AuthService] JSON parse error: $e');
        print('[AuthService] Response body: ${response.body.substring(0, response.body.length > 500 ? 500 : response.body.length)}');
        
        // If parsing fails, it might be HTML error page
        return {
          'success': false,
          'error': 'Server trả về dữ liệu không hợp lệ. Vui lòng kiểm tra:\n'
              '1. URL server: ${ApiConstants.baseUrl}\n'
              '2. Kết nối mạng\n'
              '3. Thử lại sau vài phút',
        };
      }

      // Handle different status codes
      if (response.statusCode == 200) {
        if (data['success'] == true) {
          print('[AuthService] Login successful');
          
        // Save token
          final token = data['token'] as String?;
          if (token == null || token.isEmpty) {
            print('[AuthService] Warning: No token in response');
            return {
              'success': false,
              'error': 'Server không trả về token. Vui lòng thử lại.',
            };
          }
          
          await StorageService.saveToken(token);
        
        // Save user data
          final userData = data['user'] as Map<String, dynamic>?;
          if (userData != null) {
            await StorageService.saveUserData(userData);
          }

        return {
          'success': true,
            'user': User.fromJson(userData!),
            'token': token,
          };
        } else {
          final errorMsg = data['error'] as String? ?? 'Đăng nhập thất bại';
          print('[AuthService] Login failed: $errorMsg');
          return {
            'success': false,
            'error': errorMsg,
          };
        }
      } else if (response.statusCode == 401) {
        final errorMsg = data['error'] as String? ?? 'Email hoặc mật khẩu không đúng';
        print('[AuthService] Unauthorized: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      } else if (response.statusCode == 400) {
        final errorMsg = data['error'] as String? ?? 'Dữ liệu không hợp lệ';
        print('[AuthService] Bad request: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      } else if (response.statusCode == 403) {
        final errorMsg = data['error'] as String? ?? 'Tài khoản bị tạm dừng';
        print('[AuthService] Forbidden: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      } else if (response.statusCode >= 500) {
        print('[AuthService] Server error: ${response.statusCode}');
        return {
          'success': false,
          'error': 'Server đang gặp sự cố. Vui lòng thử lại sau.',
        };
      } else {
        final errorMsg = data['error'] as String? ?? 'Đăng nhập thất bại';
        print('[AuthService] Unexpected status: ${response.statusCode}, error: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      }
    } on SocketException catch (e) {
      print('[AuthService] SocketException: $e');
      return {
        'success': false,
        'error': 'Không thể kết nối đến server.\n'
            'Vui lòng kiểm tra:\n'
            '1. Kết nối internet của bạn\n'
            '2. URL server: ${ApiConstants.baseUrl}\n'
            '3. Firewall hoặc VPN có chặn kết nối không',
      };
    } on HttpException catch (e) {
      print('[AuthService] HttpException: $e');
      return {
        'success': false,
        'error': 'Lỗi kết nối HTTP: ${e.message}\n'
            'Vui lòng thử lại sau.',
      };
    } on FormatException catch (e) {
      print('[AuthService] FormatException: $e');
      return {
        'success': false,
        'error': 'Lỗi định dạng dữ liệu từ server.\n'
            'Vui lòng thử lại sau.',
      };
    } on TimeoutException catch (e) {
      print('[AuthService] TimeoutException: $e');
      return {
        'success': false,
        'error': 'Kết nối quá thời gian chờ.\n'
            'Vui lòng kiểm tra:\n'
            '1. Kết nối mạng của bạn\n'
            '2. Server có đang hoạt động không\n'
            '3. Thử lại sau',
        };
    } catch (e, stackTrace) {
      print('[AuthService] Unexpected error: $e');
      print('[AuthService] Stack trace: $stackTrace');
      return {
        'success': false,
        'error': 'Đã xảy ra lỗi không xác định.\n'
            'Chi tiết: ${e.toString()}\n'
            'Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
      };
    }
  }

  // Get current user
  static Future<User?> getCurrentUser() async {
    try {
      final response = await ApiService.get(ApiConstants.meEndpoint);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return User.fromJson(data['user'] as Map<String, dynamic>);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await StorageService.getToken();
    return token != null && token.isNotEmpty;
  }

  // Logout
  static Future<void> logout() async {
    await StorageService.clearAll();
  }
}

