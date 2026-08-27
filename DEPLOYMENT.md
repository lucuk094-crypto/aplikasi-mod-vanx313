# 🚀 Panduan Deployment VAN//MOD

## Langkah-Langkah Deployment

### 1. Setup Firebase Project

#### A. Buat Firebase Project
```
1. Buka https://console.firebase.google.com/
2. Klik "Add Project" atau "Create a project"
3. Nama project: vanmod-website (atau sesuai keinginan)
4. Disable Google Analytics (opsional)
5. Klik "Create project"
```

#### B. Enable Firebase Authentication
```
1. Di sidebar, klik "Authentication"
2. Klik "Get started"
3. Pilih tab "Sign-in method"
4. Enable "Email/Password"
5. Klik "Save"
```

#### C. Buat Admin User
```
1. Di Authentication, tab "Users"
2. Klik "Add user"
3. Email: admin@vanmod.com (atau email lain)
4. Password: [buat password yang kuat]
5. Klik "Add user"
6. SIMPAN CREDENTIALS INI!
```

#### D. Setup Firestore Database
```
1. Di sidebar, klik "Firestore Database"
2. Klik "Create database"
3. Pilih "Start in production mode"
4. Location: asia-southeast1 (atau terdekat)
5. Klik "Enable"
```

#### E. Deploy Firestore Rules
```
1. Di Firestore Database, tab "Rules"
2. Copy isi dari file firestore.rules
3. Paste ke editor
4. Klik "Publish"
```

#### F. Deploy Firestore Indexes
```
1. Install Firebase CLI: npm install -g firebase-tools
2. Login: firebase login
3. Init project: firebase init firestore
4. Deploy indexes: firebase deploy --only firestore:indexes
```

#### G. Setup Firebase Storage
```
1. Di sidebar, klik "Storage"
2. Klik "Get started"
3. Pilih "Start in production mode"
4. Location: sama dengan Firestore
5. Klik "Done"
```

#### H. Deploy Storage Rules
```
1. Di Storage, tab "Rules"
2. Copy isi dari file storage.rules
3. Paste ke editor
4. Klik "Publish"
```

#### I. Get Firebase Configuration
```
1. Klik icon gear ⚙️ > Project settings
2. Scroll ke "Your apps"
3. Klik icon web </> untuk add web app
4. App nickname: vanmod-web
5. Klik "Register app"
6. COPY Firebase configuration object
```

Configuration akan terlihat seperti ini:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef"
};
```

#### J. Update Firebase Config di Project
```
1. Buka file: config/firebaseConfig.js
2. Replace dengan config Anda
3. Save file
```

---

### 2. Deploy ke Vercel

#### Opsi A: Deploy via GitHub (Recommended)

1. **Push ke GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/vanmod-website.git
git push -u origin main
```

2. **Connect ke Vercel**
```
1. Buka https://vercel.com
2. Login dengan GitHub
3. Klik "Add New Project"
4. Import repository vanmod-website
5. Project Name: vanmod-website
6. Framework Preset: Other
7. Root Directory: ./
8. Build Command: (kosongkan)
9. Output Directory: (kosongkan)
```

3. **Add Environment Variables**
```
1. Di Vercel project settings
2. Klik "Environment Variables"
3. Tambahkan satu per satu:

Key: FIREBASE_API_KEY
Value: [your_api_key]

Key: FIREBASE_AUTH_DOMAIN
Value: [your_auth_domain]

Key: FIREBASE_PROJECT_ID
Value: [your_project_id]

Key: FIREBASE_STORAGE_BUCKET
Value: [your_storage_bucket]

Key: FIREBASE_MESSAGING_SENDER_ID
Value: [your_sender_id]

Key: FIREBASE_APP_ID
Value: [your_app_id]

4. Klik "Save" untuk setiap variable
```

4. **Deploy**
```
1. Klik "Deploy"
2. Wait for deployment (2-3 menit)
3. Klik "Visit" untuk melihat website live
```

#### Opsi B: Deploy via Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Add Environment Variables**
```bash
vercel env add FIREBASE_API_KEY
vercel env add FIREBASE_AUTH_DOMAIN
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_STORAGE_BUCKET
vercel env add FIREBASE_MESSAGING_SENDER_ID
vercel env add FIREBASE_APP_ID
```

5. **Redeploy with env vars**
```bash
vercel --prod
```

---

### 3. Verifikasi Deployment

#### A. Test Website
```
1. Buka URL Vercel Anda
2. Test navigasi antar halaman
3. Test search functionality
4. Test filter categories
```

#### B. Test Admin Panel
```
1. Buka https://your-domain.vercel.app/adminlogin.html
2. Login dengan admin credentials dari Firebase
3. Test create/edit/delete apps
4. Test image upload
```

#### C. Test Database
```
1. Tambah app baru dari admin panel
2. Cek di Firestore Database apakah data tersimpan
3. Refresh homepage, cek apakah app muncul
```

---

### 4. Custom Domain (Opsional)

#### A. Add Custom Domain di Vercel
```
1. Di Vercel project settings
2. Klik "Domains"
3. Add domain: vanmod.com
4. Follow DNS configuration instructions
```

#### B. Update Firebase Auth Domain
```
1. Di Firebase Console > Authentication > Settings
2. Add authorized domain: vanmod.com
3. Save
```

---

### 5. Post-Deployment Setup

#### A. Populate Initial Data
```
1. Login ke admin panel
2. Add beberapa apps/games/tools
3. Upload icons dan screenshots
4. Test di homepage
```

#### B. Setup Analytics (Opsional)
```
1. Di Firebase Console
2. Enable Google Analytics
3. View analytics di Firebase dashboard
```

#### C. Enable Firebase Hosting (Opsional sebagai backup)
```bash
firebase init hosting
firebase deploy --only hosting
```

---

## 🔧 Troubleshooting

### Error: Firebase not initialized
```
- Cek apakah firebaseConfig sudah di-update
- Cek console browser untuk error details
- Pastikan semua script tags ada di HTML
```

### Error: Permission denied (Firestore)
```
- Cek Firestore Security Rules
- Pastikan rules sudah di-publish
- Test rules di Firebase Console > Rules playground
```

### Error: Upload failed (Storage)
```
- Cek Storage Security Rules
- Pastikan file size < 2MB
- Cek format file (harus image)
```

### Error: Admin can't login
```
- Cek apakah user ada di Firebase Authentication
- Cek email & password
- Cek browser console untuk error
```

### Website slow to load
```
- Enable caching di Vercel
- Optimize images (compress before upload)
- Enable CDN di Vercel settings
```

---

## 📊 Monitoring

### Vercel Analytics
```
1. Enable di Vercel project settings
2. View traffic, performance metrics
```

### Firebase Analytics
```
1. Enable di Firebase Console
2. View user behavior, downloads, etc.
```

### Error Tracking
```
- Check Vercel deployment logs
- Check browser console
- Check Firebase Console > Functions logs
```

---

## 🔄 Updates & Maintenance

### Update Website
```bash
git add .
git commit -m "Update description"
git push
# Vercel auto-deploys
```

### Update Firebase Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Backup Database
```
1. Firebase Console > Firestore
2. Import/Export tab
3. Export to Cloud Storage
```

---

## 📞 Support

Jika ada masalah:
1. Cek documentation ini
2. Cek README.md
3. Cek Firebase/Vercel documentation
4. Contact: support@vanmod.com

---

**Selamat! Website VAN//MOD Anda sekarang sudah live! 🎉**
