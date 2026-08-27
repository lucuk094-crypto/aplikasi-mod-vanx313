# 🚀 Deploy VAN//MOD via GitHub → Vercel

## ✅ **Cara Paling Mudah & Reliable:**

### **Step 1: Create GitHub Repository**

1. Buka: https://github.com/new
2. Repository name: `website-apk-mod`
3. Visibility: Public atau Private
4. **JANGAN** check "Initialize with README"
5. Klik "Create repository"

---

### **Step 2: Push ke GitHub**

Copy commands dari GitHub (akan muncul setelah create repo):

**Atau run ini di PowerShell:**

```powershell
cd "d:\Project Van-X\Desain Web Aplikasi"

# Add GitHub remote
git remote add github https://github.com/YOUR_USERNAME/website-apk-mod.git

# Push to GitHub
git push github main
```

**Replace `YOUR_USERNAME` dengan username GitHub Anda!**

---

### **Step 3: Import di Vercel**

1. Buka: https://vercel.com/new
2. Klik "Import Git Repository"
3. Pilih **GitHub** (bukan GitLab)
4. Cari repo: `website-apk-mod`
5. Klik "Import"

**Configure:**
```
Framework Preset: Other
Root Directory: ./
Build Command: (leave empty)
Output Directory: (leave empty)
Install Command: (leave empty)
```

6. **Environment Variables** (Optional):
```
Bisa skip ini karena config sudah hardcoded di app.js
```

7. Klik **"Deploy"**

---

### **Step 4: Wait & Test**

Deployment akan:
```
⏳ Building... (30 detik)
⏳ Deploying... (30 detik)
✅ Ready! (1-2 menit total)
```

URL akan seperti: `https://website-apk-mod.vercel.app`

---

## 🎯 **Auto Deploy Future Changes:**

Setelah connected ke GitHub, setiap kali push:
```powershell
git push github main
```

Vercel akan **auto-deploy** dalam 1-2 menit!

---

## ✅ **Verification:**

Setelah deploy, test ini di console:
```javascript
fetch('src/js/app.js').then(r => console.log('Status:', r.status));
```

Expected: `Status: 200` ✅

---

**GitHub + Vercel = Perfect combo! GitLab kadang bermasalah.** 🚀
