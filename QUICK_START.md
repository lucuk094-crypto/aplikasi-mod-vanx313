# ⚡ Quick Start Guide - VAN//MOD

## 🎯 Cara Cepat Mulai

### 1. Setup Firebase (15 menit)

#### Buat Firebase Project
```
1. Buka: https://console.firebase.google.com/
2. Klik "Add Project"
3. Nama: vanmod-website
4. Klik "Create project"
```

#### Enable Services
```
✅ Authentication > Sign-in method > Email/Password > Enable
✅ Firestore Database > Create database > Production mode > asia-southeast1
✅ Storage > Get started > Production mode
```

#### Buat Admin User
```
Authentication > Users > Add user
Email: admin@vanmod.com
Password: [password_kuat_anda]
💾 SIMPAN CREDENTIALS INI!
```

#### Get Firebase Config
```
Settings ⚙️ > Project settings > Your apps > Web </> 
Copy configuration object
```

### 2. Update Config (2 menit)

Buka file: `config/firebaseConfig.js`

Replace dengan config Anda:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Deploy Firestore & Storage Rules (5 menit)

#### Firestore Rules
```
1. Firebase Console > Firestore > Rules
2. Copy isi file firestore.rules
3. Paste & Publish
```

#### Storage Rules
```
1. Firebase Console > Storage > Rules
2. Copy isi file storage.rules
3. Paste & Publish
```

### 4. Deploy ke Vercel (10 menit)

#### Via GitHub (Recommended)
```bash
# Push ke GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main

# Connect Vercel
1. Buka vercel.com
2. Import dari GitHub
3. Add Environment Variables (lihat .env.example)
4. Deploy
```

#### Via CLI
```bash
npm install -g vercel
vercel login
vercel

# Add env vars
vercel env add FIREBASE_API_KEY
# ... (ulangi untuk semua env vars)

vercel --prod
```

### 5. Test Website ✅

```
✅ Browse: https://your-domain.vercel.app
✅ Admin Login: /adminlogin.html
✅ Add Apps: /adminsettings.html
✅ Check Homepage: data muncul
```

---

## 📋 Checklist Deployment

- [ ] Firebase project created
- [ ] Authentication enabled & admin user created
- [ ] Firestore database created
- [ ] Firestore rules deployed
- [ ] Storage enabled
- [ ] Storage rules deployed
- [ ] Firebase config updated in code
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Environment variables added
- [ ] Website deployed & accessible
- [ ] Admin login tested
- [ ] CRUD operations tested
- [ ] Images upload tested

---

## 🚨 Common Issues

**Can't login as admin?**
```
→ Check email/password
→ Check Firebase Authentication > Users
→ Check browser console for errors
```

**Firebase not initialized?**
```
→ Check config/firebaseConfig.js
→ Make sure all values are replaced
→ Check browser console
```

**Permission denied?**
```
→ Deploy firestore.rules
→ Deploy storage.rules
→ Check Firebase Console > Rules
```

---

## 📞 Need Help?

1. Check README.md (detailed docs)
2. Check DEPLOYMENT.md (full guide)
3. Check Firebase/Vercel documentation
4. Email: support@vanmod.com

---

**Total Time: ~30 minutes** ⏱️

Setelah selesai, website Anda akan live di Vercel dan siap digunakan! 🎉
