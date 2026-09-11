import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/app_review.dart';
import '../../models/store_item.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../utils/format.dart';
import '../theme.dart';
import '../widgets.dart';
import 'auth_screen.dart';

/// Detail aplikasi: info, screenshot, ulasan, unduh/install.
class DetailScreen extends StatelessWidget {
  const DetailScreen({super.key, required this.item});
  final StoreItem item;

  void _openDetail(BuildContext context, StoreItem other) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => DetailScreen(item: other)),
    );
  }

  Future<void> _openInBrowser(BuildContext context) async {
    final String url = item.downloadUrl.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Link download kosong.')),
      );
      return;
    }
    final Uri? uri = Uri.tryParse(url);
    final bool ok =
        uri != null && await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!context.mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tidak bisa membuka browser.')),
      );
    }
  }

  Future<void> _copyLink(BuildContext context) async {
    final String url = item.downloadUrl.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Link download kosong.')),
      );
      return;
    }
    await Clipboard.setData(ClipboardData(text: url));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Link download disalin.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CatalogProvider>(
      builder: (BuildContext ctx, CatalogProvider catalog, _) {
        final StoreItem fresh = catalog.findByKey(item.key) ?? item;
        return Scaffold(
          appBar: AppBar(
            title: Text(fresh.name,
                maxLines: 1, overflow: TextOverflow.ellipsis),
            actions: <Widget>[
              WishlistButton(fresh),
              IconButton(
                tooltip: 'Salin link download',
                onPressed: () => _copyLink(ctx),
                icon: const Icon(Icons.share_outlined),
              ),
            ],
          ),
          body: ListView(
            children: <Widget>[
              _header(ctx, fresh),
              _stats(fresh),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: DownloadActionButton(fresh),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: NeonButton(
                  label: 'Buka di Browser',
                  icon: Icons.open_in_browser_outlined,
                  outlined: true,
                  onPressed: () => _openInBrowser(ctx),
                ),
              ),
              if (fresh.screenshots.isNotEmpty) ...<Widget>[
                const SectionHeader(title: 'Screenshot'),
                _screenshots(ctx, fresh),
              ],
              const SectionHeader(title: 'Tentang'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SelectableText(
                  fresh.description.isEmpty
                      ? 'Belum ada deskripsi.'
                      : fresh.description,
                  style:
                      const TextStyle(height: 1.5, color: VanTheme.text),
                ),
              ),
              if (fresh.tags.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: fresh.tags
                        .map((String t) => Chip(label: Text(t)))
                        .toList(),
                  ),
                ),
              const SectionHeader(title: 'Informasi'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    child: Column(
                      children: <Widget>[
                        InfoRow('Versi', fresh.version),
                        InfoRow('Ukuran', fresh.size),
                        InfoRow('Kategori', fresh.category),
                        InfoRow('Tipe', fresh.modType),
                        InfoRow('Developer', fresh.developer),
                        InfoRow('Package', fresh.packageName),
                        InfoRow('Min. Android', fresh.androidVersion),
                        InfoRow('Lisensi', fresh.license),
                        InfoRow('Diupdate', Fmt.date(fresh.updatedAt)),
                        InfoRow('Dirilis', Fmt.date(fresh.createdAt)),
                      ],
                    ),
                  ),
                ),
              ),
              _reviews(ctx, fresh),
              const SectionHeader(title: 'Mungkin Kamu Suka'),
              _similar(ctx, catalog.similarTo(fresh)),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _header(BuildContext context, StoreItem fresh) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          NetworkIcon(fresh.icon, size: 84, radius: 8),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Kicker('// ${fresh.typeBadge} ${fresh.modType}'),
                const SizedBox(height: 4),
                Text(fresh.name,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text(
                  fresh.developer.isEmpty ? '-' : fresh.developer,
                  style: const TextStyle(color: VanTheme.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stats(StoreItem fresh) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: <Widget>[
              _stat('${Fmt.rating(fresh.rating)} ★',
                  '${fresh.reviews.length} ulasan'),
              _divider(),
              _stat(Fmt.compact(fresh.downloads), 'Unduhan'),
              _divider(),
              _stat(fresh.size.isEmpty ? '-' : fresh.size, 'Ukuran'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stat(String value, String label) {
    return Expanded(
      child: Column(
        children: <Widget>[
          Text(value,
              style: const TextStyle(
                  fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 2),
          Text(label,
              style:
                  const TextStyle(color: VanTheme.muted, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(
        width: 1, height: 32, color: VanTheme.lime.withValues(alpha: 0.2));
  }

  Widget _screenshots(BuildContext context, StoreItem fresh) {
    return SizedBox(
      height: 200,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: fresh.screenshots.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (BuildContext ctx, int i) {
          final String url = fresh.screenshots[i];
          return InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: () => showDialog<void>(
              context: ctx,
              builder: (_) => Dialog(
                insetPadding: const EdgeInsets.all(16),
                child: Stack(
                  children: <Widget>[
                    InteractiveViewer(
                      child: Image.network(url,
                          errorBuilder: (BuildContext c, Object e,
                                  StackTrace? s) =>
                              const Padding(
                                padding: EdgeInsets.all(32),
                                child: Text('Gambar gagal dimuat.'),
                              )),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: IconButton(
                        tooltip: 'Tutup',
                        onPressed: () => Navigator.of(ctx).pop(),
                        icon: const Icon(Icons.close),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                url,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (BuildContext c, Object e, StackTrace? s) =>
                    Container(
                  width: 140,
                  height: 200,
                  color: VanTheme.surface2,
                  alignment: Alignment.center,
                  child: const Icon(Icons.broken_image_outlined,
                      color: VanTheme.muted),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _reviews(BuildContext context, StoreItem fresh) {
    final List<AppReview> revs = List<AppReview>.from(fresh.reviews)
      ..sort((AppReview a, AppReview b) {
        final DateTime da =
            a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final DateTime db =
            b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return db.compareTo(da);
      });
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        SectionHeader(title: 'Ulasan (${revs.length})'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: <Widget>[
              Text(
                Fmt.rating(fresh.rating),
                style: const TextStyle(
                    fontSize: 40, fontWeight: FontWeight.w900),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Stars(fresh.rating, size: 18),
                  const SizedBox(height: 4),
                  Text('${revs.length} ulasan',
                      style: const TextStyle(color: VanTheme.muted)),
                ],
              ),
              const Spacer(),
              NeonButton(
                label: 'Tulis',
                icon: Icons.rate_review_outlined,
                small: true,
                outlined: true,
                onPressed: () => _writeReview(context, fresh),
              ),
            ],
          ),
        ),
        if (revs.isEmpty)
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text('Belum ada ulasan. Jadilah yang pertama!',
                style: TextStyle(color: VanTheme.muted)),
          )
        else
          ...revs.take(10).map(_reviewTile),
      ],
    );
  }

  Widget _reviewTile(AppReview r) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          CircleAvatar(
            radius: 18,
            backgroundColor: VanTheme.surface2,
            child: Text(
              r.userName.isEmpty ? '?' : r.userName[0].toUpperCase(),
              style: const TextStyle(
                  color: VanTheme.lime, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(r.userName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700)),
                    ),
                    Text(Fmt.timeAgo(r.createdAt),
                        style: const TextStyle(
                            color: VanTheme.muted, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 2),
                Stars(r.rating, size: 13),
                const SizedBox(height: 4),
                Text(r.comment),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _writeReview(BuildContext context, StoreItem fresh) async {
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isAuthed) {
      final bool? ok = await showDialog<bool>(
        context: context,
        builder: (BuildContext ctx) => AlertDialog(
          title: const Text('Login dulu'),
          content: const Text(
              'Kamu harus masuk untuk menulis ulasan.'),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('BATAL'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('MASUK'),
            ),
          ],
        ),
      );
      if (ok != true || !context.mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const AuthScreen()),
      );
      if (!context.mounted) return;
      final AuthProvider auth2 =
          Provider.of<AuthProvider>(context, listen: false);
      if (!auth2.isAuthed) return;
    }
    if (!context.mounted) return;
    final bool? done = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ReviewSheet(item: fresh),
    );
    if (done == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ulasan terkirim. Terima kasih!')),
      );
    }
  }

  Widget _similar(BuildContext context, List<StoreItem> items) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: Text('Belum ada yang serupa.',
            style: TextStyle(color: VanTheme.muted)),
      );
    }
    return SizedBox(
      height: 168,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (BuildContext ctx, int i) => SizedBox(
          width: 128,
          child: StoreItemGridCard(
            item: items[i],
            onTap: () => _openDetail(ctx, items[i]),
          ),
        ),
      ),
    );
  }
}

/// Form tulis ulasan (bottom sheet).
class _ReviewSheet extends StatefulWidget {
  const _ReviewSheet({required this.item});
  final StoreItem item;

  @override
  State<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<_ReviewSheet> {
  double _rating = 5;
  final TextEditingController _ctrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_ctrl.text.trim().isEmpty) {
      setState(() => _error = 'Tulis dulu ulasanmu.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final CatalogProvider catalog =
        Provider.of<CatalogProvider>(context, listen: false);
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    try {
      await catalog.submitReview(
        item: widget.item,
        rating: _rating,
        comment: _ctrl.text.trim(),
        userName: auth.session?.displayName ?? 'Anonim',
        idToken: auth.session?.idToken,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Gagal mengirim: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const Text('Tulis Ulasan',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Center(
              child: StarInput(
                  value: _rating,
                  onChanged: (double v) => setState(() => _rating = v))),
          const SizedBox(height: 12),
          TextField(
            controller: _ctrl,
            maxLines: 3,
            maxLength: 500,
            decoration: const InputDecoration(
              hintText: 'Bagaimana pengalamanmu memakai aplikasi ini?',
            ),
          ),
          if (_error != null) ...<Widget>[
            const SizedBox(height: 6),
            Text(_error!,
                style:
                    const TextStyle(color: VanTheme.danger, fontSize: 12)),
          ],
          const SizedBox(height: 12),
          NeonButton(
            label: _busy ? 'Mengirim…' : 'Kirim Ulasan',
            icon: Icons.send_outlined,
            onPressed: _busy ? null : _submit,
          ),
        ],
      ),
    );
  }
}
