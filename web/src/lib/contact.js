import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

// Kirim pesan kontak (rules: publik boleh create).
export async function sendMessage({ name, email, message }) {
  await addDoc(collection(db, 'contacts'), {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    read: false,
    createdAt: serverTimestamp(),
  });
}

// Baca semua pesan (admin, login wajib).
export async function fetchContacts() {
  const snap = await getDocs(
    query(collection(db, 'contacts'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markContactRead(id, read = true) {
  await updateDoc(doc(db, 'contacts', id), { read });
}

export async function deleteContact(id) {
  await deleteDoc(doc(db, 'contacts', id));
}
