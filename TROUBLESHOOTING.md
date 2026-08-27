# 🔧 Troubleshooting Guide - VAN//MOD

## 🔐 **Issue: Admin Login Error**

### **Problem:** Email dan password benar tapi tidak bisa login

### **Solutions:**

#### **1. Cek Firebase Authentication**

**Step 1:** Buka Firebase Console
```
https://console.firebase.google.com/project/vanmod-website/authentication
```

**Step 2:** Verifikasi user exists
- Klik tab **"Users"**
- Cari email: `admin@vanmod.com`
- **Jika TIDAK ADA:**
  - Klik **"Add user"**
  - Email: `admin@vanmod.com`
  - Password: `VanMod2024!`
  - Klik **"Add user"**

**Step 3:** Cek Email/Password Provider Enabled
- Klik tab **"Sign-in method"**
- Pastikan **"Email/Password"** statusnya **"Enabled"**
- Jika disabled, klik dan enable

---

#### **2. Cek Browser Console untuk Error**

**Step 1:** Buka browser console
- Chrome/Edge: Press `F12` atau `Ctrl+Shift+I`
- Firefox: Press `F12` atau `Ctrl+Shift+K`

**Step 2:** Klik tab **"Console"**

**Step 3:** Coba login lagi dan lihat error messages

**Common Errors & Solutions:**

##### **Error: "Firebase: Error (auth/user-not-found)"**
**Solution:** User belum dibuat di Firebase
```
1. Buka Firebase Console → Authentication → Users
2. Add user: admin@vanmod.com / VanMod2024!
```

##### **Error: "Firebase: Error (auth/wrong-password)"**
**Solution:** Password salah
```
Coba password: VanMod2024!
atau reset password di Firebase Console
```

##### **Error: "Firebase: Error (auth/invalid-email)"**
**Solution:** Format email salah
```
Pastikan email: admin@vanmod.com (huruf kecil semua)
```

##### **Error: "Firebase: Error (auth/too-many-requests)"**
**Solution:** Terlalu banyak percobaan login gagal
```
Tunggu 15-30 menit atau reset password di Firebase Console
```

##### **Error: "VANMOD is not defined"**
**Solution:** app.js tidak ter-load
```
1. Cek browser console untuk error load script
2. Pastikan src="src/js/app.js" path benar
3. Clear browser cache: Ctrl+Shift+Delete
4. Reload page: Ctrl+F5
```

##### **Error: "Cannot read property 'adminLogin' of undefined"**
**Solution:** app.js error atau Firebase belum initialize
```
1. Cek Firebase config di src/js/app.js
2. Pastikan apiKey, projectId, dll sudah benar
3. Reload page
```

---

#### **3. Clear Browser Cache**

**Step 1:** Clear cache
- Chrome: `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Time range: "All time"
- Click "Clear data"

**Step 2:** Hard reload
- Press `Ctrl+F5` atau `Ctrl+Shift+R`

**Step 3:** Coba login lagi

---

#### **4. Test Firebase Connection**

**Step 1:** Buka browser console (F12)

**Step 2:** Paste code ini dan Enter:
```javascript
// Test Firebase connection
fetch('https://vanmod-website.firebaseapp.com')
  .then(response => console.log('✅ Firebase reachable:', response.status))
  .catch(error => console.error('❌ Firebase unreachable:', error));

// Test if VANMOD object exists
console.log('VANMOD object:', window.VANMOD);

