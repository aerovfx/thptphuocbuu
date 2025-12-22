class ApiConstants {
  // TODO: Update this to your production URL
  static const String baseUrl = 'https://phuocbuu-vglgngs3yq-as.a.run.app';
  // For local development:
  // static const String baseUrl = 'http://localhost:3000';
  
  // Auth endpoints
  static const String loginEndpoint = '/api/mobile/auth/login';
  static const String meEndpoint = '/api/mobile/auth/me';
  
  // Posts endpoints
  static const String postsEndpoint = '/api/mobile/posts';
  
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
}

class AppConstants {
  static const String appName = 'PhuocBuu';
  static const int postsPerPage = 20;
}

