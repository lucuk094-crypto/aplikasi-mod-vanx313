# 📱 VAN MOD Store — Aplikasi Android & Windows (Flutter)

Toko aplikasi mod ala Play Store: **satu codebase Flutter** menjadi dua aplikasi
native — **Android (APK)** dan **Windows (EXE installer/portable)**.

Backend memakai Firebase project yang **sama dengan website** (`vanmod-website`)
lewat **REST API murni** (tanpa plugin Firebase) — jadi perilakunya identik di
Android & Windows, dan data katalog website langsung tampil di aplikasi.

## ✨ Fitur (v1)

| Area | Fitur |
|------|-------|
| 🏠 Beranda | Featured carousel auto-play, Top Charts, tile kategori, Baru Rilis |
| 🗂️ Katalog | Tab Game & Aplikasi (+ Tools), filter kategori, sortir (populer/terbaru/rating), grid/list, load-more |
| 🔍 Cari | Lintas koleksi (nama/deskripsi/tag/developer) + riwayat pencarian |
| 📄 Detail | Screenshot gallery + fullscreen, rating & ulasan, tabel info, tag, rekomendasi serupa, wishlist, salin link |
| ⬇️ Unduh | **Download manager dalam aplikasi** (progres, batal, buka/install) untuk link langsung; link MediaFire/GDrive/dll dibuka di browser |
| 📚 Pustaka | Tab Unduhan, **Update otomatis** (versi katalog vs versi terunduh), Wishlist (geser untuk hapus), Riwayat |
| 👤 Akun | Daftar/masuk email, reset password, ubah nama, tulis ulasan (login) |
| 🛠️ Admin | Statistik global, tambah/ubah/hapus item (termasuk tempel link eksternal) — khusus email admin |

## 🗂️ Struktur Kode

```
app/
├── lib/
│   ├── main.dart                  # bootstrap + bottom-nav shell
│   ├── config/app_config.dart     # Firebase keys, adminEmails, konstanta
│   ├── core/
│   │   ├── firestore_codec.dart   # encode/decode typed-value Firestore REST
│   │   ├── firestore_service.dart # list/query/get/create/update/delete/increment
│   │   └── auth_service.dart      # signup/signin/reset/refresh (REST)
│   ├── models/                    # store_item.dart, app_review.dart (skema = website)
│   ├── providers/                 # auth, catalog, library (wishlist/riwayat/update)
│   ├── services/download_manager.dart
│   ├── utils/format.dart          # angka rb/jt, timeAgo Indonesia
│   └── ui/                        # theme.dart, widgets.dart, screens/
├── android/                       # runner Android (template Flutter stable)
├── windows/                       # runner Windows (template Flutter stable)
└── pubspec.yaml
```

## 🚀 Menjalankan di PC Sendiri

```bash
# 1. Install Flutter SDK (stable): https://docs.flutter.dev/get-started/install
# 2. Cek dokter:
flutter doctor

# 3. Dari folder repo:
cd app
flutter pub get

# 4a. Jalankan di Windows:
flutter run -d windows

# 4b. Jalankan di Android (HP colok USB / emulator):
flutter run

# 5. Build manual:
flutter build apk --release        # -> build/app/outputs/flutter-apk/app-release.apk
flutter build windows --release    # -> build/windows/x64/runner/Release/
```

## 🤖 Build Otomatis (GitHub Actions)

Setiap push yang menyentuh `app/` memicu workflow **VAN MOD App CI**
(`.github/workflows/app-ci.yml`):

1. **Analyze** — `flutter analyze` (wajib lolos)
2. **Build Android APK** — artefak `vanmod-android-apk`
3. **Build Windows EXE** — artefak `vanmod-windows` (ZIP siap bagi)

Unduh hasilnya di tab **Actions** → pilih run → **Artifacts**.

## 🔑 Setup Admin

1. Buka `lib/config/app_config.dart`, isi `adminEmails` dengan email kamu:
   ```dart
   static const List<String> adminEmails = ['kamu@email.com'];
   ```
2. Daftar/masuk di aplikasi memakai email itu → menu **Admin Panel** muncul di Profil.

### Keamanan Admin (disarankan)

Rules bawaan mengizinkan **semua user login** menulis katalog (warisan website).
Setelah admin email aktif, batasi tulis ke admin saja. Cara termudah: custom claim
via Firebase Console tidak bisa — pakai skrip sekali jalan, atau sederhanakan
dengan aturan email:

```
function isAdmin() {
  return request.auth != null &&
    request.auth.token.email in ['kamu@email.com'];
}
```

Lalu ganti `isAdmin()` di `firestore.rules` dan publish ulang.

## ✍️ Release Signing Android (opsional, untuk rilis resmi)

APK dari CI saat ini ditandatangani **debug key** (bisa di-sideload, tapi tidak
bisa update-timpa APK dengan key berbeda nantinya). Untuk rilis resmi:

```bash
keytool -genkey -v -keystore vanmod-release.jks -alias vanmod \
  -keyalg RSA -keysize 2048 -validity 10000
```

Lalu di `android/app/build.gradle.kts` tambah signingConfig release + simpan
keystore sebagai GitHub Secret (lihat panduan Flutter: *Sign your app*).

## 🗺️ Roadmap v2

- Notifikasi push update (FCM) • Google Sign-In (Android) • Pause/resume unduhan
- Cache gambar offline • Mode terang • Bahasa Inggris • Statistik developer
- Auto-update aplikasi Windows (cek versi + unduh installer baru)

## ⚠️ Catatan

- Toko aplikasi mod **tidak boleh tayang di Google Play** — distribusikan APK
  dari website kamu sendiri (sideload), seperti APKPure/Aptoide/HappyMod.
- Unduhan dalam aplikasi hanya untuk **link file langsung** (.apk/.exe/.zip…).
  Link halaman (MediaFire, Google Drive, Mega, …) otomatis dibuka di browser.
