import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { ADMIN_EMAILS } from '../config.js';
import {
  deleteDM,
  sendDM,
  threadIdFor,
  uploadDMImage,
  watchThreadMessages,
  watchThreads,
} from '../lib/dm.js';
import {
  clearTyping,
  touchTyping,
  watchTyping,
} from '../lib/presence.js';
import { markThreadSeen } from '../lib/notify.jsx';
import { Kicker } from '../components/ui.jsx';
import { ArrowLeft, ImageIcon, Send, X } from '../components/icons.jsx';

function tsOf(v) {
  if (!v) return 0;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function fmtTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

function fmtClock(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function getSeen() {
  try {
    return JSON.parse(localStorage.getItem('vanmod:dm-seen') || '{}');
  } catch {
    return {};
  }
}

export default function DM() {
  const { user, isAuthed, displayName } = useAuth();
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [typing, setTyping] = useState([]);
  const [menuId, setMenuId] = useState(null);
  const [lightbox, setLightbox] = useState('');
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const nearBottom = useRef(true);

  const paramT = params.get('t') || '';
  const paramTo = params.get('to') || '';
  const selfChat = !!user && !!paramTo && paramTo === user.uid;
  const threadId =
    paramT ||
    (user && paramTo && !selfChat ? threadIdFor(user.uid, paramTo) : '');

  const peer = useMemo(() => {
    if (!threadId || !user) return null;
    const meta = threads.find((t) => t.id === threadId);
    const ids = threadId.split('_');
    const uid = ids.find((id) => id !== user.uid) || paramTo;
    const name =
      (meta && meta.names && meta.names[uid]) ||
      params.get('name') ||
      'Pengguna';
    const email =
      (meta && meta.emails && meta.emails[uid]) ||
      params.get('email') ||
      '';
    return { uid, name, email };
  }, [threadId, threads, user, params, paramTo]);

  const peerTyping = typing.filter((t) => t.uid !== (user && user.uid));
  const isPeerAdmin =
    peer && ADMIN_EMAILS.includes((peer.email || '').toLowerCase());

  // Daftar thread saya.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    return watchThreads(
      user.uid,
      (list) => {
        setThreads(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  // Pesan thread aktif (tandai dibaca saat masuk).
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    return watchThreadMessages(
      threadId,
      (list) => {
        setMessages(list);
        markThreadSeen(threadId);
      },
      () => setError('Gagal memuat percakapan.')
    );
  }, [threadId]);

  // Tandai thread sedang dibuka (anti toast dobel).
  useEffect(() => {
    if (threadId) {
      try {
        localStorage.setItem('vanmod:dm-open', threadId);
      } catch {
        // abaikan
      }
    }
    return () => {
      try {
        localStorage.removeItem('vanmod:dm-open');
      } catch {
        // abaikan
      }
    };
  }, [threadId]);

  // Indikator mengetik lawan bicara.
  useEffect(() => {
    if (!threadId) return;
    return watchTyping(threadId, setTyping);
  }, [threadId]);

  // Bersihkan status mengetik saat keluar.
  useEffect(() => {
    return () => {
      if (user && threadId) clearTyping(user.uid, threadId);
    };
  }, [user, threadId]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  useEffect(() => {
    const el = listRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  function onType(v) {
    setText(v);
    if (user && threadId && v.trim()) {
      touchTyping(user.uid, displayName || 'Anonim', threadId);
    }
  }

  async function handleSend() {
    if (sending || uploading || !user || !peer) return;
    const t = text.trim();
    if (!t && !imageUrl) return;
    setSending(true);
    try {
      await sendDM({ threadId, user, peer, text: t, imageUrl });
      setText('');
      setImageUrl('');
      clearTyping(user.uid, threadId);
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
      const url = await uploadDMImage(f, setProgress);
      setImageUrl(url);
    } catch {
      setError('Upload gambar gagal. Coba lagi.');
    } finally {
      setUploading(false);
    }
  }

  async function remove(m) {
    setMenuId(null);
    if (!window.confirm('Hapus pesan ini?')) return;
    try {
      await deleteDM(threadId, m.id);
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

  function openAuth() {
    window.dispatchEvent(new Event('vanmod:open-auth'));
  }

  if (!isAuthed) {
    return (
      <>
        <div style={{ paddingTop: 26 }}>
          <Kicker>{'// PESAN'}</Kicker>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              marginTop: 8,
            }}
          >
            Pesan Pribadi
          </h1>
        </div>
        <div className="guest-box neo" style={{ marginTop: 16 }}>
          <span>Masuk untuk membaca dan mengirim pesan pribadi.</span>
          <button className="btn btn-lime btn-sm" onClick={openAuth}>
            Masuk / Daftar
          </button>
        </div>
      </>
    );
  }

  const seen = getSeen();

  return (
    <>
      <div style={{ paddingTop: 26 }}>
        <Kicker>{'// PESAN'}</Kicker>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            marginTop: 8,
          }}
        >
          Pesan Pribadi
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          Chat privat antar user — hanya kamu dan lawan bicaramu yang bisa
          baca.
        </p>
      </div>

      {selfChat && (
        <div className="forum-error">Tidak bisa chat dengan diri sendiri 😅</div>
      )}

      <div className={`dm-wrap${threadId ? ' chatting' : ''}`}>
        <div className="dm-list neo">
          <div className="dm-list-head">Percakapan</div>
          {loading ? (
            <div className="forum-loading">Memuat…</div>
          ) : threads.length === 0 ? (
            <div className="forum-loading">
              Belum ada percakapan.
              <br />
              Mulai dari menu ⋯ di <Link to="/forum">forum</Link>.
            </div>
          ) : (
            threads.map((t) => {
              const other = (t.members || []).find((m) => m !== user.uid);
              const nm = (t.names && t.names[other]) || 'Pengguna';
              const unread =
                t.lastBy !== user.uid &&
                tsOf(t.updatedAt) > (seen[t.id] || 0);
              return (
                <button
                  key={t.id}
                  className={`dm-thread${t.id === threadId ? ' on' : ''}`}
                  onClick={() => setParams({ t: t.id })}
                >
                  <span className="dm-avatar">
                    {nm.charAt(0).toUpperCase()}
                  </span>
                  <span className="dm-thread-body">
                    <strong>
                      {nm} {unread && <i className="dm-dot" />}
                    </strong>
                    <span>{t.lastText || ''}</span>
                  </span>
                  <span className="dm-time">
                    {t.updatedAt ? fmtTime(tsOf(t.updatedAt)) : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="dm-chat neo">
          {!threadId || !peer ? (
            <div className="forum-loading">
              Pilih percakapan di sebelah kiri 👈
            </div>
          ) : (
            <>
              <div className="dm-chat-head">
                <button
                  className="icon-btn dm-back"
                  onClick={() => setParams({})}
                  aria-label="Kembali"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="dm-avatar">
                  {peer.name.charAt(0).toUpperCase()}
                </span>
                <strong>{peer.name}</strong>
                {isPeerAdmin && <span className="admin-tag">ADMIN</span>}
              </div>

              <div
                className="forum-list dm-msgs"
                ref={listRef}
                onScroll={onScroll}
              >
                {messages.map((m) => {
                  const own = m.uid === user.uid;
                  return (
                    <div key={m.id} className={`msg${own ? ' own' : ''}`}>
                      <div className="bubble">
                        <div className="bubble-top">
                          {!own && (
                            <span className="who">{m.name || 'Anonim'}</span>
                          )}
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
                              {m.text && (
                                <button onClick={() => copyText(m)}>
                                  ⧉ Salin
                                </button>
                              )}
                              {own && (
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
                        <span className="meta">
                          {fmtClock(tsOf(m.createdAt) || Date.now())}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {peerTyping.length > 0 && (
                  <div className="typing-row">
                    <span className="typing-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    {peerTyping.map((t) => t.name).join(', ')} sedang
                    mengetik…
                  </div>
                )}
              </div>

              {error && <div className="forum-error">{error}</div>}

              <div className="composer">
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
                      sending || uploading || (!text.trim() && !imageUrl)
                    }
                  >
                    <Send size={15} /> Kirim
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox('')}>
          <img src={lightbox} alt="Lampiran" />
        </div>
      )}
    </>
  );
}
