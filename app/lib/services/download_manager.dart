import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';
import '../core/firestore_service.dart';
import '../models/store_item.dart';
import '../providers/library_provider.dart';

enum TaskStatus { downloading, completed, failed, canceled }

/// Satu tugas unduhan.
class DownloadTask {
  DownloadTask({
    required this.key,
    required this.item,
    required this.status,
    this.progress = -1,
    this.received = 0,
    this.total = 0,
    this.filePath = '',
    this.error = '',
    this.viaBrowser = false,
  });

  final String key;
  final StoreItem item;
  TaskStatus status;
  double progress; // 0..1, -1 = tak tentu
  int received;
  int total;
  String filePath;
  String error;
  bool viaBrowser;
}

/// Download manager: unduh file langsung dalam aplikasi (dengan progres)
/// atau buka link eksternal (MediaFire/GDrive/dll) di browser.
class DownloadManager extends ChangeNotifier {
  DownloadManager({required FirestoreService db, http.Client? client})
      : _db = db,
        _client = client ?? http.Client();

  final FirestoreService _db;
  final http.Client _client;

  final Map<String, DownloadTask> _tasks = <String, DownloadTask>{};
  final Map<String, StreamSubscription<List<int>>> _subs =
      <String, StreamSubscription<List<int>>>{};

  List<DownloadTask> get tasks => _tasks.values.toList().reversed.toList();

  DownloadTask? taskOf(String key) => _tasks[key];

  bool get hasActive =>
      _tasks.values.any((t) => t.status == TaskStatus.downloading);

  /// Apakah URL bisa diunduh langsung (file), atau harus via browser?
  static bool isDirectUrl(String url) {
    final Uri? uri = Uri.tryParse(url.trim());
    if (uri == null || !uri.hasScheme) return false;
    final String host = uri.host.toLowerCase();
    for (final h in AppConfig.indirectHosts) {
      if (host.contains(h)) return false;
    }
    final String path = uri.path.toLowerCase();
    for (final ext in AppConfig.directExtensions) {
      if (path.endsWith(ext)) return true;
    }
    // Tanpa ekstensi yang dikenal -> anggap halaman web (buka di browser).
    return false;
  }

  /// Mulai unduh. [onBumped] dipanggil setelah counter server naik (opsional).
  Future<void> start(
    StoreItem item, {
    required LibraryProvider library,
    String? idToken,
    void Function()? onDone,
  }) async {
    final String url = item.downloadUrl.trim();
    if (url.isEmpty) {
      _set(DownloadTask(
        key: item.key,
        item: item,
        status: TaskStatus.failed,
        error: 'Link download kosong.',
      ));
      return;
    }
    if (!isDirectUrl(url)) {
      await _openExternal(item, url, library: library, idToken: idToken);
      onDone?.call();
      return;
    }
    await _downloadDirect(item, url,
        library: library, idToken: idToken, onDone: onDone);
  }

