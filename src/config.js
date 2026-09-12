// Konfigurasi global VAN MOD Store (Web). Backend: Supabase.

// Kunci ANON bersifat publik (aman di kode) — mirip Firebase apiKey.
export const SUPABASE_URL = 'https://ruynlsuntjjpbfyoexqx.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eW5sc3VudGpqcGJmeW9leHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjkzODYsImV4cCI6MjEwNDgwNTM4Nn0._Vwb1uS5JsmUyAOD8bOyWT5Et0jr9Osg9OSB0NVSkXY';

// Email admin cadangan (pengecekan utama via flag is_admin di tabel profiles).
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