// Test Firebase auth
if (window.VANMOD) {
  console.log('✅ VANMOD loaded');
} else {
  console.error('❌ VANMOD not loaded - check app.js');
}
```

**Expected Output:**
```
✅ Firebase reachable: 200
✅ VANMOD loaded
VANMOD object: {adminLogin: ƒ, adminLogout: ƒ, ...}
```

---

#### **5. Manual Test Login via Console**

**Step 1:** Buka browser console (F12)

**Step 2:** Paste code ini:
```javascript
// Manual test login
VANMOD.adminLogin('admin@vanmod.com', 'VanMod2024!')
  .then(result => {
    console.log('Login result:', result);
    if (result.success) {
      console.log('✅ Login SUCCESS!');
      window.location.href = 'dashbordadmin.html';
    } else {
      console.error('❌ Login FAILED:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ Login ERROR:', error);
  });
```

**Expected Output (Success):**
```
Login result: {success: true, user: {...}}
✅ Login SUCCESS!
(redirect to dashboard)
```

**Expected Output (Failed):**
```
Login result: {success: false, error: "Firebase: Error (auth/...)"}
❌ Login FAILED: Firebase: Error (...)
```

---

#### **6. Vercel Environment Variables**

Jika deploy di Vercel, pastikan environment variables sudah diset:

**Step 1:** Buka Vercel Dashboard
```
https://vercel.com/dashboard
```

**Step 2:** Select project → Settings → Environment Variables

**Step 3:** Pastikan variables ini ada:
```
FIREBASE_API_KEY = AIzaSyB1ccnYtBwYYELE_JYr3AlSVzYf3KRxPU0
FIREBASE_AUTH_DOMAIN = vanmod-website.firebaseapp.com
FIREBASE_PROJECT_ID = vanmod-website
FIREBASE_STORAGE_BUCKET = vanmod-website.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 706013336903
FIREBASE_APP_ID = 1:706013336903:web:70053ec43cf8a8c03c6862
```

**Step 4:** Jika tidak ada, add semua variables

**Step 5:** Redeploy:
- Klik "Deployments" tab
- Klik "..." → "Redeploy"

---

#### **7. Firebase Rules Check**

**Step 1:** Buka Firestore Rules
```
https://console.firebase.google.com/project/vanmod-website/firestore/rules
```

**Step 2:** Pastikan rules seperti ini:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Step 3:** Klik **"Publish"** jika ada perubahan

---

## 🌐 **Issue: Website Menampilkan Page yang Salah**

### **Problem:** Homepage tidak muncul / langsung ke apps.html

### **Solution:**

#### **1. Cek vercel.json routes**

File: `vercel.json`
```json
{
  "routes": [
    {
      "src": "/",
      "dest": "/home.html"
    },
    {
      "src": "/index.html",
      "dest": "/home.html"
    }
  ]
}
```

#### **2. Redeploy di Vercel**
- Push changes ke GitLab
- Vercel akan auto-deploy
- Atau manual redeploy di Vercel dashboard

---

## 🔗 **Issue: Navigation Links Tidak Berfungsi**

### **Problem:** Klik link tapi tidak redirect

### **Solution:**

#### **Cek HTML links:**
```html
<!-- ❌ SALAH -->
<a href="#">Home</a>

<!-- ✅ BENAR -->
<a href="home.html">Home</a>
```

#### **Fix sudah dilakukan di commit terbaru:**
- Semua `href="#"` sudah diganti
- Push ke GitLab sudah done
- Redeploy Vercel untuk apply changes

---

## 📱 **Issue: Mobile View Tidak Tampil dengan Benar**

### **Solution:**

#### **1. Clear mobile browser cache**
- Chrome Mobile: Settings → Privacy → Clear browsing data
- Safari iOS: Settings → Safari → Clear History and Website Data

#### **2. Hard reload**
- Pull down to refresh
- Atau close and reopen browser

---

## 🔥 **Issue: Firebase Data Tidak Tampil**

### **Problem:** Apps/Games/Tools cards kosong

### **Solution:**

#### **1. Cek Firestore Database**

**Step 1:** Buka Firestore
```
https://console.firebase.google.com/project/vanmod-website/firestore
```

**Step 2:** Verifikasi collections ada:
- `apps` collection
- `games` collection
- `tools` collection

**Step 3:** Jika kosong, upload sample data
- Lihat file `SAMPLE_DATA.md`
- Add documents manually di Firebase Console

#### **2. Cek Browser Console**

Look for errors:
```
❌ FirebaseError: Missing or insufficient permissions
✅ Solution: Update Firestore rules (lihat section 7 di atas)

❌ FirebaseError: Collection not found
✅ Solution: Create collections di Firestore

❌ TypeError: Cannot read property 'forEach'
✅ Solution: Data belum ada, upload sample data
```

---

## 🚀 **Quick Fix Checklist**

Jika semua tidak work, ikuti langkah ini:

```
✅ 1. Clear browser cache (Ctrl+Shift+Delete)
✅ 2. Hard reload (Ctrl+F5)
✅ 3. Buka browser console (F12) - cek error
✅ 4. Verifikasi Firebase user exists
✅ 5. Verifikasi Firebase config correct
✅ 6. Test manual login via console
✅ 7. Redeploy di Vercel
✅ 8. Try in incognito/private mode
```

---

## 📞 **Still Having Issues?**

### **Debug Information to Collect:**

1. **Browser & Version:**
   - Chrome, Firefox, Safari, Edge?
   - Version number?

2. **Error Messages:**
   - Screenshot browser console (F12)
   - Copy error text

3. **Steps to Reproduce:**
   - What page?
   - What button clicked?
   - What happened?

4. **Environment:**
   - Local (http://localhost) or Production (Vercel URL)?
   - Mobile or Desktop?

---

## 🔑 **Current Working Credentials**

```
Email: admin@vanmod.com
Password: VanMod2024!

Firebase Project ID: vanmod-website
GitLab Repo: https://gitlab.com/affansmith80/website-apk-mod
```

---

## ✅ **Verification Steps After Fix**

1. **Login Test:**
   ```
   1. Buka adminlogin.html
   2. Input: admin@vanmod.com
   3. Password: VanMod2024!
   4. Click LOGIN
   5. Should redirect to dashbordadmin.html
   ```

2. **Navigation Test:**
   ```
   1. Buka home.html
   2. Click "Apps" → should go to apps.html
   3. Click "Games" → should go to games.html
   4. Click "Tools" → should go to tools.html
   5. Click footer "// ADMIN LOGIN" → should go to adminlogin.html
   ```

3. **Data Test:**
   ```
   1. Login to dashboard
   2. Check if statistics show numbers
   3. Check if recent uploads list shows items
   4. Try add new app/game/tool
   ```

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

---

**Semoga ini membantu solve semua masalah! 🚀**
