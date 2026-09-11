/// Satu ulasan di dalam field `reviews` dokumen katalog.
class AppReview {
  AppReview({
    required this.id,
    required this.userName,
    required this.rating,
    required this.comment,
    this.createdAt,
  });

  final String id;
  final String userName;
  final double rating;
  final String comment;
  final DateTime? createdAt;

  factory AppReview.fromMap(Map<String, dynamic> m) => AppReview(
        id: '${m['id'] ?? ''}',
        userName: '${m['userName'] ?? 'Anonim'}',
        rating: (m['rating'] as num?)?.toDouble() ?? 0,
        comment: '${m['comment'] ?? ''}',
        createdAt: m['createdAt'] is DateTime ? m['createdAt'] as DateTime : null,
      );

  Map<String, dynamic> toMap() => <String, dynamic>{
        'id': id,
        'userName': userName,
        'rating': rating,
        'comment': comment,
        // DateTime (bukan String) agar tersimpan sebagai timestamp Firestore.
        'createdAt': createdAt ?? DateTime.now(),
      };
}
