import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { ArrowLeft, Plus, Send, User, X } from './icons.jsx';

export default function AuthModal({ onClose }) {
  const { signIn, signUp, reset } = useAuth();
  const [tab, setTab] = useState('in'); // in | up | reset
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDone('');
    if (tab === 'in') {
      const r = await signIn(email, pass);
      setBusy(false);
      if (r.ok) onClose();
      else setError(r.error);
    } else if (tab === 'up') {
      if (!name.trim()) {
        setBusy(false);
        setError('Isi nama tampilan dulu.');
        return;
      }
      const r = await signUp(name, email, pass);
      setBusy(false);
      if (r.ok) onClose();
      else setError(r.error);
    } else {
      const r = await reset(email);
      setBusy(false);
      if (r.ok) setDone(`Link reset dikirim ke ${email.trim()}.`);
      else setError(r.error);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Akun VAN MOD</span>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="tabs">
          <button
            className={tab === 'in' ? 'on' : ''}
            onClick={() => {
              setTab('in');
              setError('');
            }}
          >
            MASUK
          </button>
          <button
            className={tab === 'up' ? 'on' : ''}
            onClick={() => {
              setTab('up');
              setError('');
            }}
          >
            DAFTAR
          </button>
        </div>
        <form onSubmit={submit} className="form">
          {tab === 'up' && (
            <label>
              Nama tampilan
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                autoComplete="nickname"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              autoComplete="email"
            />
          </label>
          {tab !== 'reset' && (
            <label>
              Password
              <input
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={tab === 'up' ? 'Min. 6 karakter' : 'Password'}
                autoComplete={tab === 'up' ? 'new-password' : 'current-password'}
              />
            </label>
          )}
          {error && <div className="form-error">{error}</div>}
          {done && <div className="form-ok">{done}</div>}
          <button className="btn btn-lime" disabled={busy}>
            {busy ? (
              'Memproses…'
            ) : tab === 'in' ? (
              <>
                <User size={16} /> Masuk
              </>
            ) : tab === 'up' ? (
              <>
                <Plus size={16} /> Daftar
              </>
            ) : (
              <>
                <Send size={16} /> Kirim Link Reset
              </>
            )}
          </button>
          {tab === 'in' && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setTab('reset');
                setError('');
              }}
            >
              LUPA PASSWORD?
            </button>
          )}
          {tab === 'reset' && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setTab('in');
                setError('');
              }}
            >
              <ArrowLeft size={15} /> KEMBALI MASUK
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
