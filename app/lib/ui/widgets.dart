import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/store_item.dart';
import '../providers/auth_provider.dart';
import '../providers/library_provider.dart';
import '../services/download_manager.dart';
import '../utils/format.dart';
import 'theme.dart';

// ================= kartu brutalist =================

/// Kartu brutalist: garis tegas + bayangan keras + ripple sentuh.
class NeoCard extends StatelessWidget {
  const NeoCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(12),
    this.margin = EdgeInsets.zero,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: const BoxDecoration(
        color: VanTheme.surface,
        borderRadius: VanTheme.radius,
        border: Border.fromBorderSide(BorderSide(color: VanTheme.line)),
        boxShadow: VanTheme.hardShadow,
      ),
      child: Material(
        type: MaterialType.transparency,
        borderRadius: VanTheme.radius,
        child: InkWell(
          borderRadius: VanTheme.radius,
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

// ================= teks & header =================

/// Label kecil monospace (// LATEST DROPS).
class Kicker extends StatelessWidget {
  const Kicker(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(), style: VanTheme.kicker);
  }
}

/// Judul section + aksi opsional "Lihat Semua".
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 8, 10),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 5),
                Container(width: 40, height: 3, color: VanTheme.lime),
              ],
            ),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
        ],
      ),
    );
  }
}

// ================= ikon & gambar =================

/// Ikon aplikasi dari URL + skeleton + fallback "V".
class NetworkIcon extends StatelessWidget {
  const NetworkIcon(this.url, {super.key, this.size = 56, this.radius = 8});

  final String url;
  final double size;
  final double radius;

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return _fallback();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.network(
        url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        loadingBuilder:
            (BuildContext ctx, Widget child, ImageChunkEvent? progress) {
          if (progress == null) return child;
          return _PulseBox(width: size, height: size);
        },
        errorBuilder:
            (BuildContext ctx, Object err, StackTrace? stack) => _fallback(),
      ),
    );
  }

  Widget _fallback() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: VanTheme.surface2,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: VanTheme.line),
      ),
      alignment: Alignment.center,
      child: Text(
        'V',
        style: TextStyle(
          color: VanTheme.lime,
          fontWeight: FontWeight.w900,
          fontSize: size * 0.48,
        ),
      ),
    );
  }
}

// ================= kartu item =================

/// Baris item katalog (list).
class StoreItemCard extends StatelessWidget {
  const StoreItemCard({super.key, required this.item, this.onTap});

  final StoreItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return NeoCard(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      onTap: onTap,
      child: Row(
        children: <Widget>[
          NetworkIcon(item.icon, size: 58),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    _Badge(item.typeBadge, filled: true),
                    if (item.modType.isNotEmpty) ...<Widget>[
                      const SizedBox(width: 6),
                      _Badge(item.modType),
                    ],
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  item.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15),
                ),
                const SizedBox(height: 3),
                Text(
                  _meta(item),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style:
                      const TextStyle(color: VanTheme.muted, fontSize: 12),
                ),
                const SizedBox(height: 5),
                Row(
                  children: <Widget>[
                    const Icon(Icons.star, size: 13, color: VanTheme.lime),
                    const SizedBox(width: 3),
                    Text(
                      '${Fmt.rating(item.rating)}  •  ${Fmt.compact(item.downloads)} unduhan',
                      style: const TextStyle(
                          color: VanTheme.muted, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: VanTheme.muted),
        ],
      ),
    );
  }

  static String _meta(StoreItem item) {
    final List<String> parts = <String>[];
    if (item.category.isNotEmpty) parts.add(item.category);
    if (item.size.isNotEmpty) parts.add(item.size);
    if (item.version.isNotEmpty) parts.add('v${item.version}');
    return parts.join('  •  ');
  }
}

/// Kartu item grid.
class StoreItemGridCard extends StatelessWidget {
  const StoreItemGridCard({super.key, required this.item, this.onTap});

