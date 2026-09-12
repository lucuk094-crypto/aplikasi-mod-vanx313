import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { Search as SearchIcon } from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  ItemCard,
  Kicker,
  SkeletonList,
} from '../components/ui.jsx';

export default function Search() {
  const { search, loading, error, refresh, ready } = useStore();
  const [q, setQ] = useState('');

  const results = useMemo(
    () => (q.trim() ? search(q) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, ready]
  );

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>// TEMUKAN MOD</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          Cari
        </h1>
      </div>
      <div className="searchbar">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nama aplikasi, game, kategori, tag…"
        />
      </div>
      <div style={{ marginTop: 18 }}>
        {loading ? (
          <SkeletonList count={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : !q.trim() ? (
          <EmptyState
            icon={<SearchIcon size={34} />}
            title="Mau cari apa?"
            subtitle="Ketik nama aplikasi, game, kategori, atau tag."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={34} />}
            title={`Tidak ada hasil untuk "${q.trim()}"`}
            subtitle="Coba kata kunci lain."
          />
        ) : (
          <>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
              {results.length} hasil untuk “{q.trim()}”
            </div>
            <div className="list">
              {results.map((it) => (
                <ItemCard key={it.key} item={it} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
