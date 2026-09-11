import { useState } from 'react';
import { Check, Send } from '../components/icons.jsx';
import { Kicker } from '../components/ui.jsx';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 900);
  }

  return (
    <div className="prose">
      <Kicker>
        <span style={{ display: 'inline-block', marginTop: 26 }}>// HUBUNGI KAMI</span>
      </Kicker>
      <h1>Kontak</h1>
      <p style={{ color: 'var(--muted)' }}>
        Ada request mod, link rusak, atau kerja sama? Kirim pesan — biasanya
        dibalas &lt; 24 jam.
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
            <Check size={16} /> Pesan terkirim. Terima kasih sudah menghubungi
            VAN MOD!
          </div>
        )}
        <button className="btn btn-lime" disabled={busy}>
          <Send size={16} /> {busy ? 'Mengirim…' : 'Kirim Pesan'}
        </button>
      </form>
    </div>
  );
}
