import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../core/firestore_service.dart';
import '../../models/store_item.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../utils/format.dart';
import '../theme.dart';
import '../widgets.dart';
import 'admin_editor_screen.dart';
import 'detail_screen.dart';

/// Admin Panel: statistik + kelola katalog (tambah/ubah/hapus).
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  String _collection = 'apps';
  Map<String, dynamic>? _stats;
  bool _statsLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStats());
  }

  Future<void> _loadStats() async {
    setState(() => _statsLoading = true);
    final FirestoreService db =
        Provider.of<FirestoreService>(context, listen: false);
    try {
      final Map<String, dynamic>? s = await db.getStats();
      if (!mounted) return;
      setState(() {
        _stats = s;
        _statsLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _statsLoading = false);
    }
  }

  Future<void> _delete(
      BuildContext context, CatalogProvider catalog, StoreItem item) async {
    final bool? ok = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Hapus item?'),
        content: Text(
            '"${item.name}" akan dihapus permanen dari katalog. Lanjutkan?'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('BATAL'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('HAPUS'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final FirestoreService db =
        Provider.of<FirestoreService>(context, listen: false);
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    final String? token = await auth.freshToken();
    if (!context.mounted) return;
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sesi habis. Masuk ulang.')),
      );
      return;
    }
    try {
      await db.deleteDoc(item.collection, item.id, idToken: token);
      await catalog.refresh();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"${item.name}" dihapus.')),
      );
      _loadStats();
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal menghapus: $e')),
      );
    }
  }

  Future<void> _openEditor(BuildContext context,
      {required String collection, StoreItem? item}) async {
    final bool? saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
          builder: (_) =>
              AdminEditorScreen(collection: collection, item: item)),
    );
    if (saved == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(item == null
                ? 'Item baru ditambahkan.'
                : 'Perubahan disimpan.')),
      );
      _loadStats();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, CatalogProvider>(
      builder: (BuildContext ctx, AuthProvider auth,
          CatalogProvider catalog, _) {
        if (!auth.isAdmin) {
          return Scaffold(
            appBar: AppBar(title: const Text('Admin Panel')),
            body: const EmptyState(
              icon: Icons.lock_outline,
              title: 'Akses ditolak',
              subtitle: 'Halaman ini khusus admin VAN MOD.',
            ),
          );
        }
        final List<StoreItem> items = catalog.allItems(_collection);
        return Scaffold(
          appBar: AppBar(
            title: const Text('Admin Panel'),
            actions: <Widget>[
              IconButton(
                tooltip: 'Refresh',
                onPressed: () {
                  catalog.refresh();
                  _loadStats();
                },
                icon: const Icon(Icons.refresh),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () =>
                _openEditor(ctx, collection: _collection),
            icon: const Icon(Icons.add),
            label: const Text('TAMBAH'),
          ),
          body: RefreshIndicator(
            color: VanTheme.lime,
            onRefresh: () async {
              await catalog.refresh();
              await _loadStats();
            },
            child: ListView(
              children: <Widget>[
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Kicker('// STATISTIK GLOBAL'),
                ),
                _statsRow(catalog),
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Kicker('// KELOLA KATALOG'),
                ),
                _collectionChips(),
                ...items.map((StoreItem item) => Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      child: Card(
                        child: ListTile(
                          leading:
                              NetworkIcon(item.icon, size: 44),
                          title: Text(item.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700)),
                          subtitle: Text(
                            'v${item.version} • ${Fmt.compact(item.downloads)} unduhan • ★ ${Fmt.rating(item.rating)}',
                            style: const TextStyle(
                                color: VanTheme.muted, fontSize: 12),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              IconButton(
                                tooltip: 'Lihat',
                                onPressed: () =>
                                    Navigator.of(ctx).push(
                                  MaterialPageRoute<void>(
                                      builder: (_) =>
                                          DetailScreen(item: item)),
                                ),
                                icon: const Icon(
                                    Icons.visibility_outlined,
                                    size: 20,
                                    color: VanTheme.muted),
                              ),
                              IconButton(
                                tooltip: 'Ubah',
                                onPressed: () => _openEditor(ctx,
                                    collection: _collection,
                                    item: item),
                                icon: const Icon(Icons.edit_outlined,
                                    size: 20),
                              ),
                              IconButton(
                                tooltip: 'Hapus',
                                onPressed: () =>
                                    _delete(ctx, catalog, item),
                                icon: const Icon(
                                    Icons.delete_outline,
                                    size: 20,
                                    color: VanTheme.danger),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )),
                if (items.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'Koleksi ini masih kosong. Ketuk + TAMBAH.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: VanTheme.muted),
                    ),
                  ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _statsRow(CatalogProvider catalog) {
    if (_statsLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: LinearProgressIndicator(),
      );
    }
    int sumDownloads = 0;
    int sumReviews = 0;
    for (final String c in AppConfig.collections) {
      for (final StoreItem i in catalog.allItems(c)) {
        sumDownloads += i.downloads;
        sumReviews += i.reviews.length;
      }
    }
    final int totalDownloads =
        (_stats?['totalDownloads'] as num?)?.toInt() ?? sumDownloads;
    final int totalReviews =
        (_stats?['totalReviews'] as num?)?.toInt() ?? sumReviews;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              _statCard('APLIKASI',
                  '${catalog.totalCount('apps')}', Icons.apps_outlined),
              _statCard('GAME', '${catalog.totalCount('games')}',
                  Icons.sports_esports_outlined),
              _statCard('TOOLS', '${catalog.totalCount('tools')}',
                  Icons.build_outlined),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              _statCard('TOTAL UNDUHAN', Fmt.compact(totalDownloads),
                  Icons.download_outlined),
              _statCard('TOTAL ULASAN', Fmt.compact(totalReviews),
                  Icons.rate_review_outlined),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              children: <Widget>[
                Icon(icon, size: 20, color: VanTheme.lime),
                const SizedBox(height: 6),
                Text(value,
                    style: const TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w900)),
                Text(label,
                    style: const TextStyle(
                        color: VanTheme.muted, fontSize: 10)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _collectionChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: AppConfig.collections.map((String c) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(
                  AppConfig.collectionLabels[c] ?? c),
              selected: _collection == c,
              onSelected: (_) => setState(() => _collection = c),
            ),
          );
        }).toList(),
      ),
    );
  }
}
