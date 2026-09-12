import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

/// Error dari Firebase Auth REST API.
class AuthException implements Exception {
  AuthException(this.message);
  final String message;

  @override
  String toString() => 'AuthException: $message';
}

/// Sesi login yang tersimpan lokal.
class AuthSession {
  AuthSession({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.idToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  final String uid;
  final String email;
  final String displayName;
  final String idToken;
  final String refreshToken;
  final DateTime expiresAt;

  bool get isExpired =>
      DateTime.now().isAfter(expiresAt.subtract(const Duration(seconds: 60)));

  Map<String, dynamic> toJson() => <String, dynamic>{
        'uid': uid,
        'email': email,
        'displayName': displayName,
        'idToken': idToken,
        'refreshToken': refreshToken,
        'expiresAt': expiresAt.toIso8601String(),
      };

  factory AuthSession.fromJson(Map<String, dynamic> j) => AuthSession(
        uid: '${j['uid']}',
        email: '${j['email']}',
        displayName: '${j['displayName']}',
        idToken: '${j['idToken']}',
        refreshToken: '${j['refreshToken']}',
        expiresAt: DateTime.tryParse('${j['expiresAt']}') ??
            DateTime.now().subtract(const Duration(seconds: 1)),
      );
}

/// Firebase Authentication via REST API (tanpa plugin native).
class AuthService {
  AuthService({http.Client? client}) : _client = client ?? http.Client();

  static const String _prefsKey = 'vanmod.session.v1';
  static const Duration _timeout = Duration(seconds: 20);

  final http.Client _client;

  /// Eksekusi request dengan timeout + error jaringan yang ramah.
  Future<http.Response> _guard(Future<http.Response> call) async {
    try {
      return await call.timeout(_timeout);
    } on TimeoutException {
      throw AuthException('Server tidak merespons. Coba lagi.');
    } on SocketException {
      throw AuthException('Tidak ada koneksi internet.');
    } on HttpException catch (e) {
      throw AuthException('Gangguan jaringan: ${e.message}');
    } on http.ClientException {
      throw AuthException('Gagal terhubung ke server.');
    }
  }

  /// Decode JSON dengan aman (tak pernah lempar error mentah).
  Map<String, dynamic> _decode(http.Response res) {
    try {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw AuthException('Respons server tidak valid.');
    }
  }

  Map<String, dynamic> _okOrThrow(http.Response res) {
    final Map<String, dynamic> body = _decode(res);
    if (res.statusCode != 200) {
      final Map<String, dynamic>? err = body['error'] as Map<String, dynamic>?;
      throw AuthException(_friendly((err?['message'] as String?) ?? 'UNKNOWN'));
    }
    return body;
  }

  String _friendly(String code) {
    switch (code) {
      case 'EMAIL_EXISTS':
        return 'Email sudah terdaftar. Silakan masuk.';
      case 'EMAIL_NOT_FOUND':
        return 'Email tidak terdaftar. Silakan daftar dulu.';
      case 'INVALID_PASSWORD':
        return 'Password salah. Coba lagi.';
      case 'INVALID_LOGIN_CREDENTIALS':
        return 'Email atau password salah.';
      case 'WEAK_PASSWORD':
        return 'Password minimal 6 karakter.';
      case 'INVALID_EMAIL':
        return 'Format email tidak valid.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Terlalu banyak percobaan. Coba lagi nanti.';
      case 'USER_DISABLED':
        return 'Akun ini dinonaktifkan.';
      default:
        return 'Gagal: $code';
    }
  }

  Future<AuthSession> _saveSession(
    Map<String, dynamic> body, {
    String? emailFallback,
    String? nameFallback,
  }) async {
    String name = (body['displayName'] as String?) ?? nameFallback ?? '';
    final String email = (body['email'] as String?) ?? emailFallback ?? '';
    if (name.isEmpty && email.isNotEmpty) {
      name = email.split('@').first;
    }
    final int expiresIn = int.tryParse('${body['expiresIn'] ?? '3600'}') ?? 3600;
    final AuthSession s = AuthSession(
      uid: '${body['localId']}',
      email: email,
      displayName: name,
      idToken: '${body['idToken']}',
      refreshToken: '${body['refreshToken']}',
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
    );
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, jsonEncode(s.toJson()));
    return s;
  }

  /// Daftar akun baru.
  Future<AuthSession> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final Uri uri = Uri.parse(
        '${AppConfig.authBase}/accounts:signUp?key=${AppConfig.firebaseApiKey}');
    final http.Response res = await _guard(_client.post(
      uri,
      headers: const <String, String>{'Content-Type': 'application/json'},
      body: jsonEncode(<String, dynamic>{
        'email': email.trim(),
        'password': password,
        'returnSecureToken': true,
      }),
    ));
    final Map<String, dynamic> body = _okOrThrow(res);
    final AuthSession s = await _saveSession(body,
        emailFallback: email.trim(), nameFallback: name.trim());
    // Set displayName profil.
    try {
      await updateDisplayName(s.idToken, name.trim());
      return AuthSession(
        uid: s.uid,
        email: s.email,
        displayName: name.trim(),
        idToken: s.idToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
      );
    } catch (_) {
      return s;
    }
  }

