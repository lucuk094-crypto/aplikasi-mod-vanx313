import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { cleanName, uploadFile } from './storage.js';

// ID thread deterministik dari dua uid (urutan bebas, hasil sama).
export function threadIdFor(a, b) {
  return [a, b].sort().join('_');
}

function tsOf(v) {
  if (!v) return 0;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Daftar thread milik user (array-contains saja, tanpa orderBy
// agar tidak butuh composite index; urutan di-sort di klien).
export function watchThreads(uid, cb, onError) {
  const q = query(
    collection(db, 'dmThreads'),
    where('members', 'array-contains', uid),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => tsOf(b.updatedAt) - tsOf(a.updatedAt));
      cb(list);
    },
    onError || (() => {})
  );
}

// Pesan dalam satu thread (real-time).
export function watchThreadMessages(threadId, cb, onError) {
  const q = query(
    collection(db, 'dmThreads', threadId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => tsOf(a.createdAt) - tsOf(b.createdAt));
      cb(list);
    },
    onError || (() => {})
  );
}

// Kirim pesan DM + update ringkasan thread.
export async function sendDM({ threadId, user, peer, text = '', imageUrl = '' }) {
  const clean = (text || '').trim().slice(0, 2000);
  if (!clean && !imageUrl) throw new Error('Pesan kosong.');
  const members = [user.uid, peer.uid].sort();
  await addDoc(collection(db, 'dmThreads', threadId, 'messages'), {
    text: clean,
    imageUrl: imageUrl || '',
    uid: user.uid,
    name: (user.displayName || 'Anonim').slice(0, 40),
    email: user.email || '',
    members,
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, 'dmThreads', threadId),
    {
      members,
      names: {
        [user.uid]: (user.displayName || 'Anonim').slice(0, 40),
        [peer.uid]: (peer.name || 'Pengguna').slice(0, 40),
      },
      emails: {
        [user.uid]: user.email || '',
        [peer.uid]: peer.email || '',
      },
      lastText: (clean || '📷 Gambar').slice(0, 120),
      lastBy: user.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Hapus pesan DM milik sendiri.
export async function deleteDM(threadId, id) {
  await deleteDoc(doc(db, 'dmThreads', threadId, 'messages', id));
}

// Upload gambar DM (pakai folder chat/ yang sama dengan forum).
export function uploadDMImage(file, onProgress) {
  return uploadFile(
    `chat/${Date.now()}-${cleanName(file.name)}`,
    file,
    onProgress
  );
}
