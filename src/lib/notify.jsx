import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase.js';
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
    let alive = true;
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (!alive) return;
      const r = (data || [])[0];
      const m = r
        ? {
            id: r.id,
            text: r.text,
            imageUrl: r.image_url,
            uid: r.user_id,
            name: r.name,
            createdAt: r.created_at,
          }
        : null;
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
    }
    load();
    const ch = supabase
      .channel('notify-forum')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => load()
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
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
        const ts = tsOf(t.updated_at);
        const known = dmKnown.current[t.id] || 0;
        dmKnown.current[t.id] = Math.max(known, ts);
        if (t.last_by === user.uid) continue;
        if (ts <= dmMount.current || ts <= known) continue;
        let open = '';
        try {
          open = localStorage.getItem('vanmod:dm-open') || '';
        } catch {
          // abaikan
        }
        if (open === t.id) continue;
        const other = (t.members || []).find((m) => m !== user.uid);
        const nm = (t.names && t.names[other]) || 'Pesan baru';
        showToast(
          `✉️ ${nm}: ${(t.last_text || '').slice(0, 80)}`,
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
        t.last_by !== (user && user.uid) &&
        tsOf(t.updated_at) > (seen[t.id] || 0)
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
