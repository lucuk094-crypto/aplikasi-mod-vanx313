import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import '../models/store_item.dart';
import 'catalog_provider.dart';

/// Satu entri riwayat unduhan.
class HistoryEntry {
  HistoryEntry({
    required this.key,
    required this.collection,
    required this.id,
    required this.name,
    required this.icon,
    required this.version,
    required this.downloadedAt,
    this.filePath = '',
    this.viaBrowser = false,
  });

  final String key;
  final String collection;
  final String id;
  final String name;
  final String icon;
  final String version;
  final DateTime downloadedAt;
  final String filePath;
  final bool viaBrowser;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'key': key,
        'collection': collection,
        'id': id,
        'name': name,
        'icon': icon,
        'version': version,
        'downloadedAt': downloadedAt.toIso8601String(),
        'filePath': filePath,
        'viaBrowser': viaBrowser,
      };

  factory HistoryEntry.fromJson(Map<String, dynamic> j) => HistoryEntry(
        key: '${j['key']}',
        collection: '${j['collection']}',
        id: '${j['id']}',
        name: '${j['name']}',
        icon: '${j['icon']}',
        version: '${j['version']}',
        downloadedAt:
            DateTime.tryParse('${j['downloadedAt']}') ?? DateTime.now(),
        filePath: '${j['filePath'] ?? ''}',
        viaBrowser: j['viaBrowser'] == true,
      );
}

/// Info update tersedia: item katalog + versi lama yang diunduh user.
class UpdateInfo {
  UpdateInfo({required this.item, required this.oldVersion});
  final StoreItem item;
  final String oldVersion;
}

/// Wishlist + riwayat + deteksi update (tersimpan lokal).
class LibraryProvider extends ChangeNotifier {
  LibraryProvider({required SharedPreferences prefs}) : _prefs = prefs {
    _wishlist =
        (_prefs.getStringList(_wishKey) ?? <String>[]).toSet();
    final List<String> raw = _prefs.getStringList(_historyKey) ?? <String>[];
    _history = <HistoryEntry>[];
    for (final s in raw) {
      try {
        _history.add(
            HistoryEntry.fromJson(jsonDecode(s) as Map<String, dynamic>));
      } catch (_) {
        // lewati entri rusak
      }
    }
  }

  static const String _wishKey = 'vanmod.wishlist.v1';
  static const String _historyKey = 'vanmod.history.v1';

  final SharedPreferences _prefs;
  Set<String> _wishlist = <String>{};
  List<HistoryEntry> _history = <HistoryEntry>[];

  // ---------- wishlist ----------

  bool isWished(String key) => _wishlist.contains(key);

  int get wishlistCount => _wishlist.length;

  Future<void> toggleWish(String key) async {
    if (_wishlist.contains(key)) {
      _wishlist.remove(key);
    } else {
      _wishlist.add(key);
    }
    await _prefs.setStringList(_wishKey, _wishlist.toList());
    notifyListeners();
  }

  /// Item wishlist yang masih ada di katalog (resolusi via catalog).
  List<StoreItem> wishedItems(CatalogProvider catalog) {
    final List<StoreItem> out = <StoreItem>[];
    for (final key in _wishlist) {
      final StoreItem? item = catalog.findByKey(key);
      if (item != null) {
        out.add(item);
      }
    }
    out.sort((a, b) => a.name.compareTo(b.name));
    return out;
  }

  // ---------- riwayat ----------

  List<HistoryEntry> get history => List<HistoryEntry>.unmodifiable(_history);

  Future<void> recordDownload({
    required StoreItem item,
    required String filePath,
    bool viaBrowser = false,
  }) async {
    _history.removeWhere((e) => e.key == item.key);
    _history.insert(
      0,
      HistoryEntry(
        key: item.key,
        collection: item.collection,
        id: item.id,
        name: item.name,
        icon: item.icon,
        version: item.version,
        downloadedAt: DateTime.now(),
        filePath: filePath,
        viaBrowser: viaBrowser,
      ),
    );
    if (_history.length > AppConfig.historyCap) {
      _history = _history.sublist(0, AppConfig.historyCap);
    }
    await _prefs.setStringList(
      _historyKey,
      _history.map((e) => jsonEncode(e.toJson())).toList(),
    );
    notifyListeners();
  }

  Future<void> clearHistory() async {
    _history = <HistoryEntry>[];
    await _prefs.remove(_historyKey);
    notifyListeners();
  }

  // ---------- update ----------

  /// Daftar item yang versinya lebih baru dari yang pernah diunduh.
  List<UpdateInfo> updatesAvailable(CatalogProvider catalog) {
    final List<UpdateInfo> out = <UpdateInfo>[];
    for (final h in _history) {
      final StoreItem? item = catalog.findByKey(h.key);
      if (item == null) continue;
      if (item.version.isEmpty || h.version.isEmpty) continue;
      if (item.version != h.version) {
        out.add(UpdateInfo(item: item, oldVersion: h.version));
      }
    }
    return out;
  }
}
