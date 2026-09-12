import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COLLECTION_BADGES } from '../config.js';
import { compact, ratingFmt } from '../lib/format.js';
import {
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Star,
} from './icons.jsx';

export function Kicker({ children }) {
  return <div className="kicker">{children}</div>;
}

export function SectionHeader({ title, actionLabel, to }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {actionLabel && to && (
        <Link className="sec-more" to={to}>
          {actionLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

export function NetworkIcon({ url, size = 58 }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div
        className="appicon-fallback"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
      >
        V
      </div>
    );
  }
  return (
    <img
      className="appicon"
      src={url}
      alt=""
      loading="lazy"
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
    />
  );
}

export function Badge({ children, fill }) {
  return <span className={fill ? 'badge fill' : 'badge'}>{children}</span>;
}

export function Stars({ value, size = 15 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.round(v);
  return (
    <span className="stars" role="img" aria-label={`${ratingFmt(value)} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          filled={i <= full}
          className={i <= full ? '' : 'star-off'}
        />
      ))}
    </span>
  );
}

// Rating inline (ikon + angka) untuk baris meta.
export function Rating({ value, size = 13 }) {
  return (
    <span className="rating">
      <Star size={size} filled />
      {ratingFmt(value)}
    </span>
  );
}

function metaLine(item) {
  return [item.category, item.size, item.version ? `v${item.version}` : '']
    .filter(Boolean)
    .join('  •  ');
}

export function ItemCard({ item }) {
  return (
    <Link className="neo rowcard" to={`/detail/${item.collection}/${item.id}`}>
      <NetworkIcon url={item.icon} size={58} />
      <div className="rc-body">
        <div>
          <Badge fill>{COLLECTION_BADGES[item.collection] || item.collection}</Badge>{' '}
          {item.modType && <Badge>{item.modType}</Badge>}
        </div>
        <div className="rc-name">{item.name}</div>
        <div className="rc-meta">{metaLine(item)}</div>
        <div className="rc-sub">
          <Rating value={item.rating} /> <span className="dot">•</span>{' '}
          {compact(item.downloads)} unduhan
        </div>
      </div>
      <span className="chev">
        <ChevronRight size={22} />
      </span>
    </Link>
  );
}

export function ItemGridCard({ item }) {
  return (
    <Link className="neo gridcard" to={`/detail/${item.collection}/${item.id}`}>
      <NetworkIcon url={item.icon} size={62} />
      <div className="gc-name">{item.name}</div>
      <div className="gc-sub">
        <Rating value={item.rating} /> <span className="dot">•</span>{' '}
        {compact(item.downloads)}
      </div>
    </Link>
  );
}

export function RankCard({ rank, item }) {
  return (
    <Link
      className={`neo rankcard${rank <= 3 ? ' top' : ''}`}
      to={`/detail/${item.collection}/${item.id}`}
    >
      <div className="rank-num">{rank}</div>
      <NetworkIcon url={item.icon} size={50} />
      <div>
        <div className="gc-name">{item.name}</div>
        <div className="gc-sub">
          <Rating value={item.rating} /> <span className="dot">•</span>{' '}
          {compact(item.downloads)}
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-sub">{subtitle}</div>}
      {actionLabel && onAction && (
        <button className="btn btn-line btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty">
      <div className="empty-icon danger">
        <AlertCircle size={34} />
      </div>
      <div className="empty-title">Gagal memuat</div>
      {message && <div className="empty-sub">{message}</div>}
      {onRetry && (
        <button className="btn btn-line btn-sm" onClick={onRetry}>
          <RefreshCw size={15} /> Coba Lagi
        </button>
      )}
    </div>
  );
}

export function SkeletonList({ count = 6 }) {
  return (
    <div className="skel-list">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel-row" key={i}>
          <div className="skel shimmer" style={{ width: 58, height: 58 }} />
          <div style={{ flex: 1 }}>
            <div className="skel shimmer" style={{ height: 14 }} />
            <div
              className="skel shimmer"
              style={{ height: 12, width: 160, marginTop: 8 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="irow">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

// Pita teks berjalan ala brutalisme.
export function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((t, i) => (
          <span key={i} className="marquee-item">
            {t} <span className="marquee-sep">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}
