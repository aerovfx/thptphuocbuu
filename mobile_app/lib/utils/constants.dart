class ApiConstants {
  // Production URL - Updated to custom domain
  static const String baseUrl = 'https://thptphuocbuu.edu.vn';
  // Old Cloud Run URL (backup):
  // static const String baseUrl = 'https://phuocbuu-vglgngs3yq-as.a.run.app';
  // For local development:
  // static const String baseUrl = 'http://localhost:3000';
  
  // Auth endpoints
  static const String loginEndpoint = '/api/mobile/auth/login';
  static const String meEndpoint = '/api/mobile/auth/me';
  
  // Posts endpoints
  static const String postsEndpoint = '/api/posts';
  
  // Messages endpoints
  static const String messagesEndpoint = '/api/messages';
  
  // Notifications endpoints
  static const String notificationsEndpoint = '/api/notifications';
  
  // Documents endpoints
  static const String documentsEndpoint = '/api/documents';
  
  // News endpoints
  static const String newsEndpoint = '/api/news';
  
  // Bookmarks endpoints
  static const String bookmarksEndpoint = '/api/bookmarks';
  
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
}

class AppConstants {
  static const String appName = 'PhuocBuu';
  static const int postsPerPage = 20;
}