  final StoreItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return NeoCard(
      onTap: onTap,
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Center(child: NetworkIcon(item.icon, size: 62)),
          const SizedBox(height: 8),
          Text(
            item.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
          const Spacer(),
          Row(
            children: <Widget>[
              const Icon(Icons.star, size: 12, color: VanTheme.lime),
              const SizedBox(width: 2),
              Expanded(
                child: Text(
                  '${Fmt.rating(item.rating)} • ${Fmt.compact(item.downloads)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style:
                      const TextStyle(color: VanTheme.muted, fontSize: 11),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Baris chart dengan nomor peringkat besar.
class RankCard extends StatelessWidget {
  const RankCard(
      {super.key, required this.rank, required this.item, this.onTap});

  final int rank;
  final StoreItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 252,
      child: NeoCard(
        onTap: onTap,
        padding: const EdgeInsets.all(10),
        child: Row(
          children: <Widget>[
            SizedBox(
              width: 40,
              child: Text(
                '$rank',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Archivo Black',
                  fontSize: 28,
                  fontWeight: FontWeight.w400,
                  color: rank <= 3 ? VanTheme.lime : VanTheme.muted,
                ),
              ),
            ),
            NetworkIcon(item.icon, size: 50),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Text(
                    item.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${Fmt.rating(item.rating)} ★  •  ${Fmt.compact(item.downloads)}',
                    style: const TextStyle(
                        color: VanTheme.muted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge(this.text, {this.filled = false});
  final String text;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: filled ? VanTheme.lime : Colors.transparent,
        border: Border.all(color: VanTheme.lime, width: 1),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 1,
          color: filled ? VanTheme.onLime : VanTheme.lime,
        ),
      ),
    );
  }
}

// ================= tombol =================

/// Tombol brutalist full-width.
class NeonButton extends StatelessWidget {
  const NeonButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.outlined = false,
    this.small = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool outlined;
  final bool small;

  @override
  Widget build(BuildContext context) {
    final Widget? iconWidget =
        icon == null ? null : Icon(icon, size: small ? 16 : 20);
    final ButtonStyle style = (outlined
            ? OutlinedButton.styleFrom()
            : ElevatedButton.styleFrom())
        .copyWith(
      padding: WidgetStatePropertyAll<EdgeInsets>(EdgeInsets.symmetric(
          horizontal: small ? 14 : 20, vertical: small ? 9 : 14)),
      textStyle: WidgetStatePropertyAll<TextStyle>(
          TextStyle(fontWeight: FontWeight.w800, fontSize: small ? 12 : 14)),
    );
    final Widget child = iconWidget == null
        ? Text(label.toUpperCase())
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              iconWidget,
              const SizedBox(width: 8),
              Flexible(child: Text(label.toUpperCase())),
            ],
          );
    if (outlined) {
      return OutlinedButton(
          onPressed: onPressed, style: style, child: child);
    }
    return ElevatedButton(onPressed: onPressed, style: style, child: child);
  }
}

// ================= state kosong / error / loading =================

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle = '',
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(
                color: VanTheme.surface,
                borderRadius: VanTheme.radius,
                border:
                    Border.fromBorderSide(BorderSide(color: VanTheme.line)),
                boxShadow: VanTheme.hardShadow,
              ),
              child: Icon(icon, size: 36, color: VanTheme.lime),
            ),
            const SizedBox(height: 18),
            Text(title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 17)),
            if (subtitle.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              Text(subtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: VanTheme.muted, height: 1.5)),
            ],
            if (actionLabel != null && onAction != null) ...<Widget>[
              const SizedBox(height: 18),
              NeonButton(
                  label: actionLabel!, onPressed: onAction, small: true),
            ],
          ],
        ),
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.cloud_off_outlined,
      title: 'Gagal memuat',
      subtitle: message,
      actionLabel: onRetry == null ? null : 'Coba Lagi',
      onAction: onRetry,
    );
  }
}

class _PulseBox extends StatefulWidget {
  const _PulseBox({required this.width, required this.height});
  final double width;
  final double height;

  @override
  State<_PulseBox> createState() => _PulseBoxState();
}

class _PulseBoxState extends State<_PulseBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 800))
    ..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.35, end: 0.75).animate(_c),
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: VanTheme.surface2,
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}

/// Skeleton daftar kartu saat loading.
class SkeletonList extends StatelessWidget {
  const SkeletonList({super.key, this.count = 6});
  final int count;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: count,
      itemBuilder: (BuildContext ctx, int i) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        child: Row(
          children: const <Widget>[
            _PulseBox(width: 58, height: 58),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _PulseBox(width: double.infinity, height: 14),
                  SizedBox(height: 8),
                  _PulseBox(width: 160, height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ================= bintang =================

/// Baris bintang rating.
class Stars extends StatelessWidget {
  const Stars(this.rating, {super.key, this.size = 16});
  final double rating;
  final double size;

  @override
  Widget build(BuildContext context) {
    final List<Widget> icons = <Widget>[];
    for (int i = 1; i <= 5; i++) {
      IconData icon = Icons.star_border;
      if (rating >= i - 0.25) {
        icon = Icons.star;
      } else if (rating >= i - 0.75) {
        icon = Icons.star_half;
      }
      icons.add(Icon(icon, size: size, color: VanTheme.lime));
    }
    return Row(mainAxisSize: MainAxisSize.min, children: icons);
  }
}

/// Input bintang (tap untuk nilai).
class StarInput extends StatelessWidget {
  const StarInput({super.key, required this.value, required this.onChanged});
  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List<Widget>.generate(5, (int i) {
        final bool filled = value >= i + 1;
        return IconButton(
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
          onPressed: () => onChanged((i + 1).toDouble()),
          icon: Icon(
            filled ? Icons.star : Icons.star_border,
            size: 32,
            color: VanTheme.lime,
          ),
        );
      }),
    );
  }
}

// ================= aksi unduh & wishlist =================

/// Tombol wishlist (bookmark) — ikut state LibraryProvider.
class WishlistButton extends StatelessWidget {
  const WishlistButton(this.item, {super.key});
  final StoreItem item;

  @override
  Widget build(BuildContext context) {
    return Consumer<LibraryProvider>(
      builder: (BuildContext ctx, LibraryProvider lib, _) {
        final bool wished = lib.isWished(item.key);
        return IconButton(
          tooltip: wished ? 'Hapus dari wishlist' : 'Simpan ke wishlist',
          onPressed: () {
            unawaited(lib.toggleWish(item.key));
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(wished
                    ? 'Dihapus dari wishlist'
                    : 'Ditambahkan ke wishlist'),
                duration: const Duration(seconds: 1),
              ),
            );
          },
          icon: Icon(
            wished ? Icons.bookmark : Icons.bookmark_border,
            color: wished ? VanTheme.lime : VanTheme.muted,
          ),
        );
      },
    );
  }
}

