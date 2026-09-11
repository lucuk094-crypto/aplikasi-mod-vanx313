import { useMemo, useState } from 'react';
import { COLLECTION_BADGES, PAGE_STEP } from '../config.js';
import { useStore } from '../lib/store.jsx';
import { ChevronDown, Zap } from '../components/icons.jsx';
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

function freshness(it) {
  const d = it.updatedAt || it.createdAt;
  if (!d) return null;
  const h = (Date.now() - new Date(d).getTime()) / 3600000;
  if (h < 24) return 'JUST IN';
  if (h < 24 * 7) return 'NEW';
  return null;
}

export default function Latest() {
  const { all, loading, error, refresh } = useStore();
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE_STEP);

  const feed = useMemo(() => {
    let list = [...all].sort(
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
        <Kicker>// FRESH DROPS</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          Latest
        </h1>
      </div>

      <div className="searchbar">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisible(PAGE_STEP);
          }}
          placeholder="Cari di Latest…"
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
          icon={<Zap size={34} />}
          title="Tidak ada hasil"
          subtitle="Coba kata kunci atau filter lain."
        />
      ) : (
        <>
          <div className="feed" style={{ marginTop: 14 }}>
            {shown.map((it) => {
              const fresh = freshness(it);
              return (
                <div key={it.key} style={{ position: 'relative' }}>
                  {fresh && (
                    <span className={`feed-badge ${fresh === 'JUST IN' ? 'hot' : ''}`}>
                      {fresh} • {COLLECTION_BADGES[it.collection]}
                    </span>
                  )}
                  <ItemCard item={it} />
                </div>
              );
            })}
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
