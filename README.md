# VAN//MOD - High-End Brutalist Mod Ecosystem

Website kumpulan aplikasi, games, dan tools modded dengan desain brutalist high-end.

## 🚀 Fitur Utama

### Frontend
- ✅ Homepage dengan Featured Mods, Trending, dan Latest Updates
- ✅ Halaman Apps/Games/Tools dengan filtering dan search
- ✅ Detail page untuk setiap aplikasi dengan screenshots dan reviews
- ✅ Rating dan review system
- ✅ Download counter
- ✅ Contact form
- ✅ Admin login dan dashboard
- ✅ CRUD operations untuk mengelola apps/games/tools

### Backend (Firebase)
- ✅ Firebase Authentication untuk admin
- ✅ Firestore Database untuk menyimpan data
- ✅ Firebase Storage untuk upload gambar
- ✅ Real-time updates
- ✅ Statistics dan analytics

## 📦 Teknologi

- **Frontend**: HTML5, Tailwind CSS, JavaScript (ES6+)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deployment**: Vercel
- **Version Control**: Git

## 🔧 Setup Firebase

### 1. Buat Firebase Project

1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add Project" atau "Create a project"
3. Masukkan nama project: `vanmod-website` (atau nama lain)
4. Disable Google Analytics (opsional)
5. Klik "Create project"

### 2. Setup Firebase Authentication

1. Di Firebase Console, buka menu **Authentication**
2. Klik tab "Sign-in method"
3. Enable **Email/Password** authentication
4. Klik "Save"

### 3. Buat Admin User

1. Di Authentication, buka tab "Users"
2. Klik "Add user"
3. Masukkan email dan password untuk admin (contoh: `admin@vanmod.com`)
4. Klik "Add user"
5. **Simpan credentials ini untuk login admin**

### 4. Setup Firestore Database

1. Di Firebase Console, buka menu **Firestore Database**
2. Klik "Create database"
3. Pilih **Start in production mode** (kita akan setup rules nanti)
4. Pilih location (pilih yang terdekat, contoh: `asia-southeast1`)
5. Klik "Enable"

### 5. Setup Firestore Security Rules

