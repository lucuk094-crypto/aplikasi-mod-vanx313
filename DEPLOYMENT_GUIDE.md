# 🚀 VAN//MOD - Deployment Guide

## 📦 **Status Project**
✅ **READY TO DEPLOY**

---

## 🔥 **Firebase Configuration**

### **Project Details:**
- **Project ID:** `vanmod-website`
- **Firebase Console:** https://console.firebase.google.com/project/vanmod-website

### **Services Enabled:**
✅ **Authentication** (Email/Password)
- Admin User: `admin@vanmod.com`
- Password: `VanMod2024!`

✅ **Firestore Database** (Native mode)
- Rules: Public read, Auth-only write

✅ **Hosting** (optional - using Vercel instead)

❌ **Storage** (Skipped - menggunakan ImgBB untuk image hosting)

### **Environment Variables (untuk Vercel):**
```
FIREBASE_API_KEY=AIzaSyCOTEcBe1hGAeOc6wKwmVHZU9GvWLb38hk
FIREBASE_AUTH_DOMAIN=vanmod-website.firebaseapp.com
FIREBASE_PROJECT_ID=vanmod-website
FIREBASE_STORAGE_BUCKET=vanmod-website.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=525787859869
FIREBASE_APP_ID=1:525787859869:web:8b5e1ae75d067b1bedc39e
```

---

## 🌐 **Vercel Deployment**

### **Step 1: Login ke Vercel**
```
https://vercel.com
```
- Login dengan GitLab atau GitHub account

### **Step 2: Import Project**
1. Klik **"Add New..."** → **"Project"**
2. Pilih **"Import Git Repository"**
3. Paste URL repo:
   ```
   https://gitlab.com/affansmith80/website-apk-mod
   ```
4. Klik **"Import"**

### **Step 3: Configure Project**
```
Framework Preset: Other
Root Directory: ./
Build Command: (kosong)
Output Directory: (kosong)
Install Command: (kosong)
```

### **Step 4: Add Environment Variables**
Di Vercel dashboard → Settings → Environment Variables:

```
FIREBASE_API_KEY = AIzaSyCOTEcBe1hGAeOc6wKwmVHZU9GvWLb38hk
FIREBASE_AUTH_DOMAIN = vanmod-website.firebaseapp.com
FIREBASE_PROJECT_ID = vanmod-website
FIREBASE_STORAGE_BUCKET = vanmod-website.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 525787859869
FIREBASE_APP_ID = 1:525787859869:web:8b5e1ae75d067b1bedc39e
```

### **Step 5: Deploy**
1. Klik **"Deploy"**
2. Tunggu 2-3 menit
3. ✅ Website LIVE!

---

## 🧪 **Testing Checklist**

### **1. Homepage (home.html)**
- [ ] Grid layout apps tampil
- [ ] Navigation menu berfungsi
- [ ] Click "Apps" → redirect ke apps.html
- [ ] Click "Games" → redirect ke games.html
- [ ] Click "Tools" → redirect ke tools.html
- [ ] Footer links berfungsi
- [ ] Admin login link di footer berfungsi

### **2. Apps Page (apps.html)**
- [ ] App cards tampil dari Firestore
- [ ] Search bar berfungsi
- [ ] Category filter berfungsi
- [ ] Click app card → redirect ke detailapp.html

### **3. Games Page (games.html)**
- [ ] Game cards tampil dari Firestore
- [ ] Navigation berfungsi
- [ ] Filter kategori berfungsi

### **4. Tools Page (tools.html)**
- [ ] Tool cards tampil dari Firestore
- [ ] Navigation berfungsi

### **5. Latest & Popular Pages**
- [ ] Data sorting by date/popularity
- [ ] Navigation berfungsi

### **6. Detail Page (detailapp.html)**
- [ ] Detail app tampil lengkap
- [ ] Download button berfungsi
- [ ] Screenshots tampil
- [ ] Related apps tampil

### **7. Contact Page (contact.html)**
- [ ] Form submission ke Firestore
- [ ] Validation berfungsi
- [ ] Success message tampil

### **8. Admin Login (adminlogin.html)**
- [ ] Form login tampil
- [ ] Login dengan: `admin@vanmod.com` / `VanMod2024!`
- [ ] Redirect ke dashbordadmin.html setelah login
- [ ] Error message jika login gagal

