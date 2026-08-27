# 🚀 Deploy VAN//MOD ke Vercel via CLI

## ⚡ **Quick Deploy Steps:**

### **Step 1: Install Vercel CLI**

Buka PowerShell/Terminal dan run:
```powershell
npm install -g vercel
```

Atau jika belum punya Node.js:
1. Download Node.js: https://nodejs.org/en/download/
2. Install Node.js
3. Restart terminal
4. Run: `npm install -g vercel`

---

### **Step 2: Login ke Vercel**

```powershell
vercel login
```

Pilih login method (Email, GitHub, atau GitLab)

---

### **Step 3: Deploy**

Di folder project:
```powershell
cd "d:\Project Van-X\Desain Web Aplikasi"
vercel
```

**Jawab pertanyaan:**
```
? Set up and deploy? → Y (Yes)
? Which scope? → Select your account
? Link to existing project? → Y (jika ada) atau N (jika baru)
? What's your project's name? → website-apk-mod
? In which directory is your code located? → ./
```

**Vercel akan deploy semua files!**

---

### **Step 4: Deploy Production**

Setelah preview deploy sukses:
```powershell
vercel --prod
```

Ini akan deploy ke production domain!

---

## ✅ **Expected Result:**

```
✅ Deployment complete!
🔗 Production: https://your-site.vercel.app
```

Semua file termasuk `src/js/app.js` akan ter-upload!

---

## 📝 **Alternative: Jika Tidak Mau Install CLI**

Gunakan Vercel import dari GitHub (lebih reliable daripada GitLab):

1. Push code ke GitHub
2. Import project di Vercel dari GitHub
3. Auto-deploy akan work dengan baik

---

## 🎯 **Vercel CLI Commands Reference:**

```powershell
# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# List deployments
vercel ls

# Remove project
vercel remove

# Check version
vercel --version
```

---

**Setelah deploy via CLI, test lagi! File JavaScript akan muncul!** 🚀
