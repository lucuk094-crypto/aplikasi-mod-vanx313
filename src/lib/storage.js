import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from './firebase.js';

export const storage = getStorage(app);

// Upload dengan progress (0-100). Resolve = URL download publik.
export function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file);
    task.on(
      'state_changed',
      (snap) => {
        if (snap.totalBytes > 0) {
          onProgress?.(
            Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          );
        }
      },
      (err) => reject(err),
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

export function cleanName(name) {
  return String(name || 'file').replace(/[^\w.\-]+/g, '_');
}
