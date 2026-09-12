import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useWishlist } from '../lib/wishlist.jsx';
import { useNotify } from '../lib/notify.jsx';
import AuthModal from './AuthModal.jsx';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Globe,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Shield,
  User,
  VLogo,
  X,
} from './icons.jsx';

const NAV = [
  { to: '/', label: 'Beranda', end: true, Icon: Home },
  { to: '/stream', label: 'Stream', Icon: Globe },
];

// Menu garis tiga (mobile): hanya Beranda — Stream sudah nongol
// langsung di bar atas lewat tombol .top-stream.
const MOBILE_NAV = [
  { to: '/', label: 'Beranda', end: true, Icon: Home },
];

// Logo brand: foto dari /logo.jpeg, otomatis fallback ke logo V bila belum ada.
function BrandMark({ size = 34 }) {
  const [err, setErr] = useState(false);
  if (err) return <VLogo size={size} />;
  return (
    <img
      src="/logo.jpeg"
      alt="VAN MOD"
      width={size}
      height={size}
      className="brand-mark"
      onError={() => setErr(true)}
    />
  );
}

export default function Layout() {
  const { isAuthed, isAdmin, displayName, signOut } = useAuth();
  const { count } = useWishlist();
  const { dmUnread } = useNotify();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const open = () => setShowAuth(true);
    window.addEventListener('vanmod:open-auth', open);
    return () => window.removeEventListener('vanmod:open-auth', open);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  function logout() {
    signOut();
    navigate('/');
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }

  return (
    <div className="app">
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="container header-in">
          <Link className="brand" to="/" aria-label="VAN MOD — Beranda">
            <BrandMark size={34} />
            <span className="brand-name">
              VAN&nbsp;MOD
              <BadgeCheck size={15} className="verified" />
            </span>
          </Link>

          <nav className="nav" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <Link to="/stream" className="top-stream" aria-label="Stream">
              <Globe size={15} />
              <span>Stream</span>
            </Link>
            <button
              className="icon-btn"
              title="Cari"
              aria-label="Cari"
              onClick={() => navigate('/search')}
            >
              <Search size={19} />
            </button>
            <button
              className="icon-btn"
              title="Wishlist"
              aria-label="Wishlist"
              onClick={() => navigate('/wishlist')}
            >
              <Heart size={19} />
              {count > 0 && <span className="count">{count}</span>}
            </button>
            <button
              className="icon-btn"
              title="Pesan"
              aria-label="Pesan"
              onClick={() => navigate('/dm')}
            >
              <MessageCircle size={19} />
              {dmUnread > 0 && <span className="count">{dmUnread}</span>}
            </button>
            {isAuthed ? (
              <div className="account">
                <button
                  className="account-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <User size={15} />
                  <span className="account-name">{displayName}</span>
                  <ChevronDown size={14} />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="menu-scrim"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="menu" role="menu">
                      <Link to="/profil">
                        <User size={15} /> Profil Saya
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/dashboard">
                          <Shield size={15} /> Admin Panel
                        </Link>
                      )}
                      <button onClick={logout}>
                        <LogOut size={15} /> Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                className="btn btn-lime btn-sm btn-login"
                onClick={() => setShowAuth(true)}
              >
                <User size={15} /> Masuk
              </button>
            )}
            <button
              className="icon-btn burger"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
          <div className="container mobile-nav-grid">
            {MOBILE_NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <n.Icon size={19} />
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>

      </header>

      {pathname !== '/' && (
        <div className="backbar">
          <div className="container backbar-in">
            <button className="backbtn" onClick={goBack}>
              <ArrowLeft size={16} /> Kembali
            </button>
          </div>
        </div>
      )}

      <main className="container main page" key={pathname}>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="foot-brand">
            <div className="brand">
              <BrandMark size={30} />
              <span className="brand-name">
                VAN&nbsp;MOD
                <BadgeCheck size={15} className="verified" />
              </span>
            </div>
            <p>
              Platform toko aplikasi mod — aplikasi, game, dan tools premium
              yang sudah dimodifikasi. Gratis, aman, dan selalu update.
            </p>
            <div className="foot-badges">
              <span className="badge fill">RESMI</span>{' '}
              <span className="badge">TERVERIFIKASI</span>
            </div>
          </div>
          <nav aria-label="Jelajah">
            <div className="foot-title">Jelajah</div>
            <Link to="/browse/games">Game</Link>
            <Link to="/browse/apps">Aplikasi</Link>
            <Link to="/browse/tools">Tools</Link>
            <Link to="/popular">Top Charts</Link>
            <Link to="/forum">Forum Chat</Link>
          </nav>
          <nav aria-label="Bantuan">
            <div className="foot-title">Bantuan</div>
            <Link to="/panduan">Panduan Install</Link>
            <Link to="/contact">Kontak</Link>
            <Link to="/about">Tentang Kami</Link>
            <Link to="/latest">Baru Rilis</Link>
          </nav>
          <nav aria-label="Pengelola">
            <div className="foot-title">Pengelola</div>
            <Link to="/admin">Admin Login</Link>
            {isAdmin && <Link to="/admin/dashboard">Dashboard</Link>}
            <Link to="/wishlist">Wishlist Saya</Link>
          </nav>
        </div>
        <div className="container foot-bottom">
          <span>© 2026 VAN MOD. Play Beyond Limits.</span>
          <span className="foot-ver">WEB v1.0</span>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
