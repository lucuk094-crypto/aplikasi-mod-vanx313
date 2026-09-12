import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { COLLECTIONS, COLLECTION_LABELS, PAGE_STEP } from '../config.js';
import { useStore } from '../lib/store.jsx';
import { ChevronDown, LayoutGrid, List } from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  ItemCard,
  ItemGridCard,
  Kicker,
  SkeletonList,
} from '../components/ui.jsx';

const SORTS = [
  { id: 'popular', label: 'Terpopuler' },
  { id: 'newest', label: 'Terbaru' },
  { id: 'rating', label: 'Rating Tertinggi' },
];

function sortDate(it) {
  return it.updatedAt || it.createdAt || new Date(0);
}

export default function Browse() {
  const { collection } = useParams();
  const { items, categories, loading, error, refresh } = useStore();
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('popular');
  const [grid, setGrid] = useState(false);
  const [visible, setVisible] = useState(PAGE_STEP);

  if (!COLLECTIONS.includes(collection)) {
    return <Navigate to="/" replace />;
  }

  const cats = categories(collection);
  const filtered = useMemo(() => {
    let list = [...(items[collection] || [])];
    if (cat) list = list.filter((it) => it.category === cat);
    if (sort === 'popular') list.sort((a, b) => b.downloads - a.downloads);
    else if (sort === 'newest') list.sort((a, b) => sortDate(b) - sortDate(a));
    else list.sort((a, b) => b.rating - a.rating);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, collection, cat, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>// KATALOG</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          {COLLECTION_LABELS[collection]}
        </h1>
      </div>

      {loading && items[collection].length === 0 ? (
        <SkeletonList count={8} />
      ) : error && items[collection].length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          <nav className="catnav" aria-label="Navigasi kategori">
            <span className="catnav-label">KATEGORI</span>
            <div className="catnav-items">
              <button
                className={cat === '' ? 'catnav-item on' : 'catnav-item'}
                onClick={() => {
                  setCat('');
                  setVisible(PAGE_STEP);
                }}
              >
                Semua
              </button>
              {cats.map((c) => (
                <button
                  key={c}
                  className={cat === c ? 'catnav-item on' : 'catnav-item'}
                  onClick={() => {
                    setCat(c);
                    setVisible(PAGE_STEP);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </nav>

          <div className="toolbar">
            <span className="count">
              Menampilkan {shown.length} dari {filtered.length}
            </span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button
                className={grid ? 'chip' : 'chip on'}
                onClick={() => setGrid(false)}
                title="Tampilan list"
                aria-label="Tampilan list"
              >
                <List size={16} />
              </button>
              <button
                className={grid ? 'chip on' : 'chip'}
                onClick={() => setGrid(true)}
                title="Tampilan grid"
                aria-label="Tampilan grid"
              >
                <LayoutGrid size={16} />
              </button>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </span>
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={<LayoutGrid size={34} />}
              title="Tidak ada item"
              subtitle="Coba kategori atau sortir lain."
            />
          ) : grid ? (
            <div className="grid3">
              {shown.map((it) => (
                <ItemGridCard key={it.key} item={it} />
              ))}
            </div>
          ) : (
            <div className="list">
              {shown.map((it) => (
                <ItemCard key={it.key} item={it} />
              ))}
            </div>
          )}

          {visible < filtered.length && (
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
