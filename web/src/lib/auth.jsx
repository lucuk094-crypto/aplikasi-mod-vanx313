import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase.js';
import { ADMIN_EMAILS } from '../config.js';

function friendly(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan masuk.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/weak-password':
      return 'Password minimal 6 karakter.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email atau password salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti.';
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet.';
    default:
      return `Gagal: ${code || 'unknown'}`;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [init, setInit] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInit(false);
    });
  }, []);

  const value = useMemo(() => {
    const email = (user?.email || '').toLowerCase();
    const isAdmin =
      !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email);
    return {
      user,
      init,
      isAuthed: !!user,
      isAdmin,
      displayName: user?.displayName || (user?.email ? user.email.split('@')[0] : ''),
      async signIn(emailArg, password) {
        try {
          await signInWithEmailAndPassword(auth, emailArg.trim(), password);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: friendly(e.code) };
        }
      },
      async signUp(name, emailArg, password) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            emailArg.trim(),
            password
          );
          try {
            await updateProfile(cred.user, { displayName: name.trim() });
          } catch {
            // abaikan
          }
          return { ok: true };
        } catch (e) {
          return { ok: false, error: friendly(e.code) };
        }
      },
      async reset(emailArg) {
        try {
          await sendPasswordResetEmail(auth, emailArg.trim());
          return { ok: true };
        } catch (e) {
          return { ok: false, error: friendly(e.code) };
        }
      },
      async signOut() {
        await signOut(auth);
      },
    };
  }, [user, init]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
