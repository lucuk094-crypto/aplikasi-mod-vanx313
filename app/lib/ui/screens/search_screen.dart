import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../models/store_item.dart';
import '../../providers/catalog_provider.dart';
import '../theme.dart';
import '../widgets.dart';
import 'detail_screen.dart';

/// Pencarian lintas koleksi + riwayat pencarian.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, this.initialQuery = ''});

  final String initialQuery;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final TextEditingController _ctrl =
      TextEditingController(text: widget.initialQuery);
  String _query = '';

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery;
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _openDetail(BuildContext context, StoreItem item) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetailScreen(item: item)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _ctrl,
          autofocus: widget.initialQuery.isEmpty,
          textInputAction: TextInputAction.search,
          style: const TextStyle(color: VanTheme.text, fontSize: 16),
          decoration: const InputDecoration(
            hintText: 'Cari aplikasi, game, tools…',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            filled: false,
            contentPadding: EdgeInsets.zero,
          ),
          onChanged: (String v) => setState(() => _query = v),
          onSubmitted: (String v) {
            if (v.trim().isEmpty) return;
            unawaited(Provider.of<CatalogProvider>(context, listen: false)
                .addSearchHistory(v));
          },
        ),
        actions: <Widget>[
          if (_query.isNotEmpty)
            IconButton(
              tooltip: 'Hapus',
              onPressed: () {
                _ctrl.clear();
                setState(() => _query = '');
              },
              icon: const Icon(Icons.clear),
            ),
        ],
      ),
      body: Consumer<CatalogProvider>(
        builder: (BuildContext ctx, CatalogProvider catalog, _) {
          if (_query.trim().isEmpty) {
            return _history(ctx, catalog);
          }
          final List<StoreItem> hits = catalog.search(_query);
          if (hits.isEmpty) {
            return EmptyState(
              icon: Icons.search_off_outlined,
              title: 'Tidak ketemu',
              subtitle: 'Coba kata kunci lain untuk "$_query".',
            );
          }
          return ListView(
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Text(
                  '${hits.length} hasil untuk "$_query"',
                  style:
                      const TextStyle(color: VanTheme.muted, fontSize: 12),
                ),
              ),
              ..._grouped(ctx, hits),
              const SizedBox(height: 16),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _grouped(BuildContext context, List<StoreItem> hits) {
    final List<Widget> out = <Widget>[];
    for (final String c in AppConfig.collections) {
      final List<StoreItem> group =
          hits.where((StoreItem i) => i.collection == c).toList();
      if (group.isEmpty) continue;
      out.add(SectionHeader(
          title: AppConfig.collectionLabels[c] ?? c));
      for (final StoreItem item in group) {
        out.add(StoreItemCard(
          item: item,
          onTap: () => _openDetail(context, item),
        ));
      }
    }
    return out;
  }

  Widget _history(BuildContext context, CatalogProvider catalog) {
    final List<String> history = catalog.searchHistory;
    if (history.isEmpty) {
      return const EmptyState(
        icon: Icons.history,
        title: 'Cari sesuatu',
        subtitle: 'Hasil pencarian akan muncul di sini.',
      );
    }
    return ListView(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
          child: Row(
            children: <Widget>[
              const Expanded(child: Kicker('// TERAKHIR DICARI')),
              TextButton(
                onPressed: catalog.clearSearchHistory,
                child: const Text('HAPUS'),
              ),
            ],
          ),
        ),
        ...history.map((String q) => ListTile(
              leading: const Icon(Icons.history,
                  color: VanTheme.muted, size: 20),
              title: Text(q),
              trailing: const Icon(Icons.north_west,
                  color: VanTheme.muted, size: 18),
              onTap: () {
                _ctrl.text = q;
                setState(() => _query = q);
              },
            )),
      ],
    );
  }
}
