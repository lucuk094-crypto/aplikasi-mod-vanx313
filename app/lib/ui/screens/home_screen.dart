import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../models/store_item.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../utils/format.dart';
import '../theme.dart';
import '../widgets.dart';
import 'auth_screen.dart';
import 'browse_screen.dart';
import 'detail_screen.dart';
import 'profile_screen.dart';
import 'search_screen.dart';

/// Beranda ala Play Store: featured, top charts, kategori, rilisan baru.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  void _openDetail(BuildContext context, StoreItem item) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetailScreen(item: item)),
    );
  }

  void _openBrowse(BuildContext context, String collection) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
          builder: (_) => BrowseScreen(collection: collection)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: <Widget>[
            Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: const BoxDecoration(color: VanTheme.lime),
              child: const Text('V',
                  style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.w900,
                      fontSize: 18)),
            ),
            const SizedBox(width: 10),
            const Text('VAN//MOD'),
          ],
        ),
        actions: <Widget>[
          IconButton(
            tooltip: 'Cari',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const SearchScreen()),
            ),
            icon: const Icon(Icons.search),
          ),
          Consumer<AuthProvider>(
            builder: (BuildContext ctx, AuthProvider auth, _) {
              return IconButton(
                tooltip: auth.isAuthed ? 'Akun' : 'Masuk',
                onPressed: () => Navigator.of(ctx).push(
                  MaterialPageRoute<void>(
                    builder: (_) => auth.isAuthed
                        ? const ProfileScreen()
                        : const AuthScreen(),
                  ),
                ),
                icon: Icon(auth.isAuthed
                    ? Icons.account_circle
                    : Icons.account_circle_outlined),
              );
            },
          ),
        ],
      ),
      body: Consumer<CatalogProvider>(
        builder: (BuildContext ctx, CatalogProvider catalog, _) {
          if (catalog.loading &&
              catalog.totalCount('apps') +
                      catalog.totalCount('games') +
                      catalog.totalCount('tools') ==
                  0) {
            return const SkeletonList(count: 8);
          }
          if (catalog.error != null &&
              catalog.totalCount('apps') +
                      catalog.totalCount('games') +
                      catalog.totalCount('tools') ==
                  0) {
            return ErrorState(
                message: catalog.error!, onRetry: catalog.retry);
          }
          return RefreshIndicator(
            color: VanTheme.lime,
            onRefresh: catalog.refresh,
            child: ListView(
              children: <Widget>[
                const _KickerRow('// FEATURED DROPS'),
                _FeaturedCarousel(
                    items: catalog.featured, onTap: _openDetail),
                SectionHeader(
                  title: 'Top Charts',
                  actionLabel: 'Game Teratas',
                  onAction: () => _openBrowse(ctx, 'games'),
                ),
                _ChartsRow(items: catalog.topCharts, onTap: _openDetail),
                const SectionHeader(title: 'Kategori'),
                _CategoryTiles(
                    onOpen: (String c) => _openBrowse(ctx, c)),
                SectionHeader(
                  title: 'Baru Rilis',
                  actionLabel: 'Jelajahi Semua',
                  onAction: () => Navigator.of(ctx).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const SearchScreen()),
                  ),
                ),
                ...catalog.latest.map((StoreItem item) => StoreItemCard(
                      item: item,
                      onTap: () => _openDetail(ctx, item),
                    )),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    AppConfig.storeTagline,
                    textAlign: TextAlign.center,
                    style: VanTheme.mono,
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _KickerRow extends StatelessWidget {
  const _KickerRow(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
      child: Kicker(text),
    );
  }
}

/// Carousel unggulan auto-play.
class _FeaturedCarousel extends StatefulWidget {
  const _FeaturedCarousel({required this.items, required this.onTap});
  final List<StoreItem> items;
  final void Function(BuildContext, StoreItem) onTap;

  @override
  State<_FeaturedCarousel> createState() => _FeaturedCarouselState();
}

class _FeaturedCarouselState extends State<_FeaturedCarousel> {
  late final PageController _ctrl = PageController(viewportFraction: 0.92);
  Timer? _timer;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    if (widget.items.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (!mounted) return;
        _page = (_page + 1) % widget.items.length;
        unawaited(_ctrl.animateToPage(
          _page,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        ));
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return const SizedBox.shrink();
    }
    return Column(
      children: <Widget>[
        SizedBox(
          height: 196,
          child: PageView.builder(
            controller: _ctrl,
            onPageChanged: (int i) => setState(() => _page = i),
            itemCount: widget.items.length,
            itemBuilder: (BuildContext ctx, int i) {
              final StoreItem item = widget.items[i];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Card(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => widget.onTap(ctx, item),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border(
                          left: BorderSide(
                              color: VanTheme.lime, width: 4),
                        ),
                      ),
                      child: Row(
                        children: <Widget>[
                          NetworkIcon(item.icon, size: 92, radius: 6),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: <Widget>[
                                Kicker(
                                    '// ${item.collectionLabel} • ${item.modType.isEmpty ? 'MOD' : item.modType}'),
                                const SizedBox(height: 6),
                                Text(
                                  item.name,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${Fmt.rating(item.rating)} ★  •  ${Fmt.compact(item.downloads)} unduhan',
                                  style: const TextStyle(
                                      color: VanTheme.muted,
                                      fontSize: 12),
                                ),
                                const SizedBox(height: 10),
                                DownloadActionButton(
                                    item, compact: true),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List<Widget>.generate(widget.items.length, (int i) {
            return Container(
              width: _page == i ? 20 : 8,
              height: 8,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: _page == i ? VanTheme.lime : VanTheme.surface2,
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _ChartsRow extends StatelessWidget {
  const _ChartsRow({required this.items, required this.onTap});
  final List<StoreItem> items;
  final void Function(BuildContext, StoreItem) onTap;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: Text('Belum ada data.',
            style: TextStyle(color: VanTheme.muted)),
      );
    }
    return SizedBox(
      height: 92,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (BuildContext ctx, int i) => RankCard(
          rank: i + 1,
          item: items[i],
          onTap: () => onTap(ctx, items[i]),
        ),
      ),
    );
  }
}

class _CategoryTiles extends StatelessWidget {
  const _CategoryTiles({required this.onOpen});
  final void Function(String collection) onOpen;

  @override
  Widget build(BuildContext context) {
    return Consumer<CatalogProvider>(
      builder: (BuildContext ctx, CatalogProvider catalog, _) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: <Widget>[
              _tile(ctx, catalog, 'apps', Icons.apps_outlined),
              const SizedBox(width: 8),
              _tile(ctx, catalog, 'games', Icons.sports_esports_outlined),
              const SizedBox(width: 8),
              _tile(ctx, catalog, 'tools', Icons.build_outlined),
            ],
          ),
        );
      },
    );
  }

  Widget _tile(BuildContext context, CatalogProvider catalog,
      String collection, IconData icon) {
    final String label =
        AppConfig.collectionLabels[collection] ?? collection;
    return Expanded(
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () => onOpen(collection),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: <Widget>[
                Icon(icon, size: 30, color: VanTheme.lime),
                const SizedBox(height: 8),
                Text(label,
                    style: const TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text('${catalog.totalCount(collection)} item',
                    style: const TextStyle(
                        color: VanTheme.muted, fontSize: 12)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
