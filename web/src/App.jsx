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
import AdminLogin from './pages/AdminLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Editor from './pages/Editor.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
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
          <Route path="admin" element={<AdminLogin />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
          <Route path="admin/new" element={<Editor />} />
          <Route path="admin/edit/:collection/:id" element={<Editor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
