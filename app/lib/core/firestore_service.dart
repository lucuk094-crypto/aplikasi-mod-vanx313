import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'firestore_codec.dart';

/// Error dari Firestore REST API.
class FirestoreException implements Exception {
  FirestoreException(this.message, {this.code});
  final String message;
  final int? code;

  @override
  String toString() => 'FirestoreException($code): $message';
}

/// Akses Firestore via REST API (tanpa plugin native).
///
/// Catatan: hanya memakai single-field orderBy / where agar tidak butuh
/// composite index (sama seperti website). Semua request dibatasi timeout
/// dan error jaringan diterjemahkan ke pesan yang ramah.
class FirestoreService {
  FirestoreService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  static const Duration _timeout = Duration(seconds: 20);

  Map<String, String> _headers([String? idToken]) {
    final Map<String, String> h = <String, String>{'Content-Type': 'application/json'};
    if (idToken != null && idToken.isNotEmpty) {
      h['Authorization'] = 'Bearer $idToken';
    }
    return h;
  }

  /// Eksekusi request dengan timeout + error jaringan yang ramah.
  Future<http.Response> _guard(Future<http.Response> call) async {
    try {
      return await call.timeout(_timeout);
    } on TimeoutException {
      throw FirestoreException('Server tidak merespons. Coba lagi.');
    } on SocketException {
      throw FirestoreException('Tidak ada koneksi internet.');
    } on HttpException catch (e) {
      throw FirestoreException('Gangguan jaringan: ${e.message}');
    } on http.ClientException {
      throw FirestoreException('Gagal terhubung ke server.');
    }
  }

  /// Decode JSON dengan aman (tak pernah lempar error mentah).
  T _decode<T>(http.Response res) {
    try {
      return jsonDecode(res.body) as T;
    } catch (_) {
      throw FirestoreException('Respons server tidak valid.',
          code: res.statusCode);
    }
  }

  Never _throw(http.Response res) {
    String msg = 'HTTP ${res.statusCode}';
    try {
      final Map<String, dynamic> body =
          jsonDecode(res.body) as Map<String, dynamic>;
      final Map<String, dynamic>? err = body['error'] as Map<String, dynamic>?;
      if (err != null && err['message'] is String) {
        msg = err['message'] as String;
      }
    } catch (_) {
      // pakai pesan default
    }
    throw FirestoreException(msg, code: res.statusCode);
  }

  /// List dokumen satu koleksi, diurutkan SATU field (aman tanpa index).
  Future<List<Map<String, dynamic>>> list({
    required String collection,
    String orderBy = 'downloads',
    bool descending = true,
    int pageSize = 200,
    int offset = 0,
  }) async {
    final String dir = descending ? 'desc' : 'asc';
    final Uri uri = Uri.parse(
      '${AppConfig.firestoreBase}/$collection'
      '?pageSize=$pageSize&offset=$offset&orderBy=${Uri.encodeComponent('$orderBy $dir')}',
    );
    final http.Response res =
        await _guard(_client.get(uri, headers: _headers()));
    if (res.statusCode != 200) {
      _throw(res);
    }
    final Map<String, dynamic> body =
        _decode<Map<String, dynamic>>(res);
    final List<dynamic>? docs = body['documents'] as List<dynamic>?;
    if (docs == null) return <Map<String, dynamic>>[];
    return docs
        .whereType<Map<String, dynamic>>()
        .map(FirestoreCodec.decodeDoc)
        .toList();
  }

