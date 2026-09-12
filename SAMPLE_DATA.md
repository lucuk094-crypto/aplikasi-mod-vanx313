# 📊 Sample Data untuk Firestore

## ⚡ Cara Termudah: Seed Script (Recommended)

Jangan input manual — pakai script seed yang sudah disediakan. Script ini memakai
skema field yang **benar** (sesuai kode website) dan otomatis mengisi `stats/global`.

```bash
# 1. Install dependencies (sekali saja)
npm install

# 2. Jalankan seed dengan akun admin Firebase kamu
node scripts/seed.mjs --email admin@kamu.com --password rahasia123

# Alternatif via environment variable:
SEED_EMAIL=admin@kamu.com SEED_PASSWORD=rahasia123 npm run seed
```

Script akan mengisi:

| Collection | Jumlah | Contoh |
|------------|--------|--------|
| `apps` | 6 | Spotify Premium Plus, InstaMod Pro, CapCut Pro Mod, ... |
| `games` | 4 | PUBG Mobile MOD, Minecraft PE Premium, ... |
| `tools` | 4 | Lucky Patcher Pro, APK Editor Pro, ... |
| `stats/global` | 1 | Total apps/games/tools/downloads/reviews |

> Script otomatis **berhenti** kalau koleksi sudah ada isinya (biar tidak dobel).
> Tambahkan `--force` untuk tetap menambah data baru.

---

## ✍️ Cara Manual: via Firebase Console

Kalau ingin input manual, buka:

```
https://console.firebase.google.com/project/vanmod-website/firestore
```

1. Klik **"Start collection"** → Collection ID: `apps` (atau `games` / `tools`)
2. Klik **"Add document"** → **Auto-ID** → isi field sesuai skema di bawah
3. Ulangi untuk dokumen lain

### ⚠️ PENTING: Nama field harus persis seperti ini

Website membaca field `name`, `icon`, `androidVersion`, `tags` (BUKAN `title`,
`imageUrl`, `minAndroid`, atau `modFeatures`). Dokumen dengan nama field yang
salah akan tampil sebagai "Untitled" / kosong.

---

## 📱 Contoh Dokumen Lengkap (Collection `apps`)

```json
{
  "name": "Spotify Premium Plus",
  "description": "Listen to unlimited music with no ads, offline mode, and premium features unlocked.",
  "category": "Music",
  "version": "8.8.8",
  "size": "124MB",
  "rating": 4.9,
  "downloads": 45230,
  "modType": "MOD",
  "tags": ["premium", "no-ads", "offline"],
  "icon": "https://i.ibb.co/xxxxx/spotify.png",
  "screenshots": [
    "https://i.ibb.co/xxxxx/shot1.png",
    "https://i.ibb.co/xxxxx/shot2.png"
  ],
  "downloadUrl": "https://example.com/downloads/spotify-premium-plus.apk",
  "developer": "Spotify AB (Mod)",
  "packageName": "com.spotify.music",
  "androidVersion": "5.0+",
  "license": "Freeware",
  "reviews": [
    {
      "id": "r-sp-1",
      "userName": "Andini",
      "rating": 5,
      "comment": "Works flawlessly, no ads at all!",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

Struktur yang **sama persis** berlaku untuk collection `games` dan `tools`.

## 📋 Penjelasan Field

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | ✅ | Nama aplikasi/game/tool |
| `description` | string | — | Deskripsi lengkap (100–200 karakter) |
| `category` | string | — | Kategori (Social, Action, Utility, ...) |
| `version` | string | — | Nomor versi |
| `size` | string | — | Ukuran file (MB/GB) |
| `rating` | number | — | Rating 1–5 (desimal, dihitung dari reviews) |
| `downloads` | number | — | Total download (otomatis bertambah) |
| `modType` | string | — | "MOD", "PRO", "LITE", "PREMIUM" |
| `tags` | array | — | Daftar tag, mis. `["premium", "no-ads"]` |
| `icon` | string | — | URL ikon aplikasi |
| `screenshots` | array | — | Array URL screenshot |
| `downloadUrl` | string | — | Link download APK |
| `developer` | string | — | Nama developer |
| `packageName` | string | — | Package name Android |
| `androidVersion` | string | — | Minimum Android, mis. "5.0+" |
| `license` | string | — | Tipe lisensi, mis. "Freeware" |
| `reviews` | array | — | Array review `{id, userName, rating, comment, createdAt}` |
| `createdAt` | timestamp | — | Otomatis saat create via admin |
| `updatedAt` | timestamp | — | Otomatis saat create/update via admin |

---

## 🖼️ Cara Upload Gambar ke ImgBB (untuk `icon` / `screenshots`)

```
https://imgbb.com
```

1. Klik **"Start uploading"**
2. Drag & drop gambar atau browse file
3. Tunggu upload selesai, copy **"Direct link"** URL
4. Paste URL ke field `icon` atau ke dalam array `screenshots`
   (atau langsung ke field **Icon URL** di halaman admin)

**Ukuran yang disarankan:**
- App Icon: 512x512px (kotak)
- Screenshots: 1080x1920px (portrait) atau 1920x1080px (landscape)
- Format: PNG atau JPG, maksimal 2MB per gambar (mengikuti `storage.rules`)

> Alternatif: upload langsung lewat field **Upload Icon** di halaman admin —
> file otomatis tersimpan ke Firebase Storage (perlu Storage diaktifkan).

---

## ✅ Verifikasi

Setelah seed / input manual:

1. Firebase Console → Firestore Database → cek dokumen `apps`/`games`/`tools`
2. Buka website → halaman Apps/Games/Tools/Latest/Popular → kartu harus tampil
3. Buka salah satu detail → cek screenshot, specs, dan review tampil
4. Login admin → dashboard menampilkan data

---

## 📝 Catatan

- Untuk production, ganti `downloadUrl` contoh (`example.com`) dengan link asli
- Upload ikon & screenshot asli untuk tampilan terbaik
- Update nomor versi secara berkala
- Backup data Firestore secara rutin (Export di Firebase Console)

**Happy uploading! 🎉**
