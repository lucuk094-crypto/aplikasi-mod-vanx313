import '../config/app_config.dart';
import 'app_review.dart';

/// Satu entitas katalog (apps / games / tools).
/// Skema field SAMA dengan website (name, icon, androidVersion, tags, ...).
class StoreItem {
  StoreItem({
    required this.id,
    required this.collection,
    required this.name,
    this.description = '',
    this.category = '',
    this.version = '',
    this.size = '',
    this.modType = '',
    this.developer = '',
    this.packageName = '',
    this.androidVersion = '',
    this.license = '',
    this.downloadUrl = '',
    this.icon = '',
    this.fileKind = 'apk',
    this.rating = 0,
    this.downloads = 0,
    List<String>? tags,
    List<String>? screenshots,
    List<AppReview>? reviews,
    this.createdAt,
    this.updatedAt,
  })  : tags = tags ?? const <String>[],
        screenshots = screenshots ?? const <String>[],
        reviews = reviews ?? const <AppReview>[];

  final String id;
  final String collection;
  final String name;
  final String description;
  final String category;
  final String version;
  final String size;
  final String modType;
  final String developer;
  final String packageName;
  final String androidVersion;
  final String license;
  final String downloadUrl;
  final String icon;
  final String fileKind;
  final double rating;
  final int downloads;
  final List<String> tags;
  final List<String> screenshots;
  final List<AppReview> reviews;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  /// Kunci unik lintas koleksi: `apps/abc123`.
  String get key => '$collection/$id';

  String get typeBadge =>
      AppConfig.collectionBadges[collection] ?? collection.toUpperCase();

  String get collectionLabel =>
      AppConfig.collectionLabels[collection] ?? collection;

  DateTime? get sortDate => updatedAt ?? createdAt;

  static List<String> _strList(dynamic v) {
    if (v is List) {
      return v.map((e) => '$e').where((e) => e.isNotEmpty).toList();
    }
    return const <String>[];
  }

  static DateTime? _date(dynamic v) {
    if (v is DateTime) return v;
    if (v is String) return DateTime.tryParse(v);
    return null;
  }

  factory StoreItem.fromMap(
    String collection,
    String id,
    Map<String, dynamic> m,
  ) {
    final List<AppReview> revs = <AppReview>[];
    final dynamic rawRevs = m['reviews'];
    if (rawRevs is List) {
      for (final r in rawRevs) {
        if (r is Map<String, dynamic>) {
          revs.add(AppReview.fromMap(r));
        }
      }
    }
    return StoreItem(
      id: id,
      collection: collection,
      name: '${m['name'] ?? 'Untitled'}',
      description: '${m['description'] ?? ''}',
      category: '${m['category'] ?? ''}',
      version: '${m['version'] ?? ''}',
      size: '${m['size'] ?? ''}',
      modType: '${m['modType'] ?? ''}',
      developer: '${m['developer'] ?? ''}',
      packageName: '${m['packageName'] ?? ''}',
      androidVersion: '${m['androidVersion'] ?? ''}',
      license: '${m['license'] ?? ''}',
      downloadUrl: '${m['downloadUrl'] ?? ''}',
      icon: '${m['icon'] ?? ''}',
      fileKind: '${m['fileKind'] ?? 'apk'}',
      rating: (m['rating'] as num?)?.toDouble() ?? 0,
      downloads: (m['downloads'] as num?)?.toInt() ?? 0,
      tags: _strList(m['tags']),
      screenshots: _strList(m['screenshots']),
      reviews: revs,
      createdAt: _date(m['createdAt']),
      updatedAt: _date(m['updatedAt']),
    );
  }

  /// Map untuk create/update via admin (tanpa id).
  Map<String, dynamic> toMap() => <String, dynamic>{
        'name': name,
        'description': description,
        'category': category,
        'version': version,
        'size': size,
        'modType': modType,
        'developer': developer,
        'packageName': packageName,
        'androidVersion': androidVersion,
        'license': license,
        'downloadUrl': downloadUrl,
        'icon': icon,
        'fileKind': fileKind,
        'rating': rating,
        'downloads': downloads,
        'tags': tags,
        'screenshots': screenshots,
        'reviews': reviews.map((r) => r.toMap()).toList(),
        // DateTime (bukan String) agar tersimpan sebagai timestamp Firestore.
        'createdAt': createdAt ?? DateTime.now(),
        'updatedAt': updatedAt ?? DateTime.now(),
      };

  StoreItem copyWith({
    String? name,
    String? description,
    String? category,
    String? version,
    String? size,
    String? modType,
    String? developer,
    String? packageName,
    String? androidVersion,
    String? license,
    String? downloadUrl,
    String? icon,
    String? fileKind,
    double? rating,
    int? downloads,
    List<String>? tags,
    List<String>? screenshots,
    List<AppReview>? reviews,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return StoreItem(
      id: id,
      collection: collection,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      version: version ?? this.version,
      size: size ?? this.size,
      modType: modType ?? this.modType,
      developer: developer ?? this.developer,
      packageName: packageName ?? this.packageName,
      androidVersion: androidVersion ?? this.androidVersion,
      license: license ?? this.license,
      downloadUrl: downloadUrl ?? this.downloadUrl,
      icon: icon ?? this.icon,
      fileKind: fileKind ?? this.fileKind,
      rating: rating ?? this.rating,
      downloads: downloads ?? this.downloads,
      tags: tags ?? this.tags,
      screenshots: screenshots ?? this.screenshots,
      reviews: reviews ?? this.reviews,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
