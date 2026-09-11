// Konfigurasi global VAN MOD Store (Web).
// Backend Firebase SAMA dengan aplikasi mobile & website lama.

export const firebaseConfig = {
  apiKey: 'AIzaSyB1ccnYtBwYYELE_JYr3AlSVzYf3KRxPU0',
  authDomain: 'vanmod-website.firebaseapp.com',
  projectId: 'vanmod-website',
  storageBucket: 'vanmod-website.firebasestorage.app',
  messagingSenderId: '706013336903',
  appId: '1:706013336903:web:70053ec43cf8a8c03c6862',
  measurementId: 'G-LWKVY3WQK2',
};

// PENTING: daftarkan email admin di sini untuk membuka Admin Panel.
// 1. Buat user di Firebase Console → Authentication → Add user.
// 2. Masukkan emailnya ke daftar ini. Selesai.
export const ADMIN_EMAILS = ['vanxmod313@gmail.com'];

export const COLLECTIONS = ['apps', 'games', 'tools'];

export const COLLECTION_LABELS = {
  apps: 'Aplikasi',
  games: 'Game',
  tools: 'Tools',
};

export const COLLECTION_BADGES = {
  apps: 'APP',
  games: 'GAME',
  tools: 'TOOL',
};

export const MAX_DOCS = 200;
export const PAGE_STEP = 12;