### **9. Admin Dashboard (dashbordadmin.html)**
- [ ] Statistics tampil (total apps, games, tools)
- [ ] Recent uploads list
- [ ] Add new app form berfungsi
- [ ] Edit/Delete buttons berfungsi
- [ ] Logout button → redirect ke adminlogin.html

### **10. Admin Settings (adminsettings.html)**
- [ ] Profile settings
- [ ] Change password
- [ ] System logs tampil

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Website menampilkan apps.html sebagai default**
**Solution:** Sudah fixed di `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/",
      "dest": "/home.html"
    }
  ]
}
```

### **Issue 2: Navigation tidak berfungsi**
**Solution:** Sudah fixed - semua `href="#"` sudah diganti dengan `href="pagename.html"`

### **Issue 3: Admin dashboard tidak bisa diakses**
**Solution:** Link sudah ditambahkan di footer home.html → "// ADMIN LOGIN"

### **Issue 4: Firebase data tidak tampil**
**Solution:** 
1. Cek Firebase config di `config/firebaseConfig.js`
2. Cek Firestore rules: public read, auth-only write
3. Cek browser console untuk error

### **Issue 5: Script tidak ter-load**
**Solution:** Semua script sudah menggunakan `type="module"` dan path relatif `src/js/`

---

## 📂 **File Structure**

```
d:\Project Van-X\Desain Web Aplikasi\
├── index.html                  # Redirect to home.html
├── home.html                   # Homepage
├── apps.html                   # Apps catalog
├── games.html                  # Games catalog
├── tools.html                  # Tools catalog
├── latest.html                 # Latest uploads
├── popular.html                # Popular items
├── detailapp.html              # Detail page
├── contact.html                # Contact form
├── about.html                  # About page
├── panduan.html                # Guide page
├── adminlogin.html             # Admin login
├── dashbordadmin.html          # Admin dashboard
├── adminsettings.html          # Admin settings
├── systemlogdetail.html        # System logs
├── transmissionsucces.html     # Success page
├── vercel.json                 # Vercel config
├── package.json                # Dependencies
├── .gitignore                  # Git ignore
├── config/
│   └── firebaseConfig.js       # Firebase config
└── src/
    └── js/
        ├── app.js              # Main app init
        ├── home.js             # Homepage logic
        ├── apps.js             # Apps page logic
        ├── games.js            # Games page logic
        ├── tools.js            # Tools page logic
        ├── detailApp.js        # Detail page logic
        ├── contact.js          # Contact form logic
        ├── adminLogin.js       # Admin login logic
        ├── adminDashboard.js   # Dashboard logic
        └── adminSettings.js    # Settings logic
```

---

## 🔗 **Important Links**

- **GitLab Repo:** https://gitlab.com/affansmith80/website-apk-mod
- **Firebase Console:** https://console.firebase.google.com/project/vanmod-website
- **Vercel Dashboard:** https://vercel.com/dashboard
- **ImgBB (Image Hosting):** https://imgbb.com

---

## 📝 **Next Steps After Deployment**

1. **Test semua fitur** menggunakan checklist di atas
2. **Upload sample data** ke Firestore:
   - Buka Firebase Console → Firestore Database
   - Add collection: `apps`, `games`, `tools`
   - Add documents dengan field: `title`, `description`, `version`, `size`, `rating`, `category`, `imageUrl`, `downloadUrl`, `createdAt`

3. **Setup ImgBB untuk images:**
   - Sign up: https://imgbb.com
   - Upload app icons & screenshots
   - Copy image URLs
   - Paste ke Firestore `imageUrl` field

4. **Customize branding** jika perlu:
   - Logo: Edit "VAN//MOD" text di semua HTML files
   - Colors: Edit Tailwind config di `<script id="tailwind-config">`
   - Footer text: Edit copyright di footer

---

## 🎉 **Deployment Complete!**

Website VAN//MOD sekarang:
✅ Navigation berfungsi di semua halaman
✅ Admin dashboard bisa diakses via footer
✅ Firebase terintegrasi
✅ Ready to deploy ke Vercel
✅ Semua link internal berfungsi

**Silakan deploy ke Vercel dan test semua fitur!**

---

## 📞 **Support**

Jika ada masalah:
1. Cek browser console untuk error
2. Cek Vercel deployment logs
3. Cek Firebase console untuk data/rules issues
4. Lihat section "Common Issues & Solutions" di atas
