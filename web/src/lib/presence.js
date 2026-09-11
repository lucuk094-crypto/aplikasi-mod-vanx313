import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase.js';

const lastTouch = {};

function typingId(uid, threadId) {
  return threadId ? `dm_${threadId}_${uid}` : `forum_${uid}`;
}

// Catat "sedang mengetik" (di-throttle 3 detik biar hemat tulis).
export async function touchTyping(uid, name, threadId = null) {
  const id = typingId(uid, threadId);
  const now = Date.now();
  if (lastTouch[id] && now - lastTouch[id] < 3000) return;
  lastTouch[id] = now;
  try {
    await setDoc(doc(db, 'typing', id), {
      uid,
      name: (name || 'Anonim').slice(0, 40),
      scope: threadId || 'forum',
      updatedAt: serverTimestamp(),
    });
  } catch {
    // abaikan: indikator tidak kritis
  }
}

// Hapus status mengetik (habis kirim / keluar).
export async function clearTyping(uid, threadId = null) {
  const id = typingId(uid, threadId);
  delete lastTouch[id];
  try {
    await deleteDoc(doc(db, 'typing', id));
  } catch {
    // abaikan
  }
}

// Pantau siapa yang mengetik di forum (threadId null) atau thread DM.
// Hanya yang segar (<6 detik) yang dilaporkan.
export function watchTyping(threadId, cb) {
  const scope = threadId || 'forum';
  const q = query(
    collection(db, 'typing'),
    where('scope', '==', scope),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const list = [];
      snap.forEach((d) => {
        const m = d.data() || {};
        const t =
          m.updatedAt && typeof m.updatedAt.toDate === 'function'
            ? m.updatedAt.toDate().getTime()
            : 0;
        if (now - t < 6000) {
          list.push({ id: d.id, uid: m.uid, name: m.name || 'Anonim' });
        }
      });
      cb(list);
    },
    () => cb([])
  );
}
