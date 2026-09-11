import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../providers/auth_provider.dart';
import '../../providers/library_provider.dart';
import '../theme.dart';
import '../widgets.dart';
import 'admin_screen.dart';
import 'auth_screen.dart';
import 'library_screen.dart';

/// Profil & pengaturan akun.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Akun')),
      body: Consumer2<AuthProvider, LibraryProvider>(
        builder: (BuildContext ctx, AuthProvider auth, LibraryProvider lib,
            _) {
          if (!auth.isAuthed) {
            return EmptyState(
              icon: Icons.account_circle_outlined,
              title: 'Belum masuk',
              subtitle:
                  'Masuk untuk menulis ulasan, wishlist, dan sinkronisasi.',
              actionLabel: 'Masuk / Daftar',
              onAction: () => Navigator.of(ctx).push(
                MaterialPageRoute<void>(
                    builder: (_) => const AuthScreen()),
              ),
            );
          }
          final String name = auth.session?.displayName ?? 'Operator';
          final String email = auth.session?.email ?? '';
          return ListView(
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: <Widget>[
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: VanTheme.lime,
                          child: Text(
                            name.isEmpty ? '?' : name[0].toUpperCase(),
                            style: const TextStyle(
                                color: Colors.black,
                                fontSize: 24,
                                fontWeight: FontWeight.w900),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(name,
                                  style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800)),
                              Text(email,
                                  style: const TextStyle(
                                      color: VanTheme.muted)),
                              if (auth.isAdmin) ...<Widget>[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: VanTheme.lime,
                                    borderRadius:
                                        BorderRadius.circular(2),
                                  ),
                                  child: const Text('ADMIN',
                                      style: TextStyle(
                                          color: Colors.black,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 1.5)),
                                ),
                              ],
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Ubah nama',
                          onPressed: () => _editName(ctx, auth, name),
                          icon: const Icon(Icons.edit_outlined,
                              color: VanTheme.muted),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              _menuTile(
                ctx,
                icon: Icons.folder_outlined,
                title: 'Pustaka Saya',
                subtitle:
                    '${lib.wishlistCount} wishlist • ${lib.history.length} riwayat',
                onTap: () => Navigator.of(ctx).push(
                  MaterialPageRoute<void>(
                      builder: (_) => const LibraryScreen()),
                ),
              ),
              if (auth.isAdmin)
                _menuTile(
                  ctx,
                  icon: Icons.admin_panel_settings_outlined,
                  title: 'Admin Panel',
                  subtitle: 'Kelola katalog & statistik',
                  highlight: true,
                  onTap: () => Navigator.of(ctx).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const AdminScreen()),
                  ),
                ),
              _menuTile(
                ctx,
                icon: Icons.info_outline,
                title: 'Tentang',
                subtitle: 'VAN MOD Store v${AppConfig.appVersion}',
                onTap: () => _about(ctx),
              ),
              _menuTile(
                ctx,
                icon: Icons.logout,
                title: 'Keluar',
                subtitle: 'Akhiri sesi di perangkat ini',
                danger: true,
                onTap: () => _confirmLogout(ctx, auth),
              ),
              const SizedBox(height: 24),
            ],
          );
        },
      ),
    );
  }

  Widget _menuTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool highlight = false,
    bool danger = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Card(
        child: ListTile(
          leading: Icon(icon,
              color: danger
                  ? VanTheme.danger
                  : highlight
                      ? VanTheme.lime
                      : VanTheme.muted),
          title: Text(title,
              style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: danger ? VanTheme.danger : VanTheme.text)),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right,
              color: VanTheme.muted, size: 20),
          onTap: onTap,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  Future<void> _editName(
      BuildContext context, AuthProvider auth, String current) async {
    final TextEditingController ctrl =
        TextEditingController(text: current);
    final bool? save = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Ubah Nama'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration:
              const InputDecoration(labelText: 'Nama tampilan'),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('BATAL'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('SIMPAN'),
          ),
        ],
      ),
    );
    final String name = ctrl.text.trim();
    ctrl.dispose();
    if (save != true) return;
    if (!context.mounted) return;
    final bool ok = await auth.updateName(name);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(ok
              ? 'Nama diperbarui.'
              : (auth.error ?? 'Gagal memperbarui nama.'))),
    );
  }

  void _about(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('VAN//MOD Store'),
        content: Text(
          'v${AppConfig.appVersion}\n\n'
          '${AppConfig.storeTagline}\n\n'
          'Backend: Firebase (${AppConfig.firebaseProjectId})\n'
          'Platform: Android & Windows\n\n'
          'Unduh & install mod favoritmu langsung dari aplikasi.',
        ),
        actions: <Widget>[
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('TUTUP'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, AuthProvider auth) async {
    final bool? ok = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Keluar?'),
        content: const Text('Kamu harus masuk lagi untuk ulasan & admin.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('BATAL'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('KELUAR'),
          ),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await auth.signOut();
      if (!context.mounted) return;
      Navigator.of(context).pop();
    }
  }
}
