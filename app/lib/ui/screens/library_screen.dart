import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/store_item.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/library_provider.dart';
import '../../services/download_manager.dart';
import '../../utils/format.dart';
import '../theme.dart';
import '../widgets.dart';
import 'detail_screen.dart';

/// Pustaka: Unduhan, Update, Wishlist, Riwayat.
class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  void _openDetail(BuildContext context, StoreItem item) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetailScreen(item: item)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Pustaka'),
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'Unduhan'),
              Tab(text: 'Update'),
              Tab(text: 'Wishlist'),
              Tab(text: 'Riwayat'),
            ],
          ),
        ),
        body: TabBarView(
          children: <Widget>[
            _DownloadsTab(onOpen: _openDetail),
            _UpdatesTab(onOpen: _openDetail),
            _WishlistTab(onOpen: _openDetail),
            const _HistoryTab(),
          ],
        ),
      ),
    );
  }
}

// ================= unduhan =================

class _DownloadsTab extends StatelessWidget {
  const _DownloadsTab({required this.onOpen});
  final void Function(BuildContext, StoreItem) onOpen;

  @override
  Widget build(BuildContext context) {
    return Consumer<DownloadManager>(
      builder: (BuildContext ctx, DownloadManager dm, _) {
        final List<DownloadTask> tasks = dm.tasks;
        if (tasks.isEmpty) {
          return const EmptyState(
            icon: Icons.download_outlined,
            title: 'Belum ada unduhan',
            subtitle: 'Unduh aplikasi favoritmu dan kelola di sini.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: tasks.length,
          itemBuilder: (BuildContext c, int i) =>
              _taskCard(c, dm, tasks[i]),
        );
      },
    );
  }

  Widget _taskCard(BuildContext context, DownloadManager dm, DownloadTask t) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              InkWell(
                onTap: () => onOpen(context, t.item),
                child: Row(
                  children: <Widget>[
                    NetworkIcon(t.item.icon, size: 46),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(t.item.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700)),
                          Text(
                            t.viaBrowser
                                ? 'Via browser'
                                : _statusText(t),
                            style: const TextStyle(
                                color: VanTheme.muted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    _taskAction(context, dm, t),
                  ],
                ),
              ),
              if (t.status == TaskStatus.downloading) ...<Widget>[
                const SizedBox(height: 10),
                LinearProgressIndicator(
                    value: t.progress < 0 ? null : t.progress),
              ],
              if (t.error.isNotEmpty &&
                  t.status == TaskStatus.failed) ...<Widget>[
                const SizedBox(height: 6),
                Text(t.error,
                    style: const TextStyle(
                        color: VanTheme.danger, fontSize: 12)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _statusText(DownloadTask t) {
    switch (t.status) {
      case TaskStatus.downloading:
        if (t.total > 0) {
          return '${(t.progress * 100).toStringAsFixed(0)}% • ${Fmt.compact(t.received)} / ${Fmt.compact(t.total)}';
        }
        return 'Mengunduh… ${Fmt.compact(t.received)}';
      case TaskStatus.completed:
        return 'Selesai • ${Fmt.compact(t.received)}';
      case TaskStatus.failed:
        return 'Gagal';
      case TaskStatus.canceled:
        return 'Dibatalkan';
    }
  }

  Widget _taskAction(
      BuildContext context, DownloadManager dm, DownloadTask t) {
    switch (t.status) {
      case TaskStatus.downloading:
        return TextButton(
          onPressed: () => dm.cancel(t.key),
          child: const Text('BATAL'),
        );
      case TaskStatus.completed:
        return NeonButton(
          label: t.viaBrowser ? 'Link' : 'Buka',
          small: true,
          onPressed: () async {
            final String msg = await dm.openInstall(t);
            if (!context.mounted) return;
            ScaffoldMessenger.of(context)
                .showSnackBar(SnackBar(content: Text(msg)));
          },
        );
      case TaskStatus.failed:
      case TaskStatus.canceled:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            IconButton(
              tooltip: 'Hapus',
              onPressed: () => dm.dismiss(t.key),
              icon: const Icon(Icons.close,
                  color: VanTheme.muted, size: 20),
            ),
            NeonButton(
              label: 'Ulangi',
              small: true,
              outlined: true,
              onPressed: () {
                final LibraryProvider lib =
                    Provider.of<LibraryProvider>(context, listen: false);
                final AuthProvider auth =
                    Provider.of<AuthProvider>(context, listen: false);
                unawaited(dm.start(t.item,
                    library: lib, idToken: auth.session?.idToken));
              },
            ),
          ],
        );
    }
  }
}

// ================= update =================

class _UpdatesTab extends StatelessWidget {
  const _UpdatesTab({required this.onOpen});
  final void Function(BuildContext, StoreItem) onOpen;

  @override
  Widget build(BuildContext context) {
    return Consumer2<LibraryProvider, CatalogProvider>(
      builder: (BuildContext ctx, LibraryProvider lib,
          CatalogProvider catalog, _) {
        final List<UpdateInfo> updates = lib.updatesAvailable(catalog);
        if (updates.isEmpty) {
          return EmptyState(
            icon: Icons.system_update_alt_outlined,
            title: 'Semua versi terbaru',
            subtitle: lib.history.isEmpty
                ? 'Unduh aplikasi dulu, update-nya akan muncul di sini.'
                : 'Tidak ada update tersedia saat ini.',
            actionLabel: 'Refresh Katalog',
            onAction: catalog.refresh,
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: updates.length,
          itemBuilder: (BuildContext c, int i) {
            final UpdateInfo u = updates[i];
            return Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              child: Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => onOpen(c, u.item),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: <Widget>[
                        NetworkIcon(u.item.icon, size: 46),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(u.item.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700)),
                              Text(
                                'v${u.oldVersion}  →  v${u.item.version}',
                                style: const TextStyle(
                                    color: VanTheme.lime, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        NeonButton(
                          label: 'Update',
                          icon: Icons.system_update_alt,
                          small: true,
                          onPressed: () {
                            final DownloadManager dm =
                                Provider.of<DownloadManager>(c,
                                    listen: false);
                            final AuthProvider auth =
                                Provider.of<AuthProvider>(c,
                                    listen: false);
                            unawaited(dm.start(u.item,
                                library: lib,
                                idToken: auth.session?.idToken));
                            ScaffoldMessenger.of(c).showSnackBar(
                              const SnackBar(
                                  content: Text(
                                      'Mengunduh update… pantau di tab Unduhan.')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

// ================= wishlist =================

class _WishlistTab extends StatelessWidget {
  const _WishlistTab({required this.onOpen});
  final void Function(BuildContext, StoreItem) onOpen;

  @override
  Widget build(BuildContext context) {
    return Consumer2<LibraryProvider, CatalogProvider>(
      builder: (BuildContext ctx, LibraryProvider lib,
          CatalogProvider catalog, _) {
        final List<StoreItem> items = lib.wishedItems(catalog);
        if (items.isEmpty) {
          return const EmptyState(
            icon: Icons.bookmark_border,
            title: 'Wishlist kosong',
            subtitle:
                'Ketuk ikon bookmark di halaman detail untuk menyimpan.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: items.length,
          itemBuilder: (BuildContext c, int i) => Dismissible(
            key: ValueKey<String>('wish-${items[i].key}'),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              color: VanTheme.danger,
              child: const Icon(Icons.delete_outline, color: Colors.black),
            ),
            onDismissed: (_) => lib.toggleWish(items[i].key),
            child: StoreItemCard(
              item: items[i],
              onTap: () => onOpen(c, items[i]),
            ),
          ),
        );
      },
    );
  }
}

// ================= riwayat =================

class _HistoryTab extends StatelessWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<LibraryProvider>(
      builder: (BuildContext ctx, LibraryProvider lib, _) {
        final List<HistoryEntry> history = lib.history;
        if (history.isEmpty) {
          return const EmptyState(
            icon: Icons.history,
            title: 'Riwayat kosong',
            subtitle: 'Semua yang kamu unduh tercatat di sini.',
          );
        }
        return Column(
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 8, 0),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      '${history.length} entri',
                      style: const TextStyle(
                          color: VanTheme.muted, fontSize: 12),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _confirmClear(ctx, lib),
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: const Text('HAPUS RIWAYAT'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: history.length,
                itemBuilder: (BuildContext c, int i) {
                  final HistoryEntry h = history[i];
                  return ListTile(
                    leading: NetworkIcon(h.icon, size: 44),
                    title: Text(h.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    subtitle: Text(
                      'v${h.version} • ${Fmt.timeAgo(h.downloadedAt)}${h.viaBrowser ? ' • via browser' : ''}',
                      style:
                          const TextStyle(color: VanTheme.muted, fontSize: 12),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _confirmClear(BuildContext context, LibraryProvider lib) async {
    final bool? ok = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Hapus riwayat?'),
        content:
            const Text('Semua catatan unduhan akan dihapus permanen.'),
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
    if (ok == true) {
      await lib.clearHistory();
    }
  }
}
