import { useState } from 'react';
import { Check, Send } from '../components/icons.jsx';
import { Kicker } from '../components/ui.jsx';
import { sendMessage } from '../lib/contact.js';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setSent(false);
    try {
      await sendMessage({ name, email, message });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(
        err?.code === 'unavailable'
          ? 'Jaringan bermasalah. Coba lagi sebentar.'
          : 'Gagal mengirim. Coba lagi.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="prose">
      <Kicker>
        <span style={{ display: 'inline-block', marginTop: 26 }}>// HUBUNGI KAMI</span>
      </Kicker>
      <h1>Kontak</h1>
      <p style={{ color: 'var(--muted)' }}>
        Request mod, lapor link rusak, atau kerja sama? Pesanmu langsung
        masuk ke tim VAN MOD — biasanya dibalas &lt; 24 jam.
      </p>
      <form
        onSubmit={submit}
        className="form neo"
        style={{ padding: 22, marginTop: 18 }}
      >
        <div className="form-row">
          <label>
            Nama
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
            />
          </label>
        </div>
        <label>
          Pesan
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesanmu…"
          />
        </label>
        {sent && (
          <div className="form-ok">
            <Check size={16} /> Pesan terkirim dan sudah masuk ke tim kami.
            Terima kasih!
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-lime" disabled={busy}>
          <Send size={16} /> {busy ? 'Mengirim…' : 'Kirim Pesan'}
        </button>
      </form>
    </div>
  );
}
