import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useStore } from '../lib/store.jsx';
import { timeAgo } from '../lib/format.js';
import { Check, LogOut, MessageCircle, User } from '../components/icons.jsx';
import { EmptyState, Kicker, Stars } from '../components/ui.jsx';

export default function Profil() {
  const {
    user,
    isAuthed,
    isAdmin,
    displayName,
    signOut,
    updateName,
    updatePassword,
  } = useAuth();
  const { all } = useStore();
  const navigate = useNavigate();

  const [localName, setLocalName] = useState(displayName);
  const [nameInput, setNameInput] = useState(displayName);
  const [newPass, setNewPass] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const shownName = localName || displayName;

  const mine = useMemo(() => {
    if (!displayName) return [];
    const out = [];
    for (const it of all) {
      for (const r of it.reviews || []) {
        if ((r.user || r.userName) === displayName) {
          out.push({ ...r, item: it });
        }
      }
    }
    return out.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [all, displayName]);

  if (!isAuthed) {
    return (
      <div style={{ textAlign: 'center', padding: '70px 20px' }}>
        <Kicker>// PROFIL</Kicker>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            margin: '10px 0 8px',
          }}
        >
          Kamu belum masuk
        </div>
        <div style={{ color: 'var(--muted)', marginBottom: 20 }}>
          Masuk dulu untuk melihat profilmu.
        </div>
        <button
          className="btn btn-lime"
          onClick={() =>
            window.dispatchEvent(new CustomEvent('vanmod:open-auth'))
          }
        >
          <User size={16} /> Masuk / Daftar
        </button>
      </div>
    );
  }

  async function saveName(e) {
    e.preventDefault();
    const v = nameInput.trim();
    if (!v || busy) return;
    setBusy('name');
    setErr('');
    setMsg('');
    try {
      const r = await updateName(v);
      if (!r.ok) throw new Error(r.error || 'Gagal mengubah nama. Coba lagi.');
      setLocalName(v);
      setMsg('Nama berhasil diubah.');
    } catch (e2) {
      setErr(e2.message || 'Gagal mengubah nama. Coba lagi.');
    } finally {
      setBusy('');
    }
  }

  async function savePass(e) {
    e.preventDefault();
    if (newPass.length < 6 || busy) return;
    setBusy('pass');
    setErr('');
    setMsg('');
    try {
      const r = await updatePassword(newPass);
      if (!r.ok)
        throw new Error(r.error || 'Gagal mengubah password. Coba lagi.');
      setNewPass('');
      setMsg('Password berhasil diubah.');
    } catch (e2) {
      setErr(
        e2.message === 'Sesi kedaluwarsa. Keluar lalu masuk lagi.'
          ? e2.message
          : e2.message || 'Gagal mengubah password. Coba lagi.'
      );
    } finally {
      setBusy('');
    }
  }

  async function logout() {
    await signOut();
    navigate('/');
  }

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>// AKUN SAYA</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          Profil
        </h1>
      </div>

      <div className="neo profile-head">
        <div className="profile-avatar">
          {(shownName || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-name">{shownName}</div>
          <div className="profile-mail">{user?.email}</div>
        </div>
        {isAdmin && <span className="badge fill">ADMIN</span>}
      </div>

      {msg && (
        <div className="form-ok" style={{ marginTop: 14 }}>
          <Check size={16} /> {msg}
        </div>
      )}
      {err && (
        <div className="form-error" style={{ marginTop: 14 }}>
          {err}
        </div>
      )}

      <div className="profile-grid">
        <div className="neo profile-card">
          <h3>Ubah Nama</h3>
          <form onSubmit={saveName} className="form">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nama tampilan"
              style={{
                background: 'var(--surface2)',
                border: '1.5px solid var(--line)',
                color: 'var(--text)',
                borderRadius: 11,
                padding: '13px 15px',
                fontSize: 14.5,
                fontFamily: 'inherit',
                width: '100%',
              }}
            />
            <button
              className="btn btn-lime btn-sm"
              disabled={busy === 'name' || !nameInput.trim()}
            >
              {busy === 'name' ? 'Menyimpan…' : 'Simpan Nama'}
            </button>
          </form>
        </div>

        <div className="neo profile-card">
          <h3>Ubah Password</h3>
          <form onSubmit={savePass} className="form">
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Password baru (min. 6)"
              autoComplete="new-password"
              style={{
                background: 'var(--surface2)',
                border: '1.5px solid var(--line)',
                color: 'var(--text)',
                borderRadius: 11,
                padding: '13px 15px',
                fontSize: 14.5,
                fontFamily: 'inherit',
                width: '100%',
              }}
            />
            <button
              className="btn btn-lime btn-sm"
              disabled={busy === 'pass' || newPass.length < 6}
            >
              {busy === 'pass' ? 'Menyimpan…' : 'Simpan Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="sec-head">
        <h2>Ulasan Saya ({mine.length})</h2>
      </div>
      {mine.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={34} />}
          title="Belum ada ulasan"
          subtitle="Ulasan yang kamu tulis akan terkumpul di sini."
        />
      ) : (
        <div className="list">
          {mine.map((r) => (
            <Link
              key={`${r.item.key}-${r.id}`}
              className="neo rowcard"
              to={`/detail/${r.item.collection}/${r.item.id}`}
            >
              <div className="rc-body">
                <div className="rc-name" style={{ marginTop: 0 }}>
                  {r.item.name}
                </div>
                <div className="rc-sub">
                  <Stars value={r.rating} size={12} />{' '}
                  <span className="dot">•</span> {timeAgo(r.createdAt)}
                </div>
                <div className="rc-meta" style={{ whiteSpace: 'normal' }}>
                  {r.comment}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="center">
        <button className="btn btn-danger" onClick={logout}>
          <LogOut size={16} /> Keluar Akun
        </button>
      </div>
    </>
  );
}