  Future<void> _openExternal(
    StoreItem item,
    String url, {
    required LibraryProvider library,
    String? idToken,
  }) async {
    final Uri? uri = Uri.tryParse(url);
    if (uri == null) {
      _set(DownloadTask(
        key: item.key,
        item: item,
        status: TaskStatus.failed,
        error: 'Link tidak valid.',
      ));
      return;
    }
    final bool ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok) {
      _set(DownloadTask(
        key: item.key,
        item: item,
        status: TaskStatus.failed,
        error: 'Tidak bisa membuka browser.',
      ));
      return;
    }
    await library.recordDownload(item: item, filePath: '', viaBrowser: true);
    unawaited(_bump(item, idToken));
    _set(DownloadTask(
      key: item.key,
      item: item,
      status: TaskStatus.completed,
      progress: 1,
      viaBrowser: true,
    ));
  }

  Future<void> _downloadDirect(
    StoreItem item,
    String url, {
    required LibraryProvider library,
    String? idToken,
    void Function()? onDone,
  }) async {
    final String key = item.key;
    _set(DownloadTask(
        key: key, item: item, status: TaskStatus.downloading, progress: -1));
    try {
      final http.StreamedResponse streamed = await _client
          .send(http.Request('GET', Uri.parse(url)))
          .timeout(const Duration(seconds: 30));
      if (streamed.statusCode != 200) {
        throw HttpException('Server: HTTP ${streamed.statusCode}');
      }
      final int total = streamed.contentLength ?? 0;
      final Directory dir = await _downloadDir();
      final File file = File('${dir.path}/${_fileName(item, url)}');
      final IOSink sink = file.openWrite();
      int received = 0;
      final StreamSubscription<List<int>> sub =
          streamed.stream.listen((List<int> chunk) {
        received += chunk.length;
        sink.add(chunk);
        final DownloadTask? t = _tasks[key];
        if (t != null && t.status == TaskStatus.downloading) {
          t.received = received;
          t.total = total;
          t.progress = total > 0 ? received / total : -1;
          notifyListeners();
        }
      }, onError: (Object e) async {
        await sink.close();
        try {
          await file.delete();
        } catch (_) {}
        _subs.remove(key);
        _set(DownloadTask(
          key: key,
          item: item,
          status: TaskStatus.failed,
          error: 'Unduhan gagal: $e',
        ));
      }, onDone: () async {
        await sink.close();
        _subs.remove(key);
        final DownloadTask? t = _tasks[key];
        if (t == null || t.status != TaskStatus.downloading) return;
        await library.recordDownload(item: item, filePath: file.path);
        unawaited(_bump(item, idToken));
        _set(DownloadTask(
          key: key,
          item: item,
          status: TaskStatus.completed,
          progress: 1,
          received: received,
          total: total,
          filePath: file.path,
        ));
        onDone?.call();
      }, cancelOnError: true);
      _subs[key] = sub;
    } catch (e) {
      _subs.remove(key);
      _set(DownloadTask(
        key: key,
        item: item,
        status: TaskStatus.failed,
        error: 'Unduhan gagal: $e',
      ));
    }
  }

  Future<void> cancel(String key) async {
    final StreamSubscription<List<int>>? sub = _subs.remove(key);
    if (sub != null) {
      await sub.cancel();
    }
    final DownloadTask? t = _tasks[key];
    if (t != null && t.status == TaskStatus.downloading) {
      if (t.filePath.isNotEmpty) {
        try {
          await File(t.filePath).delete();
        } catch (_) {}
      }
      t.status = TaskStatus.canceled;
      t.error = 'Dibatalkan.';
      notifyListeners();
    }
  }

  void dismiss(String key) {
    _tasks.remove(key);
    notifyListeners();
  }

  /// Channel ke MainActivity (Android) untuk buka file via FileProvider.
  static const MethodChannel _installer =
      MethodChannel('vanmod.store/install');

  /// Buka/install file hasil unduhan. Mengembalikan pesan untuk snackbar.
  Future<String> openInstall(DownloadTask task) async {
    if (task.viaBrowser || task.filePath.isEmpty) {
      return 'File diunduh via browser. Cek folder Download kamu.';
    }
    final File f = File(task.filePath);
    if (!await f.exists()) {
      return 'File tidak ditemukan (mungkin terhapus). Unduh ulang.';
    }
    if (Platform.isAndroid) {
      try {
        await _installer.invokeMethod('openFile', {'path': task.filePath});
        if (task.item.fileKind == 'apk') {
          return 'Membuka installer… izinkan "Install unknown apps" jika diminta.';
        }
        return 'Membuka file…';
      } on PlatformException catch (e) {
        return 'Tidak bisa membuka file: ${e.message ?? e.code}';
      } catch (e) {
        return 'Tidak bisa membuka file: $e';
      }
    }
    try {
      final bool ok = await launchUrl(Uri.file(task.filePath));
      return ok ? 'Membuka file…' : 'Tidak bisa membuka file.';
    } catch (e) {
      return 'Tidak bisa membuka file: $e';
    }
  }

  /// Buka folder berisi file (Windows) / tampilkan path (Android).
  Future<String> revealInFolder(String filePath) async {
    if (filePath.isEmpty) return 'Path kosong.';
    final Directory dir = File(filePath).parent;
    if (!await dir.exists()) return 'Folder tidak ditemukan.';
    if (!Platform.isAndroid) {
      try {
        final bool ok = await launchUrl(Uri.file(dir.path));
        if (ok) return 'Membuka folder…';
      } catch (_) {}
    }
    return 'Folder: ${dir.path}';
  }

  Future<void> _bump(StoreItem item, String? idToken) async {
    try {
      await _db.incrementField(item.collection, item.id, 'downloads',
          idToken: idToken);
    } catch (_) {
      // counter gagal -> abaikan, unduhan tetap sukses
    }
  }

  void _set(DownloadTask t) {
    _tasks[t.key] = t;
    notifyListeners();
  }

  Future<Directory> _downloadDir() async {
    if (Platform.isWindows) {
      final Directory? dl = await getDownloadsDirectory();
      if (dl != null) {
        final Directory v = Directory('${dl.path}\\VAN MOD');
        await v.create(recursive: true);
        return v;
      }
    }
    if (Platform.isAndroid) {
      final Directory? ext = await getExternalStorageDirectory();
      if (ext != null) {
        final Directory v = Directory('${ext.path}/downloads');
        await v.create(recursive: true);
        return v;
      }
    }
    final Directory docs = await getApplicationDocumentsDirectory();
    final Directory v = Directory('${docs.path}/downloads');
    await v.create(recursive: true);
    return v;
  }

  String _fileName(StoreItem item, String url) {
    final Uri? uri = Uri.tryParse(url);
    final String last = uri == null || uri.pathSegments.isEmpty
        ? ''
        : uri.pathSegments.last;
    if (last.contains('.')) {
      return _safe(last);
    }
    final String base =
        item.packageName.isNotEmpty ? item.packageName : item.id;
    final String ext = item.fileKind == 'exe'
        ? '.exe'
        : item.fileKind == 'zip'
            ? '.zip'
            : '.apk';
    final String v = item.version.isEmpty ? '' : '_${item.version}';
    return _safe('$base$v$ext');
  }

  String _safe(String s) => s.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');
}
