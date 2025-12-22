import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart' as io_client;
import '../utils/constants.dart';
import '../utils/storage.dart';

class ApiService {
  // Timeout duration (30 seconds)
  static const Duration _timeoutDuration = Duration(seconds: 30);

  // Create HTTP client with timeout
  static http.Client _createClient() {
    final httpClient = HttpClient()
      ..connectionTimeout = _timeoutDuration
      ..idleTimeout = _timeoutDuration;
    return io_client.IOClient(httpClient);
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await StorageService.getToken();
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  static Future<http.Response> get(String endpoint, {Map<String, String>? queryParams}) async {
    final client = _createClient();
    try {
    final headers = await _getHeaders();
    var url = '${ApiConstants.baseUrl}$endpoint';
    
    if (queryParams != null && queryParams.isNotEmpty) {
      final uri = Uri.parse(url);
      url = uri.replace(queryParameters: queryParams).toString();
    }
    
      print('[API] GET $url');
      
      final response = await client
          .get(Uri.parse(url), headers: headers)
          .timeout(_timeoutDuration);
      
      print('[API] Response status: ${response.statusCode}');
      return response;
    } finally {
      client.close();
    }
  }

  static Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final client = _createClient();
    try {
    final headers = await _getHeaders();
      final url = '${ApiConstants.baseUrl}$endpoint';
      
      print('[API] POST $url');
      print('[API] Body: ${jsonEncode(body)}');
      
      final response = await client
          .post(
            Uri.parse(url),
      headers: headers,
      body: jsonEncode(body),
          )
          .timeout(_timeoutDuration);
      
      print('[API] Response status: ${response.statusCode}');
      print('[API] Response body: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');
      
      return response;
    } finally {
      client.close();
    }
  }

  static Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final client = _createClient();
    try {
    final headers = await _getHeaders();
      final url = '${ApiConstants.baseUrl}$endpoint';
      
      print('[API] PUT $url');
      
      final response = await client
          .put(
            Uri.parse(url),
      headers: headers,
      body: jsonEncode(body),
          )
          .timeout(_timeoutDuration);
      
      print('[API] Response status: ${response.statusCode}');
      return response;
    } finally {
      client.close();
    }
  }

  static Future<http.Response> delete(String endpoint) async {
    final client = _createClient();
    try {
    final headers = await _getHeaders();
      final url = '${ApiConstants.baseUrl}$endpoint';
      
      print('[API] DELETE $url');
      
      final response = await client
          .delete(Uri.parse(url), headers: headers)
          .timeout(_timeoutDuration);
      
      print('[API] Response status: ${response.statusCode}');
      return response;
    } finally {
      client.close();
    }
  }
}

