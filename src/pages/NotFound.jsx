import { Link } from 'react-router-dom';
import { Home } from '../components/icons.jsx';
import { Kicker } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <Kicker>// ERROR 404</Kicker>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 72,
          color: 'var(--lime)',
          margin: '8px 0',
        }}
      >
        404
      </div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>
        Halaman tidak ditemukan
      </div>
      <div style={{ color: 'var(--muted)', margin: '8px 0 20px' }}>
        Mungkin link-nya salah atau item-nya sudah dihapus.
      </div>
      <Link className="btn btn-lime" to="/">
        <Home size={17} /> Kembali ke Beranda
      </Link>
    </div>
  );
}
