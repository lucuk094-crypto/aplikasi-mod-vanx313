import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_STEP } from '../config.js';
import { useStore } from '../lib/store.jsx';
import { compact } from '../lib/format.js';
import { Award, ChevronDown, ChevronRight } from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  Kicker,
  NetworkIcon,
  Rating,
  SkeletonList,
} from '../components/ui.jsx';

export default function Popular() {
  const { charts, loading, error, refresh } = useStore();
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE_STEP);

  const ranked = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return charts;
    return charts.filter(
      (it) =>
        it.name.toLowerCase().includes(s) ||
        it.description.toLowerCase().includes(s) ||
        it.category.toLowerCase().includes(s)
    );
  }, [charts, q]);

  const [hero, ...rest] = ranked;
  const shown = rest.slice(0, visible);

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>// LEADERBOARD</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          Popular
        </h1>
      </div>

      <div className="searchbar sticky-chips">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisible(PAGE_STEP);
          }}
          placeholder="Cari di Popular…"
        />
      </div>

      {loading && charts.length === 0 ? (
        <SkeletonList count={8} />
      ) : error && charts.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : ranked.length === 0 ? (
        <EmptyState
          icon={<Award size={34} />}
          title="Tidak ada hasil"
          subtitle="Coba kata kunci lain."
        />
      ) : (
        <>
          {hero && (
            <Link
              className="neo feat-main"
              style={{ marginTop: 18, display: 'flex' }}
              to={`/detail/${hero.collection}/${hero.id}`}
            >
              <div className="rank-num" style={{ fontSize: 46 }}>
                1
              </div>
              <NetworkIcon url={hero.icon} size={88} />
              <div>
                <Kicker>#1 DOWNLOADED</Kicker>
                <div className="feat-name">{hero.name}</div>
                <div className="feat-meta">
                  <Rating value={hero.rating} size={14} />
                  <span className="dot">•</span> {compact(hero.downloads)} unduhan
                </div>
              </div>
            </Link>
          )}
          <div className="feed" style={{ marginTop: 14 }}>
            {shown.map((it, i) => (
              <Link
                key={it.key}
                className="neo rowcard"
                to={`/detail/${it.collection}/${it.id}`}
              >
                <div className="rank-num" style={{ fontSize: 24, width: 44 }}>
                  {i + 2}
                </div>
                <NetworkIcon url={it.icon} size={52} />
                <div className="rc-body">
                  <div className="rc-name" style={{ marginTop: 0 }}>
                    {it.name}
                  </div>
                  <div className="rc-sub">
                    <Rating value={it.rating} /> <span className="dot">•</span>{' '}
                    {compact(it.downloads)} unduhan
                  </div>
                </div>
                <span className="chev">
                  <ChevronRight size={22} />
                </span>
              </Link>
            ))}
          </div>
          {visible < rest.length && (
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
