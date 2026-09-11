import { useStore } from '../lib/store.jsx';
import { useWishlist } from '../lib/wishlist.jsx';
import { Heart } from '../components/icons.jsx';
import { EmptyState, ItemCard, Kicker } from '../components/ui.jsx';

export default function Wishlist() {
  const { findByKey } = useStore();
  const { keys } = useWishlist();
  const items = keys.map(findByKey).filter(Boolean);

  return (
    <>
      <div style={{ paddingTop: 24 }}>
        <Kicker>// SIMPANAN</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginTop: 6 }}>
          Wishlist ({items.length})
        </h1>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} />}
          title="Wishlist kosong"
          subtitle="Ketuk ikon bookmark di halaman detail untuk menyimpan."
        />
      ) : (
        <div className="list" style={{ marginTop: 16 }}>
          {items.map((it) => (
            <ItemCard key={it.key} item={it} />
          ))}
        </div>
      )}
    </>
  );
}
