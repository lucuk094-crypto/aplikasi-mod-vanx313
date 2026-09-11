import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanName, uploadFile } from './storage.js';

// Kirim pesan forum. user = Firebase Auth user (uid + email dicek rules).
export async function sendChatMessage({
  user,
  text = '',
  imageUrl = '',
  replyTo = null,
  forwarded = false,
  forwardedFrom = '',
}) {
  const clean = (text || '').trim().slice(0, 2000);
  if (!clean && !imageUrl) throw new Error('Pesan kosong.');
  await addDoc(collection(db, 'messages'), {
    text: clean,
    imageUrl: imageUrl || '',
    uid: user.uid,
    name: (user.displayName || 'Anonim').slice(0, 40),
    email: user.email || '',
    replyTo: replyTo
      ? {
          id: replyTo.id,
          name: (replyTo.name || 'Anonim').slice(0, 40),
          text: (replyTo.text || '').slice(0, 140),
          hasImage: !!replyTo.imageUrl,
        }
      : null,
    forwarded: !!forwarded,
    forwardedFrom: (forwardedFrom || '').slice(0, 40),
    createdAt: serverTimestamp(),
  });
}

// Hapus pesan (rules: pemilik pesan atau admin).
export async function deleteChatMessage(id) {
  await deleteDoc(doc(db, 'messages', id));
}

// Upload gambar chat ke Storage folder chat/ (maks 2MB, dicek rules).
export function uploadChatImage(file, onProgress) {
  return uploadFile(
    `chat/${Date.now()}-${cleanName(file.name)}`,
    file,
    onProgress
  );
}
