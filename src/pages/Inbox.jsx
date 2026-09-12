import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { timeAgo } from '../lib/format.js';
import {
  deleteContact,
  fetchContacts,
  markContactRead,
} from '../lib/contact.js';
import { Check, Mail, Trash2 } from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  Kicker,
  SkeletonList,
} from '../components/ui.jsx';

function dateOf(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  return v;
}

export default function Inbox() {
  const { isAdmin, authLoading } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMsgs(await fetchContacts());
    } catch (e) {
      setError(
        e?.code === 'permission-denied'
          ? 'Izin ditolak. Pastikan kamu login sebagai admin.'
          : 'Gagal memuat pesan.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) load();
  }, [authLoading, isAdmin, load]);

  if (authLoading) return <SkeletonList count={4} />;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  async function toggleRead(m) {
    setBusyId(m.id);
    try {
      await markContactRead(m.id, !m.read);
      setMsgs((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, read: !m.read } : x))
      );
    } catch {
      showToast('Gagal mengubah status.');
    } finally {
      setBusyId('');
    }
  }

  async function del(m) {
    if (!window.confirm(`Hapus pesan dari "${m.name}"?`)) return;
    setBusyId(m.id);
    try {
      await deleteContact(m.id);
      setMsgs((prev) => prev.filter((x) => x.id !== m.id));
      showToast('Pesan dihapus.');
    } catch {
      showToast('Gagal menghapus.');
    } finally {
      setBusyId('');
    }
  }

  const unread = msgs.filter((m) => !m.read).length;
  const shown = showUnreadOnly ? msgs.filter((m) => !m.read) : msgs;

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>// PESAN MASUK</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          Inbox {unread > 0 && <span className="lime">({unread} baru)</span>}
        </h1>
      </div>

      <div className="chips" style={{ marginTop: 14 }}>
        <button
          className={!showUnreadOnly ? 'chip on' : 'chip'}
          onClick={() => setShowUnreadOnly(false)}
        >
          Semua ({msgs.length})
        </button>
        <button
          className={showUnreadOnly ? 'chip on' : 'chip'}
          onClick={() => setShowUnreadOnly(true)}
        >
          Belum dibaca ({unread})
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <SkeletonList count={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<Mail size={34} />}
            title={showUnreadOnly ? 'Tidak ada pesan baru' : 'Inbox kosong'}
            subtitle="Pesan dari halaman Kontak akan muncul di sini."
          />
        ) : (
          <div className="list">
            {shown.map((m) => (
              <article
                key={m.id}
                className="neo"
                style={{
                  padding: 18,
                  opacity: m.read ? 0.75 : 1,
                  borderLeft: m.read ? undefined : '5px solid var(--lime)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{m.name || 'Tanpa nama'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                    {timeAgo(dateOf(m.createdAt))}
                  </div>
                </div>
                <a
                  href={`mailto:${m.email || ''}`}
                  style={{
                    color: 'var(--lime)',
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}
                >
                  {m.email || '-'}
                </a>
                <p style={{ marginTop: 10, lineHeight: 1.7, fontSize: 14.5 }}>
                  {m.message}
                </p>
                <div className="admin-actions" style={{ marginTop: 14 }}>
                  <button
                    className="btn btn-line btn-sm"
                    disabled={busyId === m.id}
                    onClick={() => toggleRead(m)}
                  >
                    <Check size={14} />{' '}
                    {m.read ? 'Tandai belum dibaca' : 'Tandai dibaca'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busyId === m.id}
                    onClick={() => del(m)}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