/// Tombol unduh pintar: INSTALL -> progres -> BUKA/INSTALL.
class DownloadActionButton extends StatelessWidget {
  const DownloadActionButton(this.item, {super.key, this.compact = false});
  final StoreItem item;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Consumer<DownloadManager>(
      builder: (BuildContext ctx, DownloadManager dm, _) {
        final DownloadTask? task = dm.taskOf(item.key);
        if (task == null) {
          return _install(ctx, dm);
        }
        switch (task.status) {
          case TaskStatus.downloading:
            return _progress(ctx, dm, task);
          case TaskStatus.completed:
            return _open(ctx, dm, task);
          case TaskStatus.failed:
          case TaskStatus.canceled:
            return _retry(ctx, dm, task);
        }
      },
    );
  }

  Widget _install(BuildContext context, DownloadManager dm) {
    final bool direct = DownloadManager.isDirectUrl(item.downloadUrl);
    return NeonButton(
      label: direct ? 'Install' : 'Download',
      icon: Icons.download_outlined,
      small: compact,
      onPressed: () => _start(context, dm),
    );
  }

  Widget _progress(
      BuildContext context, DownloadManager dm, DownloadTask task) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
              value: task.progress < 0 ? null : task.progress),
        ),
        const SizedBox(height: 8),
        Row(
          children: <Widget>[
            Expanded(
              child: Text(
                task.total > 0
                    ? '${(task.progress * 100).toStringAsFixed(0)}% • ${Fmt.compact(task.received)} / ${Fmt.compact(task.total)}'
                    : 'Mengunduh… ${Fmt.compact(task.received)}',
                style:
                    const TextStyle(color: VanTheme.muted, fontSize: 12),
              ),
            ),
            TextButton(
              onPressed: () => dm.cancel(task.key),
              child: const Text('BATAL'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _open(BuildContext context, DownloadManager dm, DownloadTask task) {
    return Row(
      children: <Widget>[
        Expanded(
          child: NeonButton(
            label: task.viaBrowser
                ? 'Unduh Lagi'
                : (item.fileKind == 'apk' ? 'Install' : 'Buka File'),
            icon: task.viaBrowser ? Icons.download_outlined : Icons.open_in_new,
            small: compact,
            onPressed: () async {
              if (task.viaBrowser) {
                _start(context, dm);
                return;
              }
              final String msg = await dm.openInstall(task);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text(msg)));
            },
          ),
        ),
        if (!task.viaBrowser) ...<Widget>[
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'Lihat lokasi file',
            onPressed: () async {
              final String msg = await dm.revealInFolder(task.filePath);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text(msg)));
            },
            icon: const Icon(Icons.folder_open_outlined),
          ),
        ],
      ],
    );
  }

  Widget _retry(BuildContext context, DownloadManager dm, DownloadTask task) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        if (task.error.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(task.error,
                style:
                    const TextStyle(color: VanTheme.danger, fontSize: 12)),
          ),
        NeonButton(
          label: 'Coba Lagi',
          icon: Icons.refresh,
          small: compact,
          outlined: true,
          onPressed: () => _start(context, dm),
        ),
      ],
    );
  }

  Future<void> _start(BuildContext context, DownloadManager dm) async {
    final LibraryProvider library =
        Provider.of<LibraryProvider>(context, listen: false);
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    final String? token = auth.session?.idToken;
    await dm.start(item, library: library, idToken: token);
  }
}

// ================= baris info =================

/// Baris label-nilai untuk tabel informasi detail.
class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 120,
            child:
                Text(label, style: const TextStyle(color: VanTheme.muted)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
