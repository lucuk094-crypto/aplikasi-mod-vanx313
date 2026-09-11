import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { Reveal } from '../lib/reveal.jsx';
import { compact } from '../lib/format.js';
import {
  Award,
  Gamepad,
  LayoutGrid,
  Shield,
  Smartphone,
  Sliders,
  Zap,
} from '../components/icons.jsx';
import {
  EmptyState,
  ErrorState,
  ItemCard,
  Kicker,
  Marquee,
  NetworkIcon,
  RankCard,
  Rating,
  SectionHeader,
  SkeletonList,
} from '../components/ui.jsx';

const MARQUEE_ITEMS = [
  '100% GRATIS',
  'TANPA IKLAN POP-UP',
  'DICEK MANUAL',
  'UPDATE BERKALA',
  'TANPA ROOT',
  'AMAN & CEPAT',
];

export default function Home() {
  const { featured, charts, latest, items, all, loading, error, refresh } =
    useStore();

  const totalDl = useMemo(
    () => all.reduce((s, it) => s + (it.downloads || 0), 0),
    [all]
  );

  if (loading) {
    return (
      <>
        <div className="hero">
          <div>
            <Kicker>// MOD ECOSYSTEM</Kicker>
            <h1>
              PLAY BEYOND <span className="hl">LIMITS</span>
            </h1>
          </div>
        </div>
        <SkeletonList count={6} />
      </>
    );
  }

  if (error && featured.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const [first, ...rest] = featured;

  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <Kicker>// OFFICIAL MOD STORE</Kicker>
          <h1>
            PLAY
            <br />
            BEYOND <span className="hl">LIMITS</span>
          </h1>
          <p className="lead">
            Toko aplikasi mod resmi: unduh aplikasi, game, dan tools premium
            yang sudah dimodifikasi — gratis, aman, dan selalu update.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-lime" to="/browse/games">
              <Gamepad size={18} /> Jelajah Game
            </Link>
            <Link className="btn btn-line" to="/popular">
              <Award size={18} /> Top Charts
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hs">
              <div className="n lime">{all.length}</div>
              <div className="l">Total Mod</div>
            </div>
            <div className="hs">
              <div className="n lime">{compact(totalDl)}</div>
              <div className="l">Unduhan</div>
            </div>
            <div className="hs">
              <div className="n lime">100%</div>
              <div className="l">Gratis</div>
            </div>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-top">
              <img className="phone-logo-img" src="/logo.jpeg" alt="VAN MOD" />
              <span className="phone-bar" style={{ width: '45%' }} />
            </div>
            <div className="phone-hero" />
            <div className="phone-card">
              <span className="phone-ic" />
              <span className="phone-lines">
                <i style={{ width: '72%' }} />
                <i style={{ width: '46%' }} />
              </span>
              <span className="phone-get">GET</span>
            </div>
            <div className="phone-card">
              <span className="phone-ic alt" />
              <span className="phone-lines">
                <i style={{ width: '62%' }} />
                <i style={{ width: '52%' }} />
              </span>
              <span className="phone-get">GET</span>
            </div>
            <div className="phone-card">
              <span className="phone-ic alt2" />
              <span className="phone-lines">
                <i style={{ width: '78%' }} />
                <i style={{ width: '40%' }} />
              </span>
              <span className="phone-get">GET</span>
            </div>
          </div>
          <div className="sticker s1">
            <Zap size={15} /> 100% GRATIS
          </div>
          <div className="sticker s2">
            <Shield size={15} /> TERVERIFIKASI
          </div>
        </div>
      </div>

      <Marquee items={MARQUEE_ITEMS} />

      {first && (
        <Reveal>
          <SectionHeader title="Featured" />
          <div className="feat-grid">
            <Link className="neo feat-main" to={`/detail/${first.collection}/${first.id}`}>
              <NetworkIcon url={first.icon} size={96} />
              <div>
                <Kicker>
                  // {first.collection.toUpperCase()} • {first.modType || 'MOD'}
                </Kicker>
                <div className="feat-name">{first.name}</div>
                <div className="feat-meta">
                  <Rating value={first.rating} size={14} />
                  <span className="dot">•</span>
                  {compact(first.downloads)} unduhan
                </div>
              </div>
            </Link>
            <div className="list">
              {rest.slice(0, 3).map((it) => (
                <Link
                  key={it.key}
                  className="neo rowcard"
                  to={`/detail/${it.collection}/${it.id}`}
                >
                  <NetworkIcon url={it.icon} size={46} />
                  <div className="rc-body">
                    <div className="rc-name" style={{ marginTop: 0 }}>
                      {it.name}
                    </div>
                    <div className="rc-sub">
                      <Rating value={it.rating} /> <span className="dot">•</span>{' '}
                      {compact(it.downloads)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <SectionHeader title="Top Charts" actionLabel="Lihat Popular" to="/popular" />
        {charts.length === 0 ? (
          <EmptyState
            icon={<Award size={34} />}
            title="Belum ada data"
            subtitle="Katalog masih kosong."
          />
        ) : (
          <div className="hscroll">
            {charts.map((it, i) => (
              <RankCard key={it.key} rank={i + 1} item={it} />
            ))}
          </div>
        )}
      </Reveal>

      <Reveal>
        <SectionHeader title="Kategori" />
        <div className="tiles">
          <Link className="neo tile" to="/browse/apps">
            <div className="ti">
              <Smartphone size={26} />
            </div>
            <div className="tn">Aplikasi</div>
            <div className="tc">{items.apps.length} item</div>
          </Link>
          <Link className="neo tile" to="/browse/games">
            <div className="ti">
              <Gamepad size={26} />
            </div>
            <div className="tn">Game</div>
            <div className="tc">{items.games.length} item</div>
          </Link>
          <Link className="neo tile" to="/browse/tools">
            <div className="ti">
              <Sliders size={26} />
            </div>
            <div className="tn">Tools</div>
            <div className="tc">{items.tools.length} item</div>
          </Link>
          <Link className="neo tile" to="/latest">
            <div className="ti">
              <Zap size={26} />
            </div>
            <div className="tn">Latest</div>
            <div className="tc">Baru rilis</div>
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <SectionHeader title="Baru Rilis" actionLabel="Semua" to="/latest" />
        <div className="list">
          {latest.map((it, i) => (
            <Reveal key={it.key} delay={(i % 8) * 60}>
              <ItemCard item={it} />
            </Reveal>
          ))}
        </div>
        {latest.length === 0 && (
          <EmptyState
            icon={<LayoutGrid size={34} />}
            title="Belum ada rilisan"
            subtitle="Coba lagi nanti."
          />
        )}
      </Reveal>
    </>
  );
}
