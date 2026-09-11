import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { COLLECTION_LABELS } from '../config.js';
import { useAuth } from '../lib/auth.jsx';
import { useStore } from '../lib/store.jsx';
import { compact } from '../lib/format.js';
import {
  Edit2,
  LayoutGrid,
  LogOut,
  Plus,
  Trash2,
} from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  Kicker,
  NetworkIcon,
  SkeletonList,
} from '../components/ui.jsx';

export default function Dashboard() {
  const { isAdmin, authLoading, signOut } = useAuth();
  const { all, items, loading, error, refresh, removeItem } = useStore();
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [toast, setToast] = useState('');

  const totalDl = useMemo(
    () => all.reduce((s, it) => s + (it.downloads || 0), 0),
    [all]
  );

  const rows = useMemo(() => {
    let list = [...all];
    if (filter) list = list.filter((it) => it.collection === filter);
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (it) =>
          it.name.toLowerCase().includes(s) ||
          (it.category || '').toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => b.downloads - a.downloads);
  }, [all, filter, q]);

  if (authLoading) return <SkeletonList count={4} />;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  async function del(item) {
    if (!window.confirm(`Hapus "${item.name}" permanen?`)) return;
    setBusyKey(item.key);
    const r = await removeItem(item.collection, item.id);
    setBusyKey('');
    setToast(r.ok ? 'Item dihapus.' : r.error || 'Gagal menghapus.');
    setTimeout(() => setToast(''), 2200);
  }

  return (
    <>
      <div style={{ paddingTop: 26, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Kicker>// CONTROL PANEL</Kicker>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
            Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-lime btn-sm" to="/admin/new">
            <Plus size={16} /> Tambah Mod
          </Link>
          <button
            className="btn btn-line btn-sm"
            onClick={() => {
              signOut();
            }}
          >
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="neo stat-card">
          <div className="sv lime">{all.length}</div>
          <div className="sl">Total Item</div>
        </div>
        <div className="neo stat-card">
          <div className="sv">{items.apps.length}</div>
          <div className="sl">Aplikasi</div>
        </div>
        <div className="neo stat-card">
          <div className="sv">{items.games.length}</div>
          <div className="sl">Game</div>
        </div>
        <div className="neo stat-card">
          <div className="sv">{items.tools.length}</div>
          <div className="sl">Tools</div>
        </div>
        <div className="neo stat-card">
          <div className="sv lime">{compact(totalDl)}</div>
          <div className="sl">Total Unduhan</div>
        </div>
      </div>

      <div className="searchbar" style={{ marginTop: 4 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari item…"
        />
      </div>
      <div className="chips" style={{ marginTop: 14 }}>
        <button className={filter === '' ? 'chip on' : 'chip'} onClick={() => setFilter('')}>
          Semua
        </button>
        {Object.entries(COLLECTION_LABELS).map(([col, label]) => (
          <button
            key={col}
            className={filter === col ? 'chip on' : 'chip'}
            onClick={() => setFilter(col)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && all.length === 0 ? (
          <SkeletonList count={6} />
        ) : error && all.length === 0 ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid size={34} />}
            title="Tidak ada item"
            subtitle="Tambah mod pertamamu."
          />
        ) : (
          <div className="list">
            {rows.map((it) => (
              <div key={it.key} className="neo admin-row">
                <NetworkIcon url={it.icon} size={46} />
                <div className="grow">
                  <div className="rc-name" style={{ marginTop: 0 }}>
                    {it.name}
                  </div>
                  <div className="rc-sub">
                    {COLLECTION_LABELS[it.collection]}
                    {it.category ? ` • ${it.category}` : ''}
                    {it.version ? ` • v${it.version}` : ''} •{' '}
                    {compact(it.downloads)} dl
                  </div>
                </div>
                <div className="admin-actions">
                  <Link
                    className="btn btn-line btn-sm"
                    to={`/admin/edit/${it.collection}/${it.id}`}
                  >
                    <Edit2 size={14} /> Edit
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busyKey === it.key}
                    onClick={() => del(it)}
                  >
                    {busyKey === it.key ? (
                      '…'
                    ) : (
                      <>
                        <Trash2 size={14} /> Hapus
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
