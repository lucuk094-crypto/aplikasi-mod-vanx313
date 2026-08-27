# 📊 Sample Data untuk Firestore

## 🔥 **Cara Upload Data ke Firestore**

### **Step 1: Buka Firebase Console**
```
https://console.firebase.google.com/project/vanmod-website/firestore
```

### **Step 2: Buat Collection**
1. Klik **"Start collection"**
2. Collection ID: `apps`
3. Klik **"Next"**

### **Step 3: Add Document**
Gunakan data sample di bawah ini:

---

## 📱 **Sample Data: APPS Collection**

### **Document 1: Spotify Premium**
```json
{
  "id": "spotify-premium-mod",
  "title": "Spotify Premium Plus",
  "description": "Listen to unlimited music with no ads, offline mode, and premium features unlocked. High-quality audio streaming up to 320kbps.",
  "category": "Media",
  "subcategory": "Audio",
  "version": "8.8.8",
  "size": "124MB",
  "rating": 4.9,
  "downloads": 45230,
  "modType": "MOD",
  "modFeatures": [
    "Premium Unlocked",
    "No Ads",
    "Offline Download",
    "High Quality Audio",
    "Skip Unlimited"
  ],
  "imageUrl": "https://i.ibb.co/example1.png",
  "screenshots": [
    "https://i.ibb.co/example1-1.png",
    "https://i.ibb.co/example1-2.png",
    "https://i.ibb.co/example1-3.png"
  ],
  "downloadUrl": "https://example.com/download/spotify-mod.apk",
  "developer": "Spotify Inc. (Modified)",
  "packageName": "com.spotify.music.mod",
  "minAndroid": "5.0",
  "featured": true,
  "trending": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### **Document 2: Instagram Pro**
```json
{
  "id": "instagram-pro-mod",
  "title": "Instagram Pro",
  "description": "Enhanced Instagram with download capabilities, ghost mode, and premium features. Save stories, posts, and reels easily.",
  "category": "Social",
  "subcategory": "Photo Sharing",
  "version": "275.0.0.24",
  "size": "68MB",
  "rating": 4.7,
  "downloads": 89450,
  "modType": "MOD",
  "modFeatures": [
    "Download Stories",
    "Download Posts & Reels",
    "Ghost Mode",
    "No Ads",
    "HD Profile Picture"
  ],
  "imageUrl": "https://i.ibb.co/example2.png",
  "screenshots": [
    "https://i.ibb.co/example2-1.png",
    "https://i.ibb.co/example2-2.png"
  ],
  "downloadUrl": "https://example.com/download/instagram-pro.apk",
  "developer": "Meta (Modified)",
  "packageName": "com.instagram.android.mod",
  "minAndroid": "6.0",
  "featured": true,
  "trending": false,
  "createdAt": "2024-01-14T15:20:00Z",
  "updatedAt": "2024-01-14T15:20:00Z"
}
```

### **Document 3: WhatsApp Plus**
```json
{
  "id": "whatsapp-plus-mod",
  "title": "WhatsApp Plus 2024",
  "description": "WhatsApp with extra features including themes, privacy options, and customization. More than 1000+ themes available.",
  "category": "Communication",
  "subcategory": "Messaging",
  "version": "18.20.0",
  "size": "55MB",
  "rating": 4.8,
  "downloads": 125670,
  "modType": "MOD",
  "modFeatures": [
    "1000+ Themes",
    "Hide Blue Tick",
    "Hide Last Seen",
    "Send 100+ Images",
    "Anti Delete Messages"
  ],
  "imageUrl": "https://i.ibb.co/example3.png",
  "screenshots": [
    "https://i.ibb.co/example3-1.png",
    "https://i.ibb.co/example3-2.png"
  ],
  "downloadUrl": "https://example.com/download/whatsapp-plus.apk",
  "developer": "WhatsApp Inc. (Modified)",
  "packageName": "com.whatsapp.mod",
  "minAndroid": "4.4",
  "featured": false,
  "trending": true,
  "createdAt": "2024-01-13T09:10:00Z",
  "updatedAt": "2024-01-13T09:10:00Z"
}
```

---

## 🎮 **Sample Data: GAMES Collection**

### **Document 1: PUBG Mobile MOD**
```json
{
  "id": "pubg-mobile-mod",
  "title": "PUBG Mobile MOD",
  "description": "Battle Royale game with unlimited UC, skins unlocked, and anti-ban protection. 100 players drop on an island.",
  "category": "Action",
  "subcategory": "Battle Royale",
  "version": "2.9.0",
  "size": "896MB",
  "rating": 4.6,
  "downloads": 234560,
  "modType": "MOD",
  "modFeatures": [
    "Unlimited UC",
    "All Skins Unlocked",
    "Aimbot",
    "ESP Hack",
    "Anti Ban"
  ],
  "imageUrl": "https://i.ibb.co/example4.png",
  "screenshots": [
    "https://i.ibb.co/example4-1.png",
    "https://i.ibb.co/example4-2.png",
    "https://i.ibb.co/example4-3.png"
  ],
  "downloadUrl": "https://example.com/download/pubg-mod.apk",
  "developer": "Tencent Games (Modified)",
  "packageName": "com.tencent.ig.mod",
  "minAndroid": "5.1",
  "featured": true,
  "trending": true,
  "createdAt": "2024-01-12T14:30:00Z",
  "updatedAt": "2024-01-12T14:30:00Z"
}
```

### **Document 2: Minecraft PE MOD**
```json
{
  "id": "minecraft-pe-mod",
  "title": "Minecraft PE Premium",
  "description": "Sandbox game with unlimited resources, all items unlocked, and premium features. Build anything you imagine.",
  "category": "Adventure",
  "subcategory": "Sandbox",
  "version": "1.20.50",
  "size": "145MB",
  "rating": 4.9,
  "downloads": 456780,
  "modType": "MOD",
  "modFeatures": [
    "Premium Unlocked",
    "Unlimited Resources",
    "All Skins",
    "All Textures",
    "Multiplayer Support"
  ],
  "imageUrl": "https://i.ibb.co/example5.png",
  "screenshots": [
    "https://i.ibb.co/example5-1.png",
    "https://i.ibb.co/example5-2.png"
  ],
  "downloadUrl": "https://example.com/download/minecraft-mod.apk",
  "developer": "Mojang (Modified)",
  "packageName": "com.mojang.minecraftpe.mod",
  "minAndroid": "5.0",
  "featured": true,
  "trending": false,
  "createdAt": "2024-01-11T11:45:00Z",
  "updatedAt": "2024-01-11T11:45:00Z"
}
```

---

## 🔧 **Sample Data: TOOLS Collection**

### **Document 1: Lucky Patcher**
```json
{
  "id": "lucky-patcher-mod",
  "title": "Lucky Patcher Pro",
  "description": "Patch Android apps, remove ads, modify permissions, and bypass license verification. Advanced patching tool.",
  "category": "Utility",
  "subcategory": "Tools",
  "version": "10.5.8",
  "size": "12MB",
  "rating": 4.7,
  "downloads": 678920,
  "modType": "PRO",
  "modFeatures": [
    "Remove Ads",
    "Bypass License",
    "Modify Permissions",
    "Custom Patches",
    "Backup APK"
  ],
  "imageUrl": "https://i.ibb.co/example6.png",
  "screenshots": [
    "https://i.ibb.co/example6-1.png",
    "https://i.ibb.co/example6-2.png"
  ],
  "downloadUrl": "https://example.com/download/lucky-patcher.apk",
  "developer": "ChelpuS",
  "packageName": "com.chelpus.luckypatcher",
  "minAndroid": "4.0",
  "featured": false,
  "trending": true,
  "createdAt": "2024-01-10T08:20:00Z",
  "updatedAt": "2024-01-10T08:20:00Z"
}
```

### **Document 2: APK Editor Pro**
```json
{
  "id": "apk-editor-pro",
  "title": "APK Editor Pro",
  "description": "Edit APK files directly on your device. Change app name, icon, permissions, and resources. Professional APK editor.",
  "category": "Utility",
  "subcategory": "Developer Tools",
  "version": "2.1.8",
  "size": "18MB",
  "rating": 4.5,
  "downloads": 345120,
  "modType": "PRO",
  "modFeatures": [
    "Edit APK Resources",
    "Change App Icon",
    "Modify Manifest",
    "Sign APK",
    "Extract Resources"
  ],
  "imageUrl": "https://i.ibb.co/example7.png",
  "screenshots": [
    "https://i.ibb.co/example7-1.png"
  ],
  "downloadUrl": "https://example.com/download/apk-editor-pro.apk",
  "developer": "SteelWorks",
  "packageName": "com.gmail.heagoo.apkeditor.pro",
  "minAndroid": "4.4",
  "featured": false,
  "trending": false,
  "createdAt": "2024-01-09T16:55:00Z",
  "updatedAt": "2024-01-09T16:55:00Z"
}
```

---

## 📋 **Field Explanations**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (slug format) |
| `title` | string | App/Game name |
| `description` | string | Full description (100-200 chars) |
| `category` | string | Main category |
| `subcategory` | string | Sub category |
| `version` | string | Version number |
| `size` | string | File size (MB/GB) |
| `rating` | number | Rating 1-5 (decimal) |
| `downloads` | number | Total downloads count |
| `modType` | string | "MOD", "PRO", "LITE", "PREMIUM" |
| `modFeatures` | array | List of modded features |
| `imageUrl` | string | Main app icon URL |
| `screenshots` | array | Array of screenshot URLs |
| `downloadUrl` | string | APK download link |
| `developer` | string | Developer name |
| `packageName` | string | Android package name |
| `minAndroid` | string | Minimum Android version |
| `featured` | boolean | Show in featured section |
| `trending` | boolean | Show in trending section |
| `createdAt` | string | ISO date string |
| `updatedAt` | string | ISO date string |

---

## 🖼️ **How to Upload Images to ImgBB**

### **Step 1: Sign Up**
```
https://imgbb.com
```

### **Step 2: Upload Image**
1. Klik **"Start uploading"**
2. Drag & drop image atau browse file
3. Tunggu upload selesai
4. Copy **"Direct link"** URL

### **Step 3: Use in Firestore**
Paste URL ke field `imageUrl` atau dalam array `screenshots`

**Recommended Image Sizes:**
- App Icon: 512x512px (square)
- Screenshots: 1080x1920px (portrait) or 1920x1080px (landscape)
- Format: PNG or JPG
- Max size: 5MB per image

---

## 🔄 **Auto-populate with JavaScript (Advanced)**

Jika ingin upload banyak data sekaligus, bisa menggunakan script ini di browser console (F12) saat buka website:

```javascript
// Import Firebase modules
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './config/firebaseConfig.js';

// Sample data
const sampleApps = [
  { /* data dari atas */ },
  { /* data dari atas */ },
  // ... dst
];

// Upload to Firestore
async function uploadSampleData() {
  for (const app of sampleApps) {
    try {
      await addDoc(collection(db, "apps"), app);
      console.log("✅ Uploaded:", app.title);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }
}

uploadSampleData();
```

---

## ✅ **Verification**

Setelah upload data, verifikasi di:
1. Firebase Console → Firestore Database
2. Website → Apps/Games/Tools page
3. Check apakah cards tampil dengan benar

---

## 📝 **Notes**

- Untuk production, gunakan real download links
- Upload real app icons & screenshots
- Update version numbers secara berkala
- Monitor download counts via Firebase Analytics
- Backup Firestore data secara rutin

**Happy uploading! 🎉**
