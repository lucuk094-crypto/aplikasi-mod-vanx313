import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../core/firestore_service.dart';
import '../../models/store_item.dart';
import '../../providers/auth_provider.dart';
import '../../providers/catalog_provider.dart';
import '../widgets.dart';

/// Form tambah / ubah item katalog (admin).
class AdminEditorScreen extends StatefulWidget {
  const AdminEditorScreen({super.key, required this.collection, this.item});

  final String collection;
  final StoreItem? item;

  bool get isEdit => item != null;

  @override
  State<AdminEditorScreen> createState() => _AdminEditorScreenState();
}

class _AdminEditorScreenState extends State<AdminEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _collection = widget.collection;
  late String _fileKind = widget.item?.fileKind ?? 'apk';

  late final TextEditingController _name =
      TextEditingController(text: widget.item?.name ?? '');
  late final TextEditingController _description =
      TextEditingController(text: widget.item?.description ?? '');
  late final TextEditingController _category =
      TextEditingController(text: widget.item?.category ?? '');
  late final TextEditingController _version =
      TextEditingController(text: widget.item?.version ?? '');
  late final TextEditingController _size =
      TextEditingController(text: widget.item?.size ?? '');
  late final TextEditingController _modType =
      TextEditingController(text: widget.item?.modType ?? 'MOD');
  late final TextEditingController _developer =
      TextEditingController(text: widget.item?.developer ?? '');
  late final TextEditingController _package =
      TextEditingController(text: widget.item?.packageName ?? '');
  late final TextEditingController _android =
      TextEditingController(text: widget.item?.androidVersion ?? '');
  late final TextEditingController _license =
      TextEditingController(text: widget.item?.license ?? 'Freeware');
  late final TextEditingController _downloadUrl =
      TextEditingController(text: widget.item?.downloadUrl ?? '');
  late final TextEditingController _icon =
      TextEditingController(text: widget.item?.icon ?? '');
  late final TextEditingController _screenshots = TextEditingController(
      text: (widget.item?.screenshots ?? <String>[]).join('\n'));
  late final TextEditingController _tags = TextEditingController(
      text: (widget.item?.tags ?? <String>[]).join(', '));

  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _category.dispose();
    _version.dispose();
    _size.dispose();
    _modType.dispose();
    _developer.dispose();
    _package.dispose();
    _android.dispose();
    _license.dispose();
    _downloadUrl.dispose();
    _icon.dispose();
    _screenshots.dispose();
    _tags.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    final FirestoreService db =
        Provider.of<FirestoreService>(context, listen: false);
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    final CatalogProvider catalog =
        Provider.of<CatalogProvider>(context, listen: false);
    final String? token = await auth.freshToken();
    if (!mounted) return;
    if (token == null) {
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sesi habis. Masuk ulang.')),
      );
      return;
    }
    final List<String> shots = _screenshots.text
        .split(RegExp(r'[\r\n]+'))
        .map((String s) => s.trim())
        .where((String s) => s.isNotEmpty)
        .toList();
    final List<String> tags = _tags.text
        .split(',')
        .map((String s) => s.trim())
        .where((String s) => s.isNotEmpty)
        .toList();
    try {
      if (widget.isEdit) {
        final StoreItem updated = widget.item!.copyWith(
          name: _name.text.trim(),
          description: _description.text.trim(),
          category: _category.text.trim(),
          version: _version.text.trim(),
          size: _size.text.trim(),
          modType: _modType.text.trim(),
          developer: _developer.text.trim(),
          packageName: _package.text.trim(),
          androidVersion: _android.text.trim(),
          license: _license.text.trim(),
          downloadUrl: _downloadUrl.text.trim(),
          icon: _icon.text.trim(),
          fileKind: _fileKind,
          tags: tags,
          screenshots: shots,
          updatedAt: DateTime.now(),
        );
        await db.updateDoc(widget.item!.collection, widget.item!.id,
            updated.toMap(),
            idToken: token);
      } else {
        final StoreItem created = StoreItem(
          id: '',
          collection: _collection,
          name: _name.text.trim(),
          description: _description.text.trim(),
          category: _category.text.trim(),
          version: _version.text.trim(),
          size: _size.text.trim(),
          modType: _modType.text.trim(),
          developer: _developer.text.trim(),
          packageName: _package.text.trim(),
          androidVersion: _android.text.trim(),
          license: _license.text.trim(),
          downloadUrl: _downloadUrl.text.trim(),
          icon: _icon.text.trim(),
          fileKind: _fileKind,
          tags: tags,
          screenshots: shots,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await db.createDoc(_collection, created.toMap(), idToken: token);
      }
      await catalog.refresh();
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal menyimpan: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text(widget.isEdit ? 'Ubah Item' : 'Tambah Item')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            const Kicker('// KOLEKSI & FILE'),
            const SizedBox(height: 10),
            Row(
              children: <Widget>[
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _collection,
                    decoration: const InputDecoration(
                        labelText: 'Koleksi'),
                    items: AppConfig.collections
                        .map((String c) => DropdownMenuItem<String>(
                              value: c,
                              child: Text(
                                  AppConfig.collectionLabels[c] ?? c),
                            ))
                        .toList(),
                    onChanged: widget.isEdit
                        ? null
                        : (String? v) {
                            if (v != null) {
                              setState(() => _collection = v);
                            }
                          },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _fileKind,
                    decoration: const InputDecoration(
                        labelText: 'Jenis file'),
                    items: const <DropdownMenuItem<String>>[
                      DropdownMenuItem(
                          value: 'apk', child: Text('APK (Android)')),
                      DropdownMenuItem(
                          value: 'xapk', child: Text('XAPK')),
                      DropdownMenuItem(
                          value: 'exe', child: Text('EXE (Windows)')),
                      DropdownMenuItem(
                          value: 'zip', child: Text('ZIP')),
                      DropdownMenuItem(
                          value: 'other', child: Text('Lainnya')),
                    ],
                    onChanged: (String? v) {
                      if (v != null) {
                        setState(() => _fileKind = v);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Kicker('// INFORMASI UTAMA'),
            const SizedBox(height: 10),
            _field(_name, 'Nama aplikasi *',
                validator: (String? v) =>
                    v == null || v.trim().isEmpty ? 'Wajib diisi' : null),
            _field(_description, 'Deskripsi', maxLines: 4),
            Row(
              children: <Widget>[
                Expanded(child: _field(_category, 'Kategori')),
                const SizedBox(width: 10),
                Expanded(child: _field(_modType, 'Tipe MOD')),
              ],
            ),
            Row(
              children: <Widget>[
                Expanded(child: _field(_version, 'Versi')),
                const SizedBox(width: 10),
                Expanded(child: _field(_size, 'Ukuran (mis. 124MB)')),
              ],
            ),
            const SizedBox(height: 16),
            const Kicker('// LINK & MEDIA'),
            const SizedBox(height: 10),
            _field(_downloadUrl, 'Link download (MediaFire/GDrive/dll) *',
                keyboard: TextInputType.url,
                validator: (String? v) =>
                    v == null || v.trim().isEmpty ? 'Wajib diisi' : null),
            _field(_icon, 'URL ikon', keyboard: TextInputType.url),
            _field(_screenshots, 'URL screenshot (satu per baris)',
                maxLines: 3, keyboard: TextInputType.multiline),
            _field(_tags, 'Tag (pisahkan koma: premium, no-ads)'),
            const SizedBox(height: 16),
            const Kicker('// DETAIL TEKNIS'),
            const SizedBox(height: 10),
            _field(_developer, 'Developer'),
            _field(_package, 'Package name (com.contoh.app)'),
            Row(
              children: <Widget>[
                Expanded(child: _field(_android, 'Min. Android (5.0+)')),
                const SizedBox(width: 10),
                Expanded(child: _field(_license, 'Lisensi')),
              ],
            ),
            const SizedBox(height: 20),
            NeonButton(
              label: _busy
                  ? 'Menyimpan…'
                  : (widget.isEdit ? 'Simpan Perubahan' : 'Tambah Item'),
              icon: Icons.save_outlined,
              onPressed: _busy ? null : _save,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String label, {
    int maxLines = 1,
    TextInputType keyboard = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboard,
        validator: validator,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}
