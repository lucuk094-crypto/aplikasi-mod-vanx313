import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Browse from './pages/Browse.jsx';
import Latest from './pages/Latest.jsx';
import Popular from './pages/Popular.jsx';
import Detail from './pages/Detail.jsx';
import Search from './pages/Search.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Contact from './pages/Contact.jsx';
import About from './pages/About.jsx';
import Guide from './pages/Guide.jsx';
import Profil from './pages/Profil.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Editor from './pages/Editor.jsx';
import Inbox from './pages/Inbox.jsx';
import NotFound from './pages/NotFound.jsx';
import { COLLECTION_LABELS } from './config.js';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Judul tab dinamis per halaman (SEO dasar + UX).
function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const seg = pathname.split('/').filter(Boolean);
    let title = 'VAN MOD — Toko Aplikasi Mod';
    if (seg[0] === 'browse' && seg[1]) {
      const label = COLLECTION_LABELS[seg[1]] || seg[1];
      title = `${label} Mod — VAN MOD`;
    } else if (seg[0] === 'detail') {
      title = 'Detail Mod — VAN MOD';
    } else if (seg[0] === 'latest') {
      title = 'Latest Mod — VAN MOD';
    } else if (seg[0] === 'popular') {
      title = 'Popular Mod — VAN MOD';
    } else if (seg[0] === 'search') {
      title = 'Cari Mod — VAN MOD';
    } else if (seg[0] === 'wishlist') {
      title = 'Wishlist — VAN MOD';
    } else if (seg[0] === 'contact') {
      title = 'Kontak — VAN MOD';
    } else if (seg[0] === 'about') {
      title = 'Tentang — VAN MOD';
    } else if (seg[0] === 'panduan') {
      title = 'Panduan Install — VAN MOD';
    } else if (seg[0] === 'profil') {
      title = 'Profil — VAN MOD';
    } else if (seg[0] === 'admin') {
      title = 'Admin — VAN MOD';
    }
    document.title = title;
  }, [pathname]);
}

export default function App() {
  useDocumentTitle();
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse/:collection" element={<Browse />} />
          <Route path="latest" element={<Latest />} />
          <Route path="popular" element={<Popular />} />
          <Route path="detail/:collection/:id" element={<Detail />} />
          <Route path="search" element={<Search />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="panduan" element={<Guide />} />
          <Route path="profil" element={<Profil />} />
          <Route path="admin" element={<AdminLogin />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
          <Route path="admin/inbox" element={<Inbox />} />
          <Route path="admin/new" element={<Editor />} />
          <Route path="admin/edit/:collection/:id" element={<Editor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
