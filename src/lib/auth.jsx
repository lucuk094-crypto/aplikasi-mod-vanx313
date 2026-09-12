import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from './supabase.js';
import { ADMIN_EMAILS } from '../config.js';

function friendly(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Email sudah terdaftar. Silakan masuk.';
  if (m.includes('invalid login credentials'))
    return 'Email atau password salah.';
  if (m.includes('email not confirmed'))
    return 'Email belum diverifikasi. Cek inbox lalu masuk lagi.';
  if (m.includes('password should be') || m.includes('weak password'))
    return 'Password minimal 6 karakter.';
  if (m.includes('invalid email') || m.includes('invalid-email'))
    return 'Format email tidak valid.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Terlalu banyak percobaan. Coba lagi nanti.';
  if (m.includes('user not found'))
    return 'Email atau password salah.';
  if (m.includes('fetch') || m.includes('network'))
    return 'Tidak ada koneksi internet.';
  return `Gagal: ${msg || 'unknown'}`;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sbUser, setSbUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [init, setInit] = useState(true);

  const loadProfile = useCallback(async (id) => {
    if (!id) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('display_name, is_admin')
      .eq('id', id)
      .maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const u = data?.session?.user || null;
      setSbUser(u);
      setInit(false);
      loadProfile(u?.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!alive) return;
      const u = session?.user || null;
      setSbUser(u);
      setInit(false);
      loadProfile(u?.id);
    });
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(() => {
    const email = sbUser?.email || '';
    const metaName = sbUser?.user_metadata?.display_name || '';
    const displayName =
      profile?.display_name ||
      metaName ||
      (email ? email.split('@')[0] : '');
    // Bentuk user dinormalisasi mirip Firebase agar semua halaman tetap jalan.
    const user = sbUser
      ? { uid: sbUser.id, email, displayName }
      : null;
    const emailLower = email.toLowerCase();
    const isAdmin =
      !!profile?.is_admin ||
      (!!emailLower &&
        ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(emailLower));
    return {
      user,
      init,
      authLoading: init,
      isAuthed: !!sbUser,
      isAdmin,
      displayName,
      async signIn(emailArg, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailArg.trim(),
          password,
        });
        if (error) return { ok: false, error: friendly(error.message) };
        return { ok: true };
      },
      async signUp(name, emailArg, password) {
        const { data, error } = await supabase.auth.signUp({
          email: emailArg.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) return { ok: false, error: friendly(error.message) };
        if (!data?.session) {
          return {
            ok: false,
            error: 'Cek email untuk verifikasi, lalu masuk.',
          };
        }
        return { ok: true };
      },
      async reset(emailArg) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          emailArg.trim()
        );
        if (error) return { ok: false, error: friendly(error.message) };
        return { ok: true };
      },
      async updateName(name) {
        const v = (name || '').trim().slice(0, 40);
        if (!v) return { ok: false, error: 'Nama kosong.' };
        const { error } = await supabase.auth.updateUser({
          data: { display_name: v },
        });
        if (error) return { ok: false, error: friendly(error.message) };
        if (sbUser) {
          await supabase
            .from('profiles')
            .update({ display_name: v })
            .eq('id', sbUser.id);
          loadProfile(sbUser.id);
        }
        return { ok: true };
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { ok: false, error: friendly(error.message) };
        return { ok: true };
      },
      async signOut() {
        await supabase.auth.signOut();
        setProfile(null);
      },
    };
  }, [sbUser, profile, init, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}
