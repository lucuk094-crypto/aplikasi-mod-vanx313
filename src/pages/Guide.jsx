import { Link } from 'react-router-dom';
import { Reveal } from '../lib/reveal.jsx';
import { ChevronDown } from '../components/icons.jsx';
import { Kicker } from '../components/ui.jsx';

const STEPS = [
  {
    n: '01',
    t: 'Pilih mod',
    d: 'Cari aplikasi/game favoritmu lewat Beranda, kategori, atau kolom Cari.',
  },
  {
    n: '02',
    t: 'Download APK',
    d: 'Buka halaman detail, ketuk tombol DOWNLOAD, file APK tersimpan di HP-mu.',
  },
  {
    n: '03',
    t: 'Izinkan sumber tak dikenal',
    d: 'Saat install, Android meminta izin "Install unknown apps" — pilih Izinkan untuk browser/Chrome.',
  },
  {
    n: '04',
    t: 'Install & mainkan',
    d: 'Ketuk file APK, lalu Install. Jika versi lama masih ada, uninstall dulu agar tidak konflik tanda tangan.',
  },
];

const FAQ = [
  {
    q: '"App not installed" saat install?',
    a: 'Biasanya karena versi Play Store masih terpasang — uninstall dulu, lalu install mod-nya.',
  },
  {
    q: 'APK tidak bisa dibuka?',
    a: 'Pastikan file selesai diunduh penuh (cek ukurannya) dan coba unduh ulang.',
  },
  {
    q: 'Apakah perlu root?',
    a: 'Tidak. Semua mod di VAN MOD berjalan di HP tanpa root.',
  },
  {
    q: 'Apakah aman?',
    a: 'File dicek manual sebelum tayang. Tetap disarankan memindai dengan antivirus jika ragu.',
  },
  {
    q: 'Link rusak / versi lama?',
    a: 'Laporkan lewat halaman Kontak — cantumkan nama mod-nya, tim akan perbaiki secepatnya.',
  },
];

export default function Guide() {
  return (
    <div className="prose">
      <Kicker>
        <span style={{ display: 'inline-block', marginTop: 26 }}>// HOW TO</span>
      </Kicker>
      <h1>Panduan Install</h1>
      <p style={{ color: 'var(--muted)' }}>
        Empat langkah dari download sampai mod-nya jalan di HP Android-mu.
      </p>

      <div className="step-grid">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 80}>
            <div className="neo step">
              <div className="n">{s.n}</div>
              <div className="t">{s.t}</div>
              <div className="d">{s.d}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <h3>Pertanyaan umum</h3>
      {FAQ.map((f) => (
        <details key={f.q} className="acc">
          <summary>
            {f.q}
            <ChevronDown size={18} />
          </summary>
          <div className="acc-body">
            <div>
              <p>{f.a}</p>
            </div>
          </div>
        </details>
      ))}

      <div style={{ marginTop: 22 }}>
        <Link className="btn btn-line btn-sm" to="/contact">
          Masih butuh bantuan? Hubungi kami
        </Link>
      </div>
    </div>
  );
}
