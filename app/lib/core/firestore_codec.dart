/// Codec untuk Firestore REST API.
///
/// REST API memakai "typed values", mis. `{"stringValue": "halo"}`.
/// Codec ini mengubah Map Dart biasa <-> format tersebut.
class FirestoreCodec {
  /// Decode satu dokumen REST {name, fields, ...} menjadi Map datar + `__id`.
  static Map<String, dynamic> decodeDoc(Map<String, dynamic> json) {
    final String name = (json['name'] as String?) ?? '';
    final Map<String, dynamic> out = <String, dynamic>{'__id': docIdFromName(name)};
    final Map<String, dynamic>? fields = json['fields'] as Map<String, dynamic>?;
    if (fields != null) {
      for (final entry in fields.entries) {
        out[entry.key] = decodeValue(entry.value);
      }
    }
    return out;
  }

  /// Ambil document ID dari resource name
  /// `projects/.../documents/apps/abc123` -> `abc123`.
  static String docIdFromName(String name) {
    final int i = name.lastIndexOf('/');
    return i < 0 ? name : name.substring(i + 1);
  }

  /// Decode satu typed value menjadi nilai Dart.
  static dynamic decodeValue(dynamic v) {
    if (v is! Map<String, dynamic>) return v;
    if (v.containsKey('stringValue')) return v['stringValue'] as String? ?? '';
    if (v.containsKey('integerValue')) {
      return int.tryParse('${v['integerValue']}') ?? 0;
    }
    if (v.containsKey('doubleValue')) {
      final d = v['doubleValue'];
      if (d is num) return d.toDouble();
      return double.tryParse('$d') ?? 0.0;
    }
    if (v.containsKey('booleanValue')) return v['booleanValue'] == true;
    if (v.containsKey('timestampValue')) {
      return DateTime.tryParse('${v['timestampValue']}');
    }
    if (v.containsKey('nullValue')) return null;
    if (v.containsKey('arrayValue')) {
      final List<dynamic>? items = (v['arrayValue'] as Map<String, dynamic>?)?['values'] as List<dynamic>?;
      return items == null ? <dynamic>[] : items.map(decodeValue).toList();
    }
    if (v.containsKey('mapValue')) {
      final Map<String, dynamic>? fields =
          (v['mapValue'] as Map<String, dynamic>?)?['fields'] as Map<String, dynamic>?;
      final Map<String, dynamic> out = <String, dynamic>{};
      if (fields != null) {
        for (final entry in fields.entries) {
          out[entry.key] = decodeValue(entry.value);
        }
      }
      return out;
    }
    if (v.containsKey('bytesValue')) return v['bytesValue'];
    if (v.containsKey('referenceValue')) return v['referenceValue'];
    if (v.containsKey('geoPointValue')) return v['geoPointValue'];
    return null;
  }

  /// Encode nilai Dart menjadi typed value Firestore.
  static Map<String, dynamic> encodeValue(dynamic v) {
    if (v == null) return <String, dynamic>{'nullValue': null};
    if (v is bool) return <String, dynamic>{'booleanValue': v};
    if (v is int) return <String, dynamic>{'integerValue': '$v'};
    if (v is double) return <String, dynamic>{'doubleValue': v};
    if (v is num) return <String, dynamic>{'doubleValue': v.toDouble()};
    if (v is String) return <String, dynamic>{'stringValue': v};
    if (v is DateTime) {
      return <String, dynamic>{'timestampValue': v.toUtc().toIso8601String()};
    }
    if (v is List) {
      return <String, dynamic>{
        'arrayValue': {
          'values': v.map(encodeValue).toList(),
        },
      };
    }
    if (v is Map) {
      final Map<String, dynamic> fields = <String, dynamic>{};
      for (final entry in v.entries) {
        fields['${entry.key}'] = encodeValue(entry.value);
      }
      return <String, dynamic>{
        'mapValue': {'fields': fields},
      };
    }
    return <String, dynamic>{'stringValue': '$v'};
  }

  /// Encode Map Dart menjadi body `{fields: {...}}` untuk create/update.
  static Map<String, dynamic> encodeFields(Map<String, dynamic> map) {
    final Map<String, dynamic> fields = <String, dynamic>{};
    for (final entry in map.entries) {
      if (entry.key == '__id') continue;
      fields[entry.key] = encodeValue(entry.value);
    }
    return <String, dynamic>{'fields': fields};
  }
}
