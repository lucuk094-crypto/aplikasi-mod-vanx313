import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ADMIN_EMAILS } from '../config.js';
import { useAuth } from '../lib/auth.jsx';
import { Lock, Shield } from '../components/icons.jsx';
import { Kicker } from '../components/ui.jsx';

export default function AdminLogin() {
  const { signIn, signOut, isAdmin, authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await signIn(email, pass);
    if (!r.ok) {
      setBusy(false);
      setError(r.error);
      return;
    }
    if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
      await signOut();
      setBusy(false);
      setError('Akun ini bukan admin.');
      return;
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto' }}>
      <div style={{ paddingTop: 44, textAlign: 'center' }}>
        <div className="empty-icon" style={{ width: 64, height: 64 }}>
          <Shield size={30} />
        </div>
        <div style={{ marginTop: 18 }}>
          <Kicker>// RESTRICTED AREA</Kicker>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '8px 0 4px' }}>
          Admin
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Khusus pengelola VAN MOD. Pengunjung tidak bisa masuk dari sini.
        </p>
      </div>
      <form onSubmit={submit} className="form neo" style={{ padding: 22, marginTop: 18 }}>
        <label>
          Email admin
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vanxmod313@gmail.com"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-lime" disabled={busy}>
          <Lock size={16} /> {busy ? 'Memeriksa…' : 'Masuk Dashboard'}
        </button>
      </form>
    </div>
  );
}