Di Firestore Database, buka tab "Rules" dan paste rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apps collection - read public, write admin only
    match /apps/{appId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Games collection - read public, write admin only
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Tools collection - read public, write admin only
    match /tools/{toolId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Contacts collection - write public, read admin only
    match /contacts/{contactId} {
      allow read: if request.auth != null;
      allow create: if true;
    }
    
    // Stats collection - read public, write admin only
    match /stats/{statId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Klik "Publish"

### 6. Setup Firebase Storage

1. Di Firebase Console, buka menu **Storage**
2. Klik "Get started"
3. Pilih **Start in production mode**
4. Pilih location yang sama dengan Firestore
5. Klik "Done"

### 7. Setup Storage Security Rules

Di Storage, buka tab "Rules" dan paste rules berikut:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Icons folder - read public, write admin only
    match /icons/{iconId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Screenshots folder - read public, write admin only
    match /screenshots/{screenshotId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Klik "Publish"

### 8. Get Firebase Config

1. Di Firebase Console, klik icon gear ⚙️ > Project settings
2. Scroll ke bawah ke bagian "Your apps"
3. Klik icon web `</>`
4. Register app dengan nickname: `vanmod-web`
5. Copy Firebase configuration object

Config akan terlihat seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 9. Update Config di Project

Buka file `config/firebaseConfig.js` dan replace dengan config Anda:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

## 🚀 Deployment ke Vercel

### 1. Install Vercel CLI (Opsional)

```bash
npm install -g vercel
```

### 2. Login ke Vercel

```bash
vercel login
```

### 3. Deploy Project

Ada 2 cara deploy ke Vercel:

#### Cara 1: Melalui Vercel Dashboard (Recommended)

1. Kunjungi [vercel.com](https://vercel.com)
2. Login dengan GitHub/GitLab/Bitbucket
3. Klik "Add New Project"
4. Import repository ini
5. Vercel akan auto-detect settings
6. Tambahkan Environment Variables di Settings:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
7. Klik "Deploy"

#### Cara 2: Melalui CLI

```bash
vercel
```

Follow the prompts dan website akan otomatis ter-deploy.

### 4. Setup Environment Variables di Vercel

Di Vercel Dashboard:
1. Buka project Anda
2. Klik "Settings"
3. Klik "Environment Variables"
4. Tambahkan variabel-variabel Firebase:

```
FIREBASE_API_KEY = your_api_key
FIREBASE_AUTH_DOMAIN = your_auth_domain
FIREBASE_PROJECT_ID = your_project_id
FIREBASE_STORAGE_BUCKET = your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID = your_sender_id
FIREBASE_APP_ID = your_app_id
```

5. Klik "Save"
6. Redeploy project

## 📝 Cara Menggunakan

### Admin Login

1. Buka `https://your-domain.vercel.app/adminlogin.html`
2. Login dengan credentials admin yang dibuat di Firebase
3. Anda akan diarahkan ke Admin Dashboard

### Menambah App/Game/Tool Baru

1. Login sebagai admin
2. Di dashboard, klik "ADD NEW ENTRY" atau buka `adminsettings.html`
3. Pilih tipe: Apps, Games, atau Tools
4. Isi form:
   - **Name**: Nama aplikasi
   - **Description**: Deskripsi lengkap
   - **Version**: Versi aplikasi (contoh: 1.0.0)
   - **Size**: Ukuran file (contoh: 45MB)
   - **Category**: Kategori (contoh: Social, Action, Utility)
   - **Developer**: Nama developer
   - **Package Name**: Package name Android
   - **Android Version**: Minimum Android version (contoh: 5.0+)
   - **License**: Tipe lisensi (contoh: Freeware)
   - **Download URL**: Link download file APK
   - **Tags**: Tags dipisah koma (contoh: premium, unlocked, ad-free)
   - **Mod Type**: Tipe mod (contoh: PREMIUM, MOD, MODDED)
   - **Icon**: Upload icon/logo aplikasi
5. Klik "DEPLOY ENTRY" untuk menyimpan

### Mengedit App/Game/Tool

1. Di dashboard, klik tombol "MOD" pada card aplikasi yang ingin diedit
2. Edit data yang diperlukan
3. Klik "UPDATE ENTRY"

### Menghapus App/Game/Tool

1. Buka halaman edit aplikasi
2. Scroll ke bawah
3. Klik tombol "DELETE ENTRY"
4. Konfirmasi penghapusan

## 🗂️ Struktur Database Firestore

### Collection: `apps`
```javascript
{
  name: "Instagram Mod",
  description: "Instagram with premium features unlocked",
  version: "285.0.0.32.101",
  size: "45MB",
  category: "Social",
  developer: "Meta Platforms",
  packageName: "com.instagram.android",
  androidVersion: "5.0+",
  license: "Freeware",
  downloadUrl: "https://...",
  icon: "https://...",
  tags: ["premium", "unlocked", "ad-free"],
  modType: "PREMIUM",
  downloads: 12500,
  rating: 4.8,
  reviews: [
    {
      id: "review123",
      userName: "User Name",
      rating: 5,
      comment: "Great mod!",
      createdAt: timestamp
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `games`
Struktur sama dengan `apps`

### Collection: `tools`
Struktur sama dengan `apps`

### Collection: `contacts`
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  subject: "Bug Report",
  message: "Found a bug...",
  priority: "urgent",
  status: "unread",
  createdAt: timestamp
}
```

### Collection: `stats`
Document ID: `global`
```javascript
{
  totalApps: 128,
  totalGames: 45,
  totalTools: 23,
  totalDownloads: 1250000,
  totalUsers: 45000,
  updatedAt: timestamp
}
```

## 🎨 Struktur Folder

```
vanmod-web-app/
├── assets/
│   └── images/           # Gambar dan assets statis
├── config/
│   └── firebaseConfig.js # Firebase configuration
├── src/
│   ├── css/             # CSS files
│   └── js/              # JavaScript modules
│       ├── app.js       # Main app & Firebase init
│       ├── home.js      # Homepage functionality
│       ├── apps.js      # Apps page
│       ├── games.js     # Games page
│       ├── tools.js     # Tools page
│       ├── detailApp.js # Detail page
│       ├── contact.js   # Contact form
│       ├── adminLogin.js      # Admin login
│       ├── adminDashboard.js  # Admin dashboard
│       └── adminSettings.js   # CRUD operations
├── *.html               # HTML pages
├── package.json         # NPM dependencies
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## 📄 Halaman Website

1. **home.html** - Homepage dengan featured, trending, dan latest mods
2. **apps.html** - Katalog aplikasi dengan search dan filter
3. **games.html** - Katalog games dengan search dan filter
4. **tools.html** - Katalog tools dengan search dan filter
5. **detailapp.html** - Detail halaman aplikasi
6. **about.html** - Tentang VAN//MOD
7. **contact.html** - Formulir kontak
8. **panduan.html** - Panduan penggunaan
9. **latest.html** - Update terbaru
10. **popular.html** - Mod paling populer
11. **adminlogin.html** - Login admin
12. **dashbordadmin.html** - Dashboard admin
13. **adminsettings.html** - Manajemen CRUD apps/games/tools
14. **systemlogdetail.html** - Detail logs dan analytics
15. **transmissionsucces.html** - Halaman sukses setelah aksi

## 🔐 Keamanan

- Firebase Authentication untuk admin access
- Firestore Security Rules membatasi write access hanya untuk authenticated users
- Storage Security Rules membatasi upload hanya untuk admin
- Admin credentials tidak disimpan di client-side
- Environment variables untuk Firebase config di production

## 📊 Analytics & Monitoring

- Download counter untuk setiap app
- Rating system dengan average calculation
- Review system dengan timestamp
- Global statistics (total apps, downloads, users)
- Real-time updates di admin dashboard

## 🐛 Troubleshooting

### Error: "Permission denied" di Firestore
- Pastikan Firestore Security Rules sudah di-setup dengan benar
- Untuk testing, Anda bisa set rules ke test mode sementara

### Error: "Failed to load apps"
- Cek Firebase config di `config/firebaseConfig.js`
- Pastikan Firebase SDK sudah ter-load
- Cek console browser untuk error detail

### Admin tidak bisa login
- Pastikan user sudah dibuat di Firebase Authentication
- Cek email dan password
- Pastikan Authentication sudah enable Email/Password method

### Upload gambar gagal
- Pastikan Firebase Storage sudah di-setup
- Cek Storage Security Rules
- Pastikan file size < 2MB
- Pastikan format gambar valid (jpg, png, gif, webp)

## 📞 Support

Untuk pertanyaan dan support, hubungi melalui:
- Email: support@vanmod.com
- Contact Form: https://your-domain.vercel.app/contact.html

## 📜 License

MIT License - Feel free to use this project for your own purposes.

---

**VAN//MOD** - High-End Brutalist Mod Ecosystem
© 2024 All Rights Reserved
