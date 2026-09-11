import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../models/store_item.dart';
import '../../providers/catalog_provider.dart';
import '../theme.dart';
import '../widgets.dart';
import 'detail_screen.dart';
import 'search_screen.dart';

/// Jelajahi satu koleksi (apps/games/tools) + filter kategori + sortir.
class BrowseScreen extends StatefulWidget {
  const BrowseScreen({
    super.key,
    required this.collection,
    this.initialCategory = '',
    this.initialSort = CatalogSort.popular,
    this.title,
  });

  final String collection;
  final String initialCategory;
  final CatalogSort initialSort;
  final String? title;

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  bool _grid = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final CatalogProvider catalog =
          Provider.of<CatalogProvider>(context, listen: false);
      catalog.setSort(widget.collection, widget.initialSort);
      if (widget.initialCategory.isNotEmpty) {
        catalog.setCategory(widget.collection, widget.initialCategory);
      }
    });
  }

  void _openDetail(BuildContext context, StoreItem item) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetailScreen(item: item)),
    );
  }

  String _sortLabel(CatalogSort s) {
    switch (s) {
      case CatalogSort.popular:
        return 'Terpopuler';
      case CatalogSort.newest:
        return 'Terbaru';
      case CatalogSort.rating:
        return 'Rating Tertinggi';
    }
  }

  @override
  Widget build(BuildContext context) {
    final String title = widget.title ??
        AppConfig.collectionLabels[widget.collection] ??
        widget.collection;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: <Widget>[
          IconButton(
            tooltip: _grid ? 'Tampilan list' : 'Tampilan grid',
            onPressed: () => setState(() => _grid = !_grid),
            icon: Icon(_grid ? Icons.view_list_outlined : Icons.grid_view_outlined),
          ),
          IconButton(
            tooltip: 'Cari',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const SearchScreen()),
            ),
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      body: Consumer<CatalogProvider>(
        builder: (BuildContext ctx, CatalogProvider catalog, _) {
          if (catalog.loading && catalog.totalCount(widget.collection) == 0) {
            return const SkeletonList(count: 8);
          }
          if (catalog.error != null &&
              catalog.totalCount(widget.collection) == 0) {
            return ErrorState(
                message: catalog.error!, onRetry: catalog.retry);
          }
          final List<StoreItem> items =
              catalog.visibleItems(widget.collection);
          final List<String> cats = catalog.categories(widget.collection);
          final String active = catalog.activeCategory(widget.collection);
          return RefreshIndicator(
            color: VanTheme.lime,
            onRefresh: catalog.refresh,
            child: CustomScrollView(
              slivers: <Widget>[
                SliverToBoxAdapter(child: _chips(catalog, cats, active)),
                SliverToBoxAdapter(child: _sortRow(catalog)),
                if (items.isEmpty)
                  const SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.inventory_2_outlined,
                      title: 'Tidak ada item',
                      subtitle: 'Coba kategori atau sortir lain.',
                    ),
                  )
                else if (_grid)
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: 0.72,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (BuildContext c, int i) => StoreItemGridCard(
                          item: items[i],
                          onTap: () => _openDetail(c, items[i]),
                        ),
                        childCount: items.length,
                      ),
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (BuildContext c, int i) => StoreItemCard(
                        item: items[i],
                        onTap: () => _openDetail(c, items[i]),
                      ),
                      childCount: items.length,
                    ),
                  ),
                SliverToBoxAdapter(child: _loadMore(catalog)),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _chips(
      CatalogProvider catalog, List<String> cats, String active) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Row(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: const Text('Semua'),
              selected: active.isEmpty,
              onSelected: (_) =>
                  catalog.setCategory(widget.collection, ''),
            ),
          ),
          ...cats.map((String c) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(c),
                  selected: active == c,
                  onSelected: (_) =>
                      catalog.setCategory(widget.collection, c),
                ),
              )),
        ],
      ),
    );
  }

  Widget _sortRow(CatalogProvider catalog) {
    final CatalogSort sort = catalog.activeSort(widget.collection);
    final int shown = catalog.visibleItems(widget.collection).length;
    final int total = catalog.filteredCount(widget.collection);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              'Menampilkan $shown dari $total',
              style: const TextStyle(color: VanTheme.muted, fontSize: 12),
            ),
          ),
          PopupMenuButton<CatalogSort>(
            tooltip: 'Sortir',
            onSelected: (CatalogSort s) =>
                catalog.setSort(widget.collection, s),
            itemBuilder: (BuildContext ctx) => CatalogSort.values
                .map((CatalogSort s) => PopupMenuItem<CatalogSort>(
                      value: s,
                      child: Row(
                        children: <Widget>[
                          if (s == sort)
                            const Icon(Icons.check,
                                size: 16, color: VanTheme.lime),
                          if (s == sort) const SizedBox(width: 8),
                          Text(_sortLabel(s)),
                        ],
                      ),
                    ))
                .toList(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  const Icon(Icons.sort, size: 18, color: VanTheme.lime),
                  const SizedBox(width: 6),
                  Text(_sortLabel(sort),
                      style: const TextStyle(
                          color: VanTheme.lime,
                          fontWeight: FontWeight.w700,
                          fontSize: 13)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _loadMore(CatalogProvider catalog) {
    if (!catalog.hasMore(widget.collection)) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: NeonButton(
        label: 'Muat Lebih Banyak',
        icon: Icons.expand_more,
        outlined: true,
        onPressed: () => catalog.loadMore(widget.collection),
      ),
    );
  }
}
