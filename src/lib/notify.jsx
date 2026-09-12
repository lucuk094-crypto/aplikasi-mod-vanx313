import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { useAuth } from './auth.jsx';
import { watchThreads } from './dm.js';

const NotifyContext = createContext({ dmUnread: 0, forumUnread: 0 });

export function useNotify() {
  return useContext(NotifyContext);
}

function getSeen() {
  try {
    return JSON.parse(localStorage.getItem('vanmod:dm-seen') || '{}');
  } catch {
    return {};
  }
}

export function markThreadSeen(threadId) {
  const s = getSeen();
  s[threadId] = Date.now();
  try {
    localStorage.setItem('vanmod:dm-seen', JSON.stringify(s));
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event('vanmod:seen'));
}

export function markForumSeen() {
  try {
    localStorage.setItem('vanmod:forum-seen', String(Date.now()));
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event('vanmod:seen'));
}

function forumSeenTs() {
  return Number(localStorage.getItem('vanmod:forum-seen') || 0);
}

function tsOf(v) {
  if (!v) return 0;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function NotifyProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [latestForum, setLatestForum] = useState(null);
  const [toast, setToast] = useState(null);
  const [seenTick, setSeenTick] = useState(0);
  const firstForum = useRef(true);
  const dmKnown = useRef({});
  const dmMount = useRef(Date.now());
  const toastTimer = useRef(null);

  useEffect(() => {
    const onSeen = () => setSeenTick((t) => t + 1);
    window.addEventListener('vanmod:seen', onSeen);
    return () => window.removeEventListener('vanmod:seen', onSeen);
  }, []);

  // Bersihkan prefix judul saat tab kembali fokus.
  useEffect(() => {
    const onFocus = () => {
      document.title = document.title.replace(/^\(\d+\) /, '');
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function showToast(text, href) {
    setToast({ text, href, key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
    if (document.hidden) {
      const base = document.title.replace(/^\(\d+\) /, '');
      document.title = `(1) ${base}`;
    }
  }

  // Pantau pesan forum terbaru → toast kalau ada yang baru.
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      const d = snap.docs[0];
      const m = d ? { id: d.id, ...d.data() } : null;
      setLatestForum(m);
      if (firstForum.current) {
        firstForum.current = false;
        return;
      }
      if (!m || (!m.text && !m.imageUrl)) return;
      if (user && m.uid === user.uid) return;
      if (window.location.pathname === '/forum') return;
      showToast(
        `💬 ${m.name || 'Anonim'}: ${(m.text || '📷 Gambar').slice(0, 80)}`,
        '/forum'
      );
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Pantau thread DM saya → toast + badge.
  useEffect(() => {
    if (!user) {
      setThreads([]);
      return;
    }
    dmMount.current = Date.now();
    return watchThreads(user.uid, (list) => {
      setThreads(list);
      for (const t of list) {
        const ts = tsOf(t.updatedAt);
        const known = dmKnown.current[t.id] || 0;
        dmKnown.current[t.id] = Math.max(known, ts);
        if (t.lastBy === user.uid) continue;
        if (ts <= dmMount.current || ts <= known) continue;
        let open = '';
        try {
          open = localStorage.getItem('vanmod:dm-open') || '';
        } catch {
          // abaikan
        }
        if (open === t.id) continue;
        const other = (t.members || []).find((m) => m !== user.uid);
        const nm =
          (t.names && t.names[other]) || 'Pesan baru';
        showToast(
          `✉️ ${nm}: ${(t.lastText || '').slice(0, 80)}`,
          `/dm?t=${t.id}`
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = useMemo(() => {
    const seen = getSeen();
    let du = 0;
    for (const t of threads) {
      if (
        t.lastBy !== (user && user.uid) &&
        tsOf(t.updatedAt) > (seen[t.id] || 0)
      ) {
        du++;
      }
    }
    let fu = 0;
    if (
      latestForum &&
      (!user || latestForum.uid !== user.uid) &&
      tsOf(latestForum.createdAt) > forumSeenTs()
    ) {
      fu = 1;
    }
    return { dmUnread: du, forumUnread: fu };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, latestForum, user, seenTick]);

  function openToast() {
    const href = toast && toast.href;
    setToast(null);
    if (href) navigate(href);
  }

  return (
    <NotifyContext.Provider value={value}>
      {children}
      {toast && (
        <button
          key={toast.key}
          className="notify-toast show"
          onClick={openToast}
        >
          {toast.text}
        </button>
      )}
    </NotifyContext.Provider>
  );
}
