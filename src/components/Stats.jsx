import { Link } from 'react-router-dom';
import { COLLECTION_LABELS } from '../config.js';
import { compact, ratingFmt } from '../lib/format.js';

// Grafik CSS murni (tanpa library): unduhan per koleksi + top item.
export function StatsCharts({ all, items }) {
  const perCol = ['apps', 'games', 'tools'].map((c) => ({
    c,
    total: (items[c] || []).reduce((s, it) => s + (it.downloads || 0), 0),
    count: (items[c] || []).length,
  }));
  const maxCol = Math.max(1, ...perCol.map((p) => p.total));
  const top5 = [...all]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 5);
  const maxTop = Math.max(1, ...top5.map((it) => it.downloads || 0));
  const avgRating = all.length
    ? all.reduce((s, it) => s + (it.rating || 0), 0) / all.length
    : 0;
  const totalRev = all.reduce((s, it) => s + (it.reviews?.length || 0), 0);

  return (
    <>
      <div className="stat-grid">
        <div className="neo stat-card">
          <div className="sv lime">{ratingFmt(avgRating)}</div>
          <div className="sl">Rata-rata Rating</div>
        </div>
        <div className="neo stat-card">
          <div className="sv">{totalRev}</div>
          <div className="sl">Total Ulasan</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="neo chart-card">
          <div className="chart-title">Unduhan per Koleksi</div>
          {perCol.map((p) => (
            <div key={p.c} className="bar-row">
              <span className="bar-label">{COLLECTION_LABELS[p.c]}</span>
              <div className="bar-track">
                <i style={{ width: `${(p.total / maxCol) * 100}%` }} />
              </div>
              <span className="bar-val">
                {compact(p.total)} <small>({p.count})</small>
              </span>
            </div>
          ))}
        </div>

        <div className="neo chart-card">
          <div className="chart-title">Top 5 Terlaris</div>
          {top5.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>
              Belum ada data.
            </div>
          )}
          {top5.map((it, i) => (
            <Link
              key={it.key}
              className="bar-row link"
              to={`/detail/${it.collection}/${it.id}`}
            >
              <span className="bar-rank">{i + 1}</span>
              <span className="bar-label grow">{it.name}</span>
              <div className="bar-track slim">
                <i style={{ width: `${((it.downloads || 0) / maxTop) * 100}%` }} />
              </div>
              <span className="bar-val">{compact(it.downloads)}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
