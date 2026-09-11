import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { COLLECTIONS } from '../config.js';
import { useStore } from '../lib/store.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useWishlist } from '../lib/wishlist.jsx';
import { compact, dateFmt, ratingFmt, timeAgo } from '../lib/format.js';
import {
  ArrowLeft,
  Check,
  Download,
  Heart,
  MessageCircle,
  Share2,
  Star,
  X,
} from '../components/icons.jsx';
import {
  Badge,
  EmptyState,
  InfoRow,
  ItemGridCard,
  Kicker,
  NetworkIcon,
  SectionHeader,
  SkeletonList,
  Stars,
} from '../components/ui.jsx';

export function openAuthModal() {
  window.dispatchEvent(new CustomEvent('vanmod:open-auth'));
}

export default function Detail() {
  const { collection, id } = useParams();
  const {
    findByKey,
    reviews,
    addReview,
    bumpDownloads,
    similar,
    ready,
  } = useStore();
  const { isAuthed, displayName } = useAuth();
  const { has, toggle } = useWishlist();

  const [dlState, setDlState] = useState('idle'); // idle | working | done
  const [lightbox, setLightbox] = useState(-1);
  const [toast, setToast] = useState('');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [revBusy, setRevBusy] = useState(false);

  const valid = COLLECTIONS.includes(collection);
  const key = `${collection}/${id}`;
  const item = valid ? findByKey(key) : null;
  const saved = has(key);
  const revs = reviews(key);
  const related = item ? similar(item) : [];
  const updated = item && (item.updatedAt || item.createdAt);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link disalin ke clipboard.');
    } catch {
      showToast('Gagal menyalin link.');
    }
  }

  async function startDownload() {
    if (dlState !== 'idle' || !item) return;
    if (!item.file) {
      showToast('File belum tersedia.');
      return;
    }
    setDlState('working');
    try {
      await bumpDownloads(item);
    } catch {
      /* counter best-effort */
    }
    const a = document.createElement('a');
    a.href = item.file;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDlState('done');
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!comment.trim() || revBusy) return;
    setRevBusy(true);
    const r = await addReview(item, {
      user: displayName,
      rating: stars,
      comment: comment.trim(),
    });
    setRevBusy(false);
    if (r.ok) {
      setComment('');
      setStars(5);
      showToast('Ulasan terkirim. Terima kasih!');
    } else {
      showToast(r.error || 'Gagal mengirim ulasan.');
    }
  }

  useEffect(() => {
    if (lightbox < 0) return;
    const close = (e) => {
      if (e.key === 'Escape') setLightbox(-1);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [lightbox]);

  if (!valid) return <Navigate to="/404" replace />;
  if (!ready) {
    return (
      <>
        <div style={{ paddingTop: 26 }} />
        <SkeletonList count={4} />
      </>
    );
  }
  if (!item) return <Navigate to="/404" replace />;

  const shots = item.screenshots || [];

  return (
    <>
      <div className="d-head">
        <NetworkIcon url={item.icon} size={96} />
        <div style={{ minWidth: 0 }}>
          <div>
            <Badge fill>{collection}</Badge>{' '}
            {item.modType && <Badge>{item.modType}</Badge>}
          </div>
          <div className="d-name">{item.name}</div>
          <div className="d-dev">
            {item.developer}
            {item.developer && (item.category || item.version) ? '  •  ' : ''}
            {[item.category, item.version ? `v${item.version}` : ''].filter(Boolean).join('  •  ')}
          </div>
        </div>
        <div className="d-actions-top">
          <button className="icon-btn" title="Bagikan" aria-label="Bagikan" onClick={share}>
            <Share2 size={18} />
          </button>
          <button
            className="icon-btn"
            title="Wishlist"
            aria-label="Wishlist"
            style={saved ? { color: 'var(--lime)' } : undefined}
            onClick={() => toggle(key)}
          >
            <Heart size={18} filled={saved} />
          </button>
        </div>
      </div>

      <div className="neo stats">
        <div className="stat">
          <div className="v amber">
            <Star size={17} filled /> {ratingFmt(item.rating)}
          </div>
          <div className="l">{revs.length} ulasan</div>
        </div>
        <div className="stat">
          <div className="v">{compact(item.downloads)}</div>
          <div className="l">Unduhan</div>
        </div>
        <div className="stat">
          <div className="v">{item.size || '-'}</div>
          <div className="l">Ukuran</div>
        </div>
        <div className="stat">
          <div className="v">{timeAgo(updated)}</div>
          <div className="l">Update</div>
        </div>
      </div>

      <div className="d-actions">
        <button className="btn btn-lime" onClick={startDownload}>
          <Download size={17} /> Download{item.size ? ` (${item.size})` : ''}
        </button>
        <button className="btn btn-line" onClick={() => toggle(key)}>
          {saved ? (
            <>
              <Heart size={16} filled /> Tersimpan
            </>
          ) : (
            <>
              <Heart size={16} /> Wishlist
            </>
          )}
        </button>
      </div>

      {shots.length > 0 && (
        <>
          <SectionHeader title="Screenshot" />
          <div className="shots">
            {shots.map((s, i) => (
              <img
                key={i}
                src={s}
                alt=""
                loading="lazy"
                onClick={() => setLightbox(i)}
              />
            ))}
          </div>
        </>
      )}

      <SectionHeader title="Tentang" />
      <p className="about">{item.description || 'Belum ada deskripsi.'}</p>
      {item.tags.length > 0 && (
        <div className="tags">
          {item.tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}

      <SectionHeader title="Info" />
      <div className="neo info">
        <InfoRow label="Nama" value={item.name} />
        <InfoRow label="Versi" value={item.version ? `v${item.version}` : ''} />
        <InfoRow label="Kategori" value={item.category} />
        <InfoRow label="Ukuran" value={item.size} />
        <InfoRow label="Developer" value={item.developer} />
        <InfoRow label="Android min." value={item.minAndroid} />
        <InfoRow label="Tanggal rilis" value={dateFmt(item.createdAt)} />
        <InfoRow label="Update terakhir" value={dateFmt(updated)} />
        <InfoRow
          label="Unduhan"
          value={item.downloads ? compact(item.downloads) : ''}
        />
      </div>

      <SectionHeader title={`Ulasan (${revs.length})`} />
      <div className="rev-sum">
        <div className="rev-big">{ratingFmt(item.rating)}</div>
        <div>
          <Stars value={item.rating} size={18} />
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            {revs.length} ulasan pengguna
          </div>
        </div>
      </div>

      {revs.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={34} />}
          title="Belum ada ulasan"
          subtitle="Jadilah yang pertama mengulas."
        />
      ) : (
        <div style={{ marginTop: 6 }}>
          {revs.map((r) => (
            <div className="rev" key={r.id}>
              <div className="avatar">
                {(r.user || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="rn">{r.user || 'Anonim'}</div>
                <div className="rt">
                  <Stars value={r.rating} size={12} /> •{' '}
                  {timeAgo(r.createdAt)}
                </div>
                <div className="rc">{r.comment}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="neo review-form">
        {isAuthed ? (
          <form onSubmit={submitReview} className="form">
            <Kicker>// TULIS ULASAN</Kicker>
            <div className="star-input">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= stars ? 'on' : ''}
                  onClick={() => setStars(n)}
                  aria-label={`${n} bintang`}
                >
                  <Star size={30} filled={n <= stars} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagaimana pengalamanmu memakai mod ini?"
              rows={3}
            />
            <button className="btn btn-lime" disabled={revBusy || !comment.trim()}>
              {revBusy ? 'Mengirim…' : 'Kirim Ulasan'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Kicker>// TULIS ULASAN</Kicker>
            <div style={{ margin: '10px 0 14px', color: 'var(--muted)' }}>
              Masuk dulu untuk menulis ulasan.
            </div>
            <button className="btn btn-lime btn-sm" onClick={openAuthModal}>
              Masuk / Daftar
            </button>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <>
          <SectionHeader title="Mungkin Kamu Suka" />
          <div className="grid3">
            {related.map((r) => (
              <ItemGridCard key={r.key} item={r} />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 26 }}>
        <Link className="link-btn" to={`/browse/${collection}`}>
          <ArrowLeft size={15} /> SEMUA {collection.toUpperCase()}
        </Link>
      </div>

      {dlState !== 'idle' && (
        <div className="overlay" onClick={() => dlState === 'done' && setDlState('idle')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>Download</span>
              <button className="icon-btn" onClick={() => setDlState('idle')} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            {dlState === 'working' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="skel shimmer" style={{ height: 10, borderRadius: 6 }} />
                <div style={{ marginTop: 14, color: 'var(--muted)' }}>
                  Menyiapkan unduhan…
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div className="empty-icon" style={{ width: 64, height: 64 }}>
                  <Check size={30} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 14 }}>{item.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 16px' }}>
                  Tab unduhan dibuka di tab baru. Install file APK-nya, lalu
                  nikmati mod-nya.
                </div>
                <button className="btn btn-lime btn-block" onClick={() => setDlState('idle')}>
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {lightbox >= 0 && (
        <div className="lightbox" onClick={() => setLightbox(-1)}>
          <img src={shots[lightbox]} alt="" />
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
