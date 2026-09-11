import { useMemo, useState } from 'react';
import { COLLECTION_BADGES, PAGE_STEP } from '../config.js';
import { useStore } from '../lib/store.jsx';
import { ChevronDown, Globe } from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  ItemCard,
  Kicker,
  SkeletonList,
} from '../components/ui.jsx';

const FILTERS = [
  { id: '', label: 'Semua' },
  { id: 'apps', label: 'Aplikasi' },
  { id: 'games', label: 'Game' },
  { id: 'tools', label: 'Tools' },
];

function isStream(it) {
  return (it.category || '').toLowerCase().includes('stream');
}

export default function Stream() {
  const { all, loading, error, refresh } = useStore();
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE_STEP);

  const feed = useMemo(() => {
    let list = all
      .filter(isStream)
      .sort(
        (a, b) =>
          (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
      );
    if (filter) list = list.filter((it) => it.collection === filter);
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (it) =>
          it.name.toLowerCase().includes(s) ||
          it.description.toLowerCase().includes(s) ||
          it.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    return list;
  }, [all, filter, q]);

  const shown = feed.slice(0, visible);

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>{'// LIVE & STREAMING'}</Kicker>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            marginTop: 8,
          }}
        >
          Stream
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          {feed.length} konten streaming — aplikasi live, player, dan tools
          siaran.
        </p>
      </div>

      <div className="searchbar">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisible(PAGE_STEP);
          }}
          placeholder="Cari di Stream…"
        />
      </div>

      <div className="chips sticky-chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? 'chip on' : 'chip'}
            onClick={() => {
              setFilter(f.id);
              setVisible(PAGE_STEP);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && all.length === 0 ? (
        <SkeletonList count={8} />
      ) : error && all.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Globe size={34} />}
          title="Belum ada konten Stream"
          subtitle='Tandai item sebagai "Stream" di kolom kategori lewat Editor admin.'
        />
      ) : (
        <>
          <div className="feed" style={{ marginTop: 14 }}>
            {shown.map((it) => (
              <div key={it.key} style={{ position: 'relative' }}>
                <span className="feed-badge hot">
                  STREAM • {COLLECTION_BADGES[it.collection]}
                </span>
                <ItemCard item={it} />
              </div>
            ))}
          </div>
          {visible < feed.length && (
            <div className="center">
              <button
                className="btn btn-line"
                onClick={() => setVisible((v) => v + PAGE_STEP)}
              >
                Muat Lebih Banyak <ChevronDown size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