  /// Masuk dengan email + password.
  Future<AuthSession> signIn({
    required String email,
    required String password,
  }) async {
    final Uri uri = Uri.parse(
        '${AppConfig.authBase}/accounts:signInWithPassword?key=${AppConfig.firebaseApiKey}');
    final http.Response res = await _guard(_client.post(
      uri,
      headers: const <String, String>{'Content-Type': 'application/json'},
      body: jsonEncode(<String, dynamic>{
        'email': email.trim(),
        'password': password,
        'returnSecureToken': true,
      }),
    ));
    final Map<String, dynamic> body = _okOrThrow(res);
    return _saveSession(body, emailFallback: email.trim());
  }

  /// Kirim email reset password.
  Future<void> sendPasswordReset(String email) async {
    final Uri uri = Uri.parse(
        '${AppConfig.authBase}/accounts:sendOobCode?key=${AppConfig.firebaseApiKey}');
    final http.Response res = await _guard(_client.post(
      uri,
      headers: const <String, String>{'Content-Type': 'application/json'},
      body: jsonEncode(<String, dynamic>{
        'requestType': 'PASSWORD_RESET',
        'email': email.trim(),
      }),
    ));
    _okOrThrow(res);
  }

  /// Update nama tampilan.
  Future<void> updateDisplayName(String idToken, String name) async {
    final Uri uri = Uri.parse(
        '${AppConfig.authBase}/accounts:update?key=${AppConfig.firebaseApiKey}');
    final http.Response res = await _guard(_client.post(
      uri,
      headers: const <String, String>{'Content-Type': 'application/json'},
      body: jsonEncode(<String, dynamic>{
        'idToken': idToken,
        'displayName': name,
        'returnSecureToken': true,
      }),
    ));
    _okOrThrow(res);
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final AuthSession? s = await loadSession();
    if (s != null) {
      final AuthSession next = AuthSession(
        uid: s.uid,
        email: s.email,
        displayName: name,
        idToken: s.idToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
      );
      await prefs.setString(_prefsKey, jsonEncode(next.toJson()));
    }
  }

  /// Muat sesi tersimpan (null jika belum login).
  Future<AuthSession?> loadSession() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? raw = prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return AuthSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  /// Muat sesi + refresh otomatis jika kedaluwarsa.
  Future<AuthSession?> currentSession() async {
    final AuthSession? s = await loadSession();
    if (s == null) return null;
    if (!s.isExpired) return s;
    try {
      return await refresh(s.refreshToken);
    } catch (_) {
      await signOut();
      return null;
    }
  }

  /// Refresh idToken memakai refreshToken.
  Future<AuthSession> refresh(String refreshToken) async {
    final Uri uri =
        Uri.parse('${AppConfig.secureTokenUrl}?key=${AppConfig.firebaseApiKey}');
    final http.Response res = await _guard(_client.post(
      uri,
      headers: const <String, String>{
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body:
          'grant_type=refresh_token&refresh_token=${Uri.encodeComponent(refreshToken)}',
    ));
    if (res.statusCode != 200) {
      throw AuthException('Sesi kedaluwarsa. Silakan masuk ulang.');
    }
    final Map<String, dynamic> body = _decode(res);
    final AuthSession? old = await loadSession();
    final int expiresIn = int.tryParse('${body['expires_in'] ?? '3600'}') ?? 3600;
    final AuthSession s = AuthSession(
      uid: '${body['user_id'] ?? old?.uid ?? ''}',
      email: old?.email ?? '',
      displayName: old?.displayName ?? '',
      idToken: '${body['id_token']}',
      refreshToken: '${body['refresh_token']}',
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
    );
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, jsonEncode(s.toJson()));
    return s;
  }

  /// Keluar (hapus sesi lokal).
  Future<void> signOut() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsKey);
  }

  void dispose() => _client.close();
}