  /// Query dengan filter EQUAL saja (tanpa orderBy -> tanpa composite index).
  Future<List<Map<String, dynamic>>> whereEqual({
    required String collection,
    required String field,
    required dynamic value,
    int limit = 200,
  }) async {
    final Uri uri = Uri.parse('${AppConfig.firestoreBase}:runQuery');
    final Map<String, dynamic> body = <String, dynamic>{
      'structuredQuery': {
        'from': [
          {'collectionId': collection},
        ],
        'where': {
          'fieldFilter': {
            'field': {'fieldPath': field},
            'op': 'EQUAL',
            'value': FirestoreCodec.encodeValue(value),
          },
        },
        'limit': limit,
      },
    };
    final http.Response res = await _guard(_client.post(uri,
        headers: _headers(), body: jsonEncode(body)));
    if (res.statusCode != 200) {
      _throw(res);
    }
    final List<dynamic> rows = _decode<List<dynamic>>(res);
    final List<Map<String, dynamic>> out = <Map<String, dynamic>>[];
    for (final row in rows) {
      if (row is Map<String, dynamic>) {
        final Map<String, dynamic>? doc = row['document'] as Map<String, dynamic>?;
        if (doc != null) {
          out.add(FirestoreCodec.decodeDoc(doc));
        }
      }
    }
    return out;
  }

  /// Ambil satu dokumen. Null jika tidak ada.
  Future<Map<String, dynamic>?> getDoc(String collection, String id) async {
    final Uri uri = Uri.parse('${AppConfig.firestoreBase}/$collection/$id');
    final http.Response res =
        await _guard(_client.get(uri, headers: _headers()));
    if (res.statusCode == 404) return null;
    if (res.statusCode != 200) {
      _throw(res);
    }
    return FirestoreCodec.decodeDoc(_decode<Map<String, dynamic>>(res));
  }

  /// Update sebagian field (butuh login untuk field non-statistik).
  Future<void> updateDoc(
    String collection,
    String id,
    Map<String, dynamic> fields, {
    String? idToken,
  }) async {
    final String mask = fields.keys
        .map((k) => 'updateMask.fieldPaths=${Uri.encodeComponent(k)}')
        .join('&');
    final Uri uri =
        Uri.parse('${AppConfig.firestoreBase}/$collection/$id?$mask');
    final http.Response res = await _guard(_client.patch(
      uri,
      headers: _headers(idToken),
      body: jsonEncode(FirestoreCodec.encodeFields(fields)),
    ));
    if (res.statusCode != 200) {
      _throw(res);
    }
  }

  /// Buat dokumen baru (admin). Mengembalikan ID baru.
  Future<String> createDoc(
    String collection,
    Map<String, dynamic> fields, {
    required String idToken,
  }) async {
    final Uri uri = Uri.parse('${AppConfig.firestoreBase}/$collection');
    final http.Response res = await _guard(_client.post(
      uri,
      headers: _headers(idToken),
      body: jsonEncode(FirestoreCodec.encodeFields(fields)),
    ));
    if (res.statusCode != 200) {
      _throw(res);
    }
    final Map<String, dynamic> body =
        _decode<Map<String, dynamic>>(res);
    return FirestoreCodec.docIdFromName((body['name'] as String?) ?? '');
  }

  /// Hapus dokumen (admin).
  Future<void> deleteDoc(
    String collection,
    String id, {
    required String idToken,
  }) async {
    final Uri uri = Uri.parse('${AppConfig.firestoreBase}/$collection/$id');
    final http.Response res = await _guard(
        _client.delete(uri, headers: _headers(idToken)));
    if (res.statusCode != 200) {
      _throw(res);
    }
  }

  /// Tambah counter (downloads) secara atomik. Boleh tanpa login
  /// (diizinkan firestore.rules sebagai public stats update).
  Future<void> incrementField(
    String collection,
    String id,
    String field, {
    String? idToken,
  }) async {
    final Uri uri = Uri.parse('${AppConfig.firestoreBase}:commit');
    final String docName =
        'projects/${AppConfig.firebaseProjectId}/databases/(default)/documents/$collection/$id';
    final Map<String, dynamic> body = <String, dynamic>{
      'writes': [
        {
          'transform': {
            'document': docName,
            'fieldTransforms': [
              {
                'fieldPath': field,
                'increment': {'integerValue': '1'},
              },
            ],
          },
        },
      ],
    };
    final http.Response res = await _guard(_client.post(
      uri,
      headers: _headers(idToken),
      body: jsonEncode(body),
    ));
    if (res.statusCode != 200) {
      _throw(res);
    }
  }

  /// Ambil stats/global (boleh null).
  Future<Map<String, dynamic>?> getStats() => getDoc('stats', 'global');

  void dispose() => _client.close();
}
