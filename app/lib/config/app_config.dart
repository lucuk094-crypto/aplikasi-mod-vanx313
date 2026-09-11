/// VAN MOD Store - konfigurasi global.
///
/// Backend memakai Firebase project yang SAMA dengan website (vanmod-website),
/// diakses lewat REST API supaya identik di Android & Windows tanpa plugin native.
class AppConfig {
  static const String storeName = 'VAN MOD';
  static const String storeTagline = 'MOD ECOSYSTEM // PLAY BEYOND LIMITS';
  static const String appVersion = '1.0.0';

  // ---- Firebase (sama seperti config/firebaseConfig.js di website) ----
  static const String firebaseApiKey = 'AIzaSyB1ccnYtBwYYELE_JYr3AlSVzYf3KRxPU0';
  static const String firebaseProjectId = 'vanmod-website';
  static const String firestoreBase =
      'https://firestore.googleapis.com/v1/projects/$firebaseProjectId/databases/(default)/documents';
  static const String authBase = 'https://identitytoolkit.googleapis.com/v1';
  static const String secureTokenUrl = 'https://securetoken.googleapis.com/v1/token';

  // ---- Koleksi katalog ----
  static const List<String> collections = ['apps', 'games', 'tools'];

  static const Map<String, String> collectionLabels = {
    'apps': 'Aplikasi',
    'games': 'Game',
    'tools': 'Tools',
  };

  static const Map<String, String> collectionBadges = {
    'apps': 'APP',
    'games': 'GAME',
    'tools': 'TOOL',
  };

  // ---- Admin ----
  // PENTING: ganti dengan email admin kamu. Hanya email di daftar ini yang bisa
  // membuka Admin Panel di aplikasi. Untuk keamanan penuh, batasi juga di
  // firestore.rules (lihat app/README.md bagian "Keamanan Admin").
  static const List<String> adminEmails = [
    'admin@vanmod.store',
    'vanxmod313@gmail.com',
  ];

  // ---- Download ----
  // Host yang TIDAK bisa diunduh langsung (halaman interstitial) -> dibuka di browser.
  static const List<String> indirectHosts = [
    'mediafire.com',
    'drive.google.com',
    'docs.google.com',
    'mega.nz',
    'mega.io',
    'terabox.com',
    '4shared.com',
    'zippyshare.com',
  ];

  static const List<String> directExtensions = [
    '.apk',
    '.xapk',
    '.apks',
    '.exe',
    '.msi',
    '.zip',
    '.rar',
    '.7z',
  ];

  // ---- Paging & cache ----
  static const int maxDocsPerCollection = 200;
  static const int pageRevealStep = 12;
  static const int historyCap = 50;
  static const int searchHistoryCap = 10;
}
