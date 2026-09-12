import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { ADMIN_EMAILS } from '../config.js';
import {
  deleteChatMessage,
  sendChatMessage,
  uploadChatImage,
  watchForumMessages,
} from '../lib/chat.js';
import {
  clearTyping,
  touchTyping,
  watchTyping,
} from '../lib/presence.js';
import { markForumSeen, useNotify } from '../lib/notify.jsx';
import { Kicker } from '../components/ui.jsx';
import { ImageIcon, Send, X } from '../components/icons.jsx';

function dateOf(m) {
  const v = m.createdAt;
  if (!v) return new Date();
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function fmtTime(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function dayLabel(d) {
  const now = new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today - day) / 86400000);
  if (diff <= 0) return 'Hari Ini';
  if (diff === 1) return 'Kemarin';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Forum() {
  const { user, isAuthed, isAdmin, displayName } = useAuth();
  const { dmUnread } = useNotify();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [lightbox, setLightbox] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flashId, setFlashId] = useState('');
  const [typing, setTyping] = useState([]);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const msgRefs = useRef({});
  const nearBottom = useRef(true);

  // Langganan real-time: pesan baru langsung muncul tanpa refresh.
  useEffect(() => {
    return watchForumMessages(
      (list) => {
        list.sort((a, b) => dateOf(a) - dateOf(b));
        setMessages(list);
        setLoading(false);
        markForumSeen();
      },
      () => {
        setError('Gagal memuat forum. Periksa koneksi lalu refresh.');
        setLoading(false);
      }
    );
  }, []);

  // Pantau siapa yang sedang mengetik di forum.
  useEffect(() => {
    return watchTyping(null, setTyping);
  }, []);

  // Bersihkan status mengetik saat keluar halaman.
  useEffect(() => {
    return () => {
      if (user) clearTyping(user.uid, null);
    };
  }, [user]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  // Auto-scroll ke bawah saat ada pesan baru (kalau user lagi di bawah).
  useEffect(() => {
    const el = listRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  function jumpTo(id) {
    const el = msgRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(id);
    setTimeout(() => setFlashId(''), 1400);
  }

  function onType(v) {
    setText(v);
    if (user && v.trim()) {
      touchTyping(user.uid, displayName || 'Anonim', null);
    }
  }

  async function handleSend() {
    if (sending || uploading) return;
    const t = text.trim();
    if ((!t && !imageUrl) || !user) return;
    setSending(true);
    try {
      await sendChatMessage({ user, text: t, imageUrl, replyTo });
      setText('');
      setImageUrl('');
      setReplyTo(null);
      clearTyping(user.uid, null);
    } catch (e) {
      setError(e.message || 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  }

  async function pickImage(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f || !user) return;
    if (!f.type.startsWith('image/')) {
      setError('File harus berupa gambar.');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 2MB.');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadChatImage(f, setProgress);
      setImageUrl(url);
    } catch {
      setError('Upload gambar gagal. Coba lagi.');
    } finally {
      setUploading(false);
    }
  }

  async function forward(m) {
    setMenuId(null);
    if (!user) return;
    try {
      await sendChatMessage({
        user,
        text: m.text || '',
        imageUrl: m.imageUrl || '',
        forwarded: true,
        forwardedFrom: m.name || 'Anonim',
      });
    } catch {
      setError('Gagal meneruskan pesan.');
    }
  }

  async function remove(m) {
    setMenuId(null);
    if (!window.confirm('Hapus pesan ini untuk semua orang?')) return;
    try {
      await deleteChatMessage(m.id);
    } catch {
      setError('Gagal menghapus pesan.');
    }
  }

  function copyText(m) {
    setMenuId(null);
    if (m.text && navigator.clipboard) {
      navigator.clipboard.writeText(m.text).catch(() => {});
    }
  }

  function chatPrivate(m) {
    setMenuId(null);
    navigate(
      `/dm?to=${m.uid}&name=${encodeURIComponent(
        m.name || 'Anonim'
      )}&email=${encodeURIComponent(m.email || '')}`
    );
  }

  function openAuth() {
    window.dispatchEvent(new Event('vanmod:open-auth'));
  }

  const othersTyping = typing.filter((t) => t.uid !== (user && user.uid));
  let lastDay = '';

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>{'// FORUM'}</Kicker>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            marginTop: 8,
          }}
        >
          Forum Chat
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          Ngobrol real-time sesama user — tanya update, lapor error, atau
          diskusi mod favoritmu.
        </p>
      </div>

      <div className="forum neo">
        <div className="forum-head">
          <span className="live-dot" />
          <strong>Obrolan Umum</strong>
          <span className="forum-count">{messages.length} pesan</span>
          <Link to="/dm" className="dm-link">
            💬 Pesan Saya{dmUnread > 0 && <b>{dmUnread}</b>}
          </Link>
        </div>

        <div className="forum-list" ref={listRef} onScroll={onScroll}>
          {loading ? (
            <div className="forum-loading">Memuat obrolan…</div>
          ) : messages.length === 0 ? (
            <div className="forum-loading">
              Belum ada pesan. Jadilah yang pertama! 👋
            </div>
          ) : (
            messages.map((m) => {
              const d = dateOf(m);
              const day = dayLabel(d);
              const showDay = day !== lastDay;
              lastDay = day;
              const own = user && m.uid === user.uid;
              const adminMsg = ADMIN_EMAILS.includes(
                (m.email || '').toLowerCase()
              );
              const canDelete =
                (user && m.uid === user.uid) || isAdmin;
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="day-div">
                      <span>{day}</span>
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      msgRefs.current[m.id] = el;
                    }}
                    className={`msg${own ? ' own' : ''}${
                      flashId === m.id ? ' flash' : ''
                    }`}
                  >
                    <div className="bubble">
                      <div className="bubble-top">
                        {!own && (
                          <span className="who">{m.name || 'Anonim'}</span>
                        )}
                        {adminMsg && <span className="admin-tag">ADMIN</span>}
                        <button
                          className="dots"
                          onClick={() =>
                            setMenuId(menuId === m.id ? null : m.id)
                          }
                          aria-label="Aksi pesan"
                        >
                          ⋯
                        </button>
                        {menuId === m.id && (
                          <div className="msg-menu">
                            <button
                              onClick={() => {
                                setReplyTo(m);
                                setMenuId(null);
                              }}
                            >
                              ↩ Balas
                            </button>
                            <button onClick={() => forward(m)}>
                              ➦ Teruskan
                            </button>
                            {m.text && (
                              <button onClick={() => copyText(m)}>
                                ⧉ Salin
                              </button>
                            )}
                            {!own && user && (
                              <button onClick={() => chatPrivate(m)}>
                                💬 Chat Privat
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="danger"
                                onClick={() => remove(m)}
                              >
                                🗑 Hapus
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {m.forwarded && (
                        <div className="fwd">
                          ➦ Diteruskan
                          {m.forwardedFrom
                            ? ` dari ${m.forwardedFrom}`
                            : ''}
                        </div>
                      )}
                      {m.replyTo && (
                        <button
                          className="quote"
                          onClick={() => jumpTo(m.replyTo.id)}
                        >
                          <strong>{m.replyTo.name}</strong>
                          <span>
                            {m.replyTo.text || '📷 Gambar'}
                          </span>
                        </button>
                      )}
                      {m.imageUrl && (
                        <button
                          className="img-btn"
                          onClick={() => setLightbox(m.imageUrl)}
                        >
                          <img
                            src={m.imageUrl}
                            alt="Lampiran chat"
                            loading="lazy"
                          />
                        </button>
                      )}
                      {m.text && <p>{m.text}</p>}
                      <span className="meta">{fmtTime(d)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {othersTyping.length > 0 && (
          <div className="typing-row">
            <span className="typing-dots">
              <i />
              <i />
              <i />
            </span>
            {othersTyping.map((t) => t.name).join(', ')} sedang mengetik…
          </div>
        )}

        {error && <div className="forum-error">{error}</div>}

        {isAuthed ? (
          <div className="composer">
            {replyTo && (
              <div className="reply-bar">
                <div>
                  <strong>{replyTo.name}</strong>
                  <span>{replyTo.text || '📷 Gambar'}</span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setReplyTo(null)}
                  aria-label="Batal balas"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {imageUrl && (
              <div className="preview-bar">
                <img src={imageUrl} alt="Pratinjau" />
                <button
                  className="icon-btn"
                  onClick={() => setImageUrl('')}
                  aria-label="Batal gambar"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {uploading && (
              <div className="upload-progress">
                <i style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="composer-row">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={pickImage}
              />
              <button
                className="icon-btn"
                onClick={() => fileRef.current && fileRef.current.click()}
                disabled={uploading}
                title="Kirim gambar"
                aria-label="Kirim gambar"
              >
                <ImageIcon size={19} />
              </button>
              <input
                value={text}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tulis pesan…"
                maxLength={2000}
              />
              <button
                className="btn btn-lime btn-sm"
                onClick={handleSend}
                disabled={
                  sending ||
                  uploading ||
                  (!text.trim() && !imageUrl)
                }
              >
                <Send size={15} /> Kirim
              </button>
            </div>
          </div>
        ) : (
          <div className="guest-box">
            <span>Masuk untuk ikut ngobrol di forum.</span>
            <button className="btn btn-lime btn-sm" onClick={openAuth}>
              Masuk / Daftar
            </button>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox('')}>
          <img src={lightbox} alt="Lampiran" />
        </div>
      )}
    </>
  );
}
