import { supabase } from './supabase.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || SUPABASE_ANON_KEY;
}

// Upload dengan progress (0-100) via XMLHttpRequest ke Supabase Storage.
// path = "bucket/nama-file" (mis. "apks/123-app.apk").
// Resolve = URL download publik.
export async function uploadFile(path, file, onProgress) {
  const i = path.indexOf('/');
  const bucket = i > 0 ? path.slice(0, i) : 'chat';
  const rest = i > 0 ? path.slice(i + 1) : path;
  const token = await accessToken();
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${rest}`;
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream'
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else if (xhr.status === 403 || xhr.status === 401) {
        reject(new Error('Izin ditolak. Pastikan kamu login sebagai admin.'));
      } else {
        reject(new Error(`Upload gagal (${xhr.status}). Coba lagi.`));
      }
    };
    xhr.onerror = () =>
      reject(new Error('Upload gagal. Periksa koneksi internetmu.'));
    xhr.send(file);
  });
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${rest}`;
}

export function cleanName(name) {
  return String(name || 'file').replace(/[^\w.\-]+/g, '_');
}
