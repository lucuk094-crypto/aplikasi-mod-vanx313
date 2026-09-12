import { useStore } from '../lib/store.jsx';
import { Kicker } from '../components/ui.jsx';

export default function About() {
  const { items } = useStore();
  const total =
    items.apps.length + items.games.length + items.tools.length;

  return (
    <div className="prose">
      <Kicker>
        <span style={{ display: 'inline-block', marginTop: 26 }}>// WHO WE ARE</span>
      </Kicker>
      <h1>
        Tentang VAN<span className="lime">//</span>MOD
      </h1>
      <p>
        VAN MOD adalah toko aplikasi mod — aplikasi, game, dan tools premium
        yang sudah dimodifikasi (unlocked, premium, tanpa iklan) dan bisa
        diunduh gratis. Setiap file dicek manual oleh tim sebelum tayang.
      </p>

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <div className="neo stat-card">
          <div className="sv lime">{total}</div>
          <div className="sl">Total Mod</div>
        </div>
        <div className="neo stat-card">
          <div className="sv lime">{items.games.length}</div>
          <div className="sl">Game</div>
        </div>
        <div className="neo stat-card">
          <div className="sv lime">{items.apps.length}</div>
          <div className="sl">Aplikasi</div>
        </div>
        <div className="neo stat-card">
          <div className="sv lime">{items.tools.length}</div>
          <div className="sl">Tools</div>
        </div>
      </div>

      <h3>Kenapa VAN MOD?</h3>
      <ul>
        <li>
          <b>Gratis, tanpa paywall.</b> Semua mod bisa diunduh tanpa akun
          dan tanpa antre.
        </li>
        <li>
          <b>Dicek manual.</b> File diuji install sebelum diterbitkan; link
          rusak dilaporkan pengguna langsung diperbaiki.
        </li>
        <li>
          <b>Selalu update.</b> Versi baru aplikasi populer dipantau dan
          diperbarui berkala.
        </li>
        <li>
          <b>Ringan & cepat.</b> Web ini dibuat dengan React + Vite — tanpa
          iklan pop-up yang mengganggu.
        </li>
      </ul>

      <h3>Disclaimer</h3>
      <p style={{ color: 'var(--muted)' }}>
        Semua merek dagang dan hak cipta milik developer masing-masing. VAN
        MOD hanya untuk tujuan edukasi dan evaluasi — jika kamu suka sebuah
        aplikasi, dukung developer aslinya dengan membeli versi resmi.
      </p>
    </div>
  );
}
