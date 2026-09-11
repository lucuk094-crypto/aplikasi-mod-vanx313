import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import '../core/auth_service.dart';

enum AuthStatus { unknown, guest, authed }

/// State autentikasi global.
class AuthProvider extends ChangeNotifier {
  AuthProvider({required AuthService service}) : _svc = service;

  final AuthService _svc;

  AuthStatus status = AuthStatus.unknown;
  AuthSession? session;
  bool busy = false;
  String? error;

  bool get isAuthed => status == AuthStatus.authed && session != null;

  /// Admin = sudah login DAN email terdaftar di AppConfig.adminEmails.
  bool get isAdmin {
    final String email = session?.email.trim().toLowerCase() ?? '';
    return isAuthed &&
        AppConfig.adminEmails.map((e) => e.toLowerCase()).contains(email);
  }

  /// Token segar (auto-refresh jika kedaluwarsa). Null jika belum login.
  /// Dipakai operasi tulis agar tak gagal karena token basi.
  Future<String?> freshToken() async {
    final AuthSession? s = await _svc.currentSession();
    if (s == null) {
      session = null;
      status = AuthStatus.guest;
      notifyListeners();
      return null;
    }
    session = s;
    return s.idToken;
  }

  Future<void> init() async {
    final AuthSession? s = await _svc.currentSession();
    session = s;
    status = s == null ? AuthStatus.guest : AuthStatus.authed;
    notifyListeners();
  }

  Future<bool> signIn(String email, String password) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      session = await _svc.signIn(email: email, password: password);
      status = AuthStatus.authed;
      return true;
    } on AuthException catch (e) {
      error = e.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<bool> signUp(String name, String email, String password) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      session =
          await _svc.signUp(name: name, email: email, password: password);
      status = AuthStatus.authed;
      return true;
    } on AuthException catch (e) {
      error = e.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<bool> sendReset(String email) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      await _svc.sendPasswordReset(email);
      return true;
    } on AuthException catch (e) {
      error = e.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _svc.signOut();
    session = null;
    status = AuthStatus.guest;
    notifyListeners();
  }

  Future<bool> updateName(String name) async {
    final AuthSession? s = session;
    if (s == null) return false;
    busy = true;
    notifyListeners();
    try {
      await _svc.updateDisplayName(s.idToken, name.trim());
      session = await _svc.loadSession();
      return true;
    } on AuthException catch (e) {
      error = e.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }
}
