import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import '../core/firestore_service.dart';
import '../models/app_review.dart';
import '../models/store_item.dart';

enum CatalogSort { popular, newest, rating }

/// Katalog apps/games/tools + pencarian + riwayat pencarian.
class CatalogProvider extends ChangeNotifier {
  CatalogProvider({required FirestoreService db, required SharedPreferences prefs})
      : _db = db,
        _prefs = prefs {
    for (final c in AppConfig.collections) {
      _all[c] = <StoreItem>[];
      _visible[c] = AppConfig.pageRevealStep;
      _category[c] = '';
      _sort[c] = CatalogSort.popular;
    }
    _history = _prefs.getStringList(_historyKey) ?? <String>[];
  }

  static const String _historyKey = 'vanmod.searchHistory.v1';

  final FirestoreService _db;
  final SharedPreferences _prefs;

  final Map<String, List<StoreItem>> _all = <String, List<StoreItem>>{};
  final Map<String, int> _visible = <String, int>{};
  final Map<String, String> _category = <String, String>{};
  final Map<String, CatalogSort> _sort = <String, CatalogSort>{};

  bool loading = true;
  String? error;
  List<String> _history = <String>[];

  List<String> get searchHistory => List<String>.unmodifiable(_history);

  // ---------- loading ----------

  Future<void> loadInitial() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      await refresh(silent: true);
    } on FirestoreException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Gagal memuat katalog: $e';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Refresh katalog. Tak pernah lempar error (aman untuk RefreshIndicator):
  /// kegagalan dicatat di [error] dan ditampilkan sebagai state error.
  Future<void> refresh({bool silent = false}) async {
    if (!silent) {
      loading = true;
      error = null;
      notifyListeners();
    }
    try {
      final Map<String, List<StoreItem>> next = <String, List<StoreItem>>{};
      for (final c in AppConfig.collections) {
        final List<Map<String, dynamic>> docs = await _db.list(
          collection: c,
          orderBy: 'downloads',
          pageSize: AppConfig.maxDocsPerCollection,
        );
        next[c] = docs
            .map((d) => StoreItem.fromMap(c, '${d['__id']}', d))
            .toList();
      }
      for (final c in AppConfig.collections) {
        _all[c] = next[c] ?? <StoreItem>[];
        _visible[c] = AppConfig.pageRevealStep;
      }
      error = null;
    } on FirestoreException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Gagal memuat katalog: $e';
    } finally {
      if (!silent) {
        loading = false;
        notifyListeners();
      }
    }
  }

  Future<void> retry() async {
    error = null;
    await loadInitial();
  }

  // ---------- filter / sort / paging (client-side, tanpa composite index) ----------

  void setCategory(String collection, String category) {
    _category[collection] = category;
    _visible[collection] = AppConfig.pageRevealStep;
    notifyListeners();
  }

  String activeCategory(String collection) => _category[collection] ?? '';

  void setSort(String collection, CatalogSort sort) {
    _sort[collection] = sort;
    notifyListeners();
  }

  CatalogSort activeSort(String collection) =>
      _sort[collection] ?? CatalogSort.popular;

  void loadMore(String collection) {
    _visible[collection] =
        (_visible[collection] ?? AppConfig.pageRevealStep) + AppConfig.pageRevealStep;
    notifyListeners();
  }

  List<String> categories(String collection) {
    final Set<String> cats = <String>{};
    for (final item in _all[collection] ?? const <StoreItem>[]) {
      if (item.category.isNotEmpty) {
        cats.add(item.category);
      }
    }
    final List<String> out = cats.toList()..sort();
    return out;
  }

  List<StoreItem> _filtered(String collection) {
    final String cat = _category[collection] ?? '';
    final CatalogSort sort = _sort[collection] ?? CatalogSort.popular;
    List<StoreItem> items = List<StoreItem>.from(_all[collection] ?? const <StoreItem>[]);
    if (cat.isNotEmpty) {
      items = items.where((i) => i.category == cat).toList();
    }
    switch (sort) {
      case CatalogSort.popular:
        items.sort((a, b) => b.downloads.compareTo(a.downloads));
        break;
      case CatalogSort.newest:
        items.sort((a, b) {
          final DateTime da =
              a.sortDate ?? DateTime.fromMillisecondsSinceEpoch(0);
          final DateTime db =
              b.sortDate ?? DateTime.fromMillisecondsSinceEpoch(0);
          return db.compareTo(da);
        });
        break;
      case CatalogSort.rating:
        items.sort((a, b) => b.rating.compareTo(a.rating));
        break;
    }
    return items;
  }

  /// Item yang tampil (sudah difilter + dibatasi visible count).
  List<StoreItem> visibleItems(String collection) {
    final List<StoreItem> items = _filtered(collection);
    final int n = _visible[collection] ?? AppConfig.pageRevealStep;
    return items.take(n).toList();
  }

  int filteredCount(String collection) => _filtered(collection).length;

  bool hasMore(String collection) =>
      filteredCount(collection) > visibleItems(collection).length;

  int totalCount(String collection) => (_all[collection] ?? const <StoreItem>[]).length;

  /// Semua item satu koleksi (untuk admin), terbaru dulu.
  List<StoreItem> allItems(String collection) {
    final List<StoreItem> items =
        List<StoreItem>.from(_all[collection] ?? const <StoreItem>[]);
    items.sort((StoreItem a, StoreItem b) {
      final DateTime da = a.sortDate ?? DateTime.fromMillisecondsSinceEpoch(0);
      final DateTime db = b.sortDate ?? DateTime.fromMillisecondsSinceEpoch(0);
      return db.compareTo(da);
    });
    return items;
  }

  // ---------- turunan untuk Home ----------

  List<StoreItem> get _everything =>
      AppConfig.collections.expand((c) => _all[c] ?? const <StoreItem>[]).toList();

  List<StoreItem> get featured {
    final List<StoreItem> items = _everything
      ..sort((a, b) => b.downloads.compareTo(a.downloads));
    return items.take(5).toList();
  }

  List<StoreItem> get topCharts {
    final List<StoreItem> items = _everything
      ..sort((a, b) => b.downloads.compareTo(a.downloads));
    return items.take(10).toList();
  }

  List<StoreItem> get latest {
    final List<StoreItem> items = _everything..sort((a, b) {
        final DateTime da = a.sortDate ?? DateTime.fromMillisecondsSinceEpoch(0);
        final DateTime db = b.sortDate ?? DateTime.fromMillisecondsSinceEpoch(0);
        return db.compareTo(da);
      });
    return items.take(8).toList();
  }

  List<StoreItem> similarTo(StoreItem item, {int limit = 8}) {
    final List<StoreItem> pool = (_all[item.collection] ?? const <StoreItem>[])
        .where((i) => i.id != item.id)
        .toList();
    pool.sort((a, b) {
      int sa = 0;
      int sb = 0;
      if (a.category == item.category) sa += 2;
      if (b.category == item.category) sb += 2;
      sa += a.tags.where(item.tags.contains).length;
      sb += b.tags.where(item.tags.contains).length;
      final int cmp = sb.compareTo(sa);
      if (cmp != 0) return cmp;
      return b.downloads.compareTo(a.downloads);
    });
    return pool.take(limit).toList();
  }

  // ---------- pencarian (client-side, tanpa index) ----------

  List<StoreItem> search(String query) {
    final String q = query.trim().toLowerCase();
    if (q.isEmpty) return const <StoreItem>[];
    final List<StoreItem> hits = _everything.where((i) {
      return i.name.toLowerCase().contains(q) ||
          i.description.toLowerCase().contains(q) ||
          i.category.toLowerCase().contains(q) ||
          i.developer.toLowerCase().contains(q) ||
          i.tags.any((t) => t.toLowerCase().contains(q));
    }).toList();
    hits.sort((a, b) {
      final bool aStarts = a.name.toLowerCase().startsWith(q);
      final bool bStarts = b.name.toLowerCase().startsWith(q);
      if (aStarts != bStarts) return aStarts ? -1 : 1;
      return b.downloads.compareTo(a.downloads);
    });
    return hits;
  }

  Future<void> addSearchHistory(String query) async {
    final String q = query.trim();
    if (q.isEmpty) return;
    _history.remove(q);
    _history.insert(0, q);
    if (_history.length > AppConfig.searchHistoryCap) {
      _history = _history.sublist(0, AppConfig.searchHistoryCap);
    }
    await _prefs.setStringList(_historyKey, _history);
    notifyListeners();
  }

  Future<void> clearSearchHistory() async {
    _history = <String>[];
    await _prefs.remove(_historyKey);
    notifyListeners();
  }

  // ---------- util ----------

  StoreItem? findByKey(String key) {
    for (final c in AppConfig.collections) {
      for (final item in _all[c] ?? const <StoreItem>[]) {
        if (item.key == key) return item;
      }
    }
    return null;
  }

  /// Naikkan counter lokal (+1) setelah download (respons instan).
  void bumpLocal(String key) {
    for (final c in AppConfig.collections) {
      final List<StoreItem>? list = _all[c];
      if (list == null) continue;
      for (int i = 0; i < list.length; i++) {
        if (list[i].key == key) {
          list[i] = list[i].copyWith(downloads: list[i].downloads + 1);
          notifyListeners();
          return;
        }
      }
    }
  }

  /// Refresh satu item dari server (mis. setelah tulis ulasan).
  Future<StoreItem?> refreshItem(String collection, String id) async {
    final Map<String, dynamic>? doc = await _db.getDoc(collection, id);
    if (doc == null) return null;
    final StoreItem fresh = StoreItem.fromMap(collection, id, doc);
    final List<StoreItem>? list = _all[collection];
    if (list != null) {
      final int i = list.indexWhere((e) => e.id == id);
      if (i >= 0) {
        list[i] = fresh;
      } else {
        list.add(fresh);
      }
      notifyListeners();
    }
    return fresh;
  }

  /// Tambah ulasan (butuh login di aplikasi; rules mengizinkan stats update).
  Future<void> submitReview({
    required StoreItem item,
    required double rating,
    required String comment,
    required String userName,
    String? idToken,
  }) async {
    final List<AppReview> next = List<AppReview>.from(item.reviews)
      ..add(AppReview(
        id: 'r-${DateTime.now().millisecondsSinceEpoch}',
        userName: userName,
        rating: rating,
        comment: comment,
        createdAt: DateTime.now(),
      ));
    double avg = 0;
    for (final r in next) {
      avg += r.rating;
    }
    avg = next.isEmpty ? 0 : avg / next.length;
    await _db.updateDoc(
      item.collection,
      item.id,
      <String, dynamic>{
        'reviews': next.map((r) => r.toMap()).toList(),
        'rating': double.parse(avg.toStringAsFixed(1)),
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      },
      idToken: idToken,
    );
    await refreshItem(item.collection, item.id);
  }
}
