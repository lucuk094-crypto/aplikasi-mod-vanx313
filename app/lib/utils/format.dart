/// Format angka & tanggal Bahasa Indonesia ala Play Store.
class Fmt {
  /// 999 -> "999", 12.300 -> "12,3 rb", 1.200.000 -> "1,2 jt".
  static String compact(int n) {
    if (n < 1000) return '$n';
    if (n < 1000000) {
      final double v = n / 1000;
      return '${_one(v)} rb';
    }
    final double v = n / 1000000;
    return '${_one(v)} jt';
  }

  static String _one(double v) {
    if (v >= 100) return v.round().toString();
    final String s = v.toStringAsFixed(1).replaceAll('.', ',');
    return s.endsWith(',0') ? s.substring(0, s.length - 2) : s;
  }

  /// "5 mnt lalu", "3 jam lalu", "2 hari lalu", ...
  static String timeAgo(DateTime? dt) {
    if (dt == null) return '-';
    final Duration d = DateTime.now().difference(dt.toLocal());
    if (d.isNegative) return 'baru saja';
    if (d.inSeconds < 60) return 'baru saja';
    if (d.inMinutes < 60) return '${d.inMinutes} mnt lalu';
    if (d.inHours < 24) return '${d.inHours} jam lalu';
    if (d.inDays < 7) return '${d.inDays} hari lalu';
    if (d.inDays < 30) return '${d.inDays ~/ 7} mgg lalu';
    if (d.inDays < 365) return '${d.inDays ~/ 30} bln lalu';
    return '${d.inDays ~/ 365} thn lalu';
  }

  static const List<String> _bulan = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  /// "12 Sep 2026".
  static String date(DateTime? dt) {
    if (dt == null) return '-';
    final DateTime l = dt.toLocal();
    return '${l.day} ${_bulan[l.month]} ${l.year}';
  }

  /// Rating "4,8" (koma Indonesia).
  static String rating(double r) {
    if (r <= 0) return '-';
    return r.toStringAsFixed(1).replaceAll('.', ',');
  }
}
