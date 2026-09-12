import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  increment,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { COLLECTIONS, MAX_DOCS } from '../config.js';

function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function norm(collectionId, d) {
  const m = d.data() || {};
  return {
    id: d.id,
    key: `${collectionId}/${d.id}`,
    collection: collectionId,
    name: m.name ?? 'Untitled',
    description: m.description ?? '',
    category: m.category ?? '',
    version: m.version ?? '',
    size: m.size ?? '',
    modType: m.modType ?? '',
    developer: m.developer ?? '',
    packageName: m.packageName ?? '',
    androidVersion: m.androidVersion ?? '',
    // Fallback ke nama field aplikasi Flutter agar dokumen lama tetap jalan.
    minAndroid: m.minAndroid ?? m.androidVersion ?? '',
    license: m.license ?? '',
    downloadUrl: m.downloadUrl ?? '',
    file: m.file ?? m.downloadUrl ?? '',
    icon: m.icon ?? '',
    fileKind: m.fileKind ?? 'apk',
    rating: typeof m.rating === 'number' ? m.rating : 0,
    downloads: typeof m.downloads === 'number' ? m.downloads : 0,
    featured: typeof m.featured === 'number' ? m.featured : 0,
    tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
    screenshots: Array.isArray(m.screenshots) ? m.screenshots.map(String) : [],
    reviews: Array.isArray(m.reviews) ? m.reviews : [],
    createdAt: toDate(m.createdAt),
    updatedAt: toDate(m.updatedAt),
  };
}

// Batasi waktu tunggu operasi Firestore agar UI tidak loading selamanya.
function withTimeout(promise, ms = 25000, label = 'Operasi') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timeout. Periksa koneksi internetmu lalu coba lagi.`
          )
        ),
      ms
    );
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeout,
  ]);
}

function friendlyError(e, fallback) {
  const code = e?.code || '';
  if (code === 'permission-denied')
    return 'Izin ditolak. Pastikan kamu login sebagai admin.';
  if (code === 'unavailable' || code === 'deadline-exceeded')
    return 'Jaringan bermasalah. Coba lagi sebentar.';
  if (code === 'not-found') return 'Data tidak ditemukan (mungkin sudah dihapus).';
  return e?.message || fallback || 'Terjadi kesalahan.';
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [items, setItems] = useState({ apps: [], games: [], tools: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const firstRun = useRef(true);

  const refresh = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      // Paralel: 3 koleksi dimuat bersamaan, bukan satu-satu.
      const snaps = await withTimeout(
        Promise.all(
          COLLECTIONS.map((c) =>
            getDocs(
              query(
                collection(db, c),
                orderBy('downloads', 'desc'),
                limit(MAX_DOCS)
              )
            )
          )
        ),
        25000,
        'Memuat katalog'
      );
      const next = {};
      COLLECTIONS.forEach((c, i) => {
        next[c] = snaps[i].docs.map((d) => norm(c, d));
      });
      setItems(next);
    } catch (e) {
      if (!silent) setError(friendlyError(e, 'Gagal memuat katalog.'));
    } finally {
      if (!silent) setLoading(false);
      if (firstRun.current) {
        firstRun.current = false;
        setReady(true);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- Optimistic local updates: UI langsung berubah tanpa nunggu server. ---
  const upsertLocal = useCallback((collectionId, item) => {
    setItems((prev) => {
      const list = prev[collectionId] || [];
      const i = list.findIndex((it) => it.id === item.id);
      const nextList =
        i >= 0
          ? list.map((it, idx) => (idx === i ? item : it))
          : [item, ...list];
      return { ...prev, [collectionId]: nextList };
    });
  }, []);

  const removeLocal = useCallback((collectionId, id) => {
    setItems((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).filter((it) => it.id !== id),
    }));
  }, []);

  const bumpLocal = useCallback((key) => {
    setItems((prev) => {
      const next = { ...prev };
      for (const c of COLLECTIONS) {
        next[c] = (prev[c] || []).map((it) =>
          it.key === key ? { ...it, downloads: it.downloads + 1 } : it
        );
      }
      return next;
    });
  }, []);

  // Naikkan counter download (rules mengizinkan public stats update).
  const bumpDownloads = useCallback(
    async (item) => {
      bumpLocal(item.key);
      try {
        await withTimeout(
          updateDoc(doc(db, item.collection, item.id), {
            downloads: increment(1),
          }),
          15000,
          'Update counter'
        );
      } catch {
        // abaikan: UI tetap jalan
      }
    },
    [bumpLocal]
  );

  async function pushReview(item, { user, rating, comment }) {
    const ref = doc(db, item.collection, item.id);
    const snap = await withTimeout(getDoc(ref), 25000, 'Mengirim ulasan');
    if (!snap.exists()) throw new Error('Item tidak ditemukan.');
    const data = snap.data() || {};
    const prev = Array.isArray(data.reviews) ? data.reviews : [];
    const entry = {
      id: `r-${Date.now()}`,
      user,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    const next = [...prev, entry];
    const avg =
      next.reduce((s, r) => s + (Number(r.rating) || 0), 0) /
      (next.length || 1);
    const rounded = Math.round(avg * 10) / 10;
    await withTimeout(
      updateDoc(ref, {
        reviews: next,
        rating: rounded,
        updatedAt: serverTimestamp(),
      }),
      25000,
      'Mengirim ulasan'
    );
    return { next, rounded };
  }

  const submitReview = useCallback(
    async (item, { rating, comment, userName, user }) => {
      const { next, rounded } = await pushReview(item, {
        user: user ?? userName ?? 'Anonim',
        rating,
        comment,
      });
      upsertLocal(item.collection, {
        ...item,
        reviews: next,
        rating: rounded,
        updatedAt: new Date(),
      });
      refresh({ silent: true });
    },
    [refresh, upsertLocal]
  );

  // Dipakai halaman Detail. Mengembalikan { ok, error } agar tidak throw.
  const addReview = useCallback(
    async (item, { user, rating, comment }) => {
      try {
        const current =
          item &&
          (items[item.collection] || []).find((it) => it.id === item.id);
        const { next, rounded } = await pushReview(item, {
          user,
          rating,
          comment,
        });
        upsertLocal(item.collection, {
          ...(current || item),
          reviews: next,
          rating: rounded,
          updatedAt: new Date(),
        });
        refresh({ silent: true });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: friendlyError(e, 'Gagal mengirim ulasan.') };
      }
    },
    [items, refresh, upsertLocal]
  );

  // Dipakai Editor (tambah + edit). id null = dokumen baru.
  const saveItem = useCallback(
    async (collectionId, id, fields) => {
      // Mirror ke nama field aplikasi Flutter agar dua platform saling cocok.
      const mirror = {
        ...(fields.file !== undefined ? { downloadUrl: fields.file } : {}),
        ...(fields.minAndroid !== undefined
          ? { androidVersion: fields.minAndroid }
          : {}),
      };
      try {
        if (id) {
          await withTimeout(
            updateDoc(doc(db, collectionId, id), {
              ...fields,
              ...mirror,
              updatedAt: serverTimestamp(),
            }),
            25000,
            'Menyimpan perubahan'
          );
          const current = (items[collectionId] || []).find(
            (it) => it.id === id
          );
          upsertLocal(collectionId, {
            ...(current || { id, key: `${collectionId}/${id}`, collection: collectionId }),
            ...fields,
            updatedAt: new Date(),
          });
          refresh({ silent: true });
          return { ok: true, id };
        }
        const ref = await withTimeout(
          addDoc(collection(db, collectionId), {
            ...fields,
            ...mirror,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          25000,
          'Menyimpan mod'
        );
        const now = new Date();
        upsertLocal(
          collectionId,
          norm(collectionId, {
            id: ref.id,
            data: () => ({
              ...fields,
              rating: Number(fields.rating) || 0,
              downloads: Number(fields.downloads) || 0,
              featured: Number(fields.featured) || 0,
              reviews: [],
              createdAt: now,
              updatedAt: now,
            }),
          })
        );
        refresh({ silent: true });
        return { ok: true, id: ref.id };
      } catch (e) {
        return { ok: false, error: friendlyError(e, 'Gagal menyimpan.') };
      }
    },
    [items, refresh, upsertLocal]
  );

  // Dipakai Dashboard.
  const removeItem = useCallback(
    async (collectionId, id) => {
      try {
        await withTimeout(
          deleteDoc(doc(db, collectionId, id)),
          25000,
          'Menghapus'
        );
        removeLocal(collectionId, id);
        refresh({ silent: true });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: friendlyError(e, 'Gagal menghapus.') };
      }
    },
    [refresh, removeLocal]
  );

  const value = useMemo(() => {
    const all = COLLECTIONS.flatMap((c) => items[c] || []);
    const byDownloads = [...all].sort((a, b) => b.downloads - a.downloads);
    const byDate = [...all].sort(
      (a, b) =>
        (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
    );
    const withFeat = all
      .filter((it) => (it.featured || 0) > 0)
      .sort((a, b) => b.featured - a.featured);
    const findByKey = (key) => all.find((it) => it.key === key);
    return {
      items,
      loading,
      error,
      ready,
      refresh,
      all,
      featured: (withFeat.length ? withFeat : byDownloads).slice(0, 5),
      charts: byDownloads.slice(0, 10),
      latest: byDate.slice(0, 8),
      findByKey,
      reviews: (key) => findByKey(key)?.reviews || [],
      categories: (col) => {
        const s = new Set();
        for (const it of items[col] || []) {
          if (it.category) s.add(it.category);
        }
        return [...s].sort();
      },
      search: (q) => {
        const s = q.trim().toLowerCase();
        if (!s) return [];
        return all
          .filter(
            (it) =>
              it.name.toLowerCase().includes(s) ||
              it.description.toLowerCase().includes(s) ||
              it.category.toLowerCase().includes(s) ||
              it.developer.toLowerCase().includes(s) ||
              it.tags.some((t) => t.toLowerCase().includes(s))
          )
          .sort((a, b) => {
            const as = a.name.toLowerCase().startsWith(s);
            const bs = b.name.toLowerCase().startsWith(s);
            if (as !== bs) return as ? -1 : 1;
            return b.downloads - a.downloads;
          });
      },
      similar: (item, n = 8) => {
        const pool = (items[item.collection] || []).filter(
          (it) => it.id !== item.id
        );
        pool.sort((a, b) => {
          const sa =
            (a.category === item.category ? 2 : 0) +
            a.tags.filter((t) => item.tags.includes(t)).length;
          const sb =
            (b.category === item.category ? 2 : 0) +
            b.tags.filter((t) => item.tags.includes(t)).length;
          return sb - sa || b.downloads - a.downloads;
        });
        return pool.slice(0, n);
      },
      submitReview,
      addReview,
      bumpDownloads,
      saveItem,
      removeItem,
      // Kompat lama (tidak dipakai halaman, dipertahankan agar aman).
      adminCreate: async (collectionId, fields) => {
        const r = await saveItem(collectionId, null, {
          ...fields,
          rating: 0,
          downloads: 0,
          reviews: [],
        });
        if (!r.ok) throw new Error(r.error);
        return r.id;
      },
      adminUpdate: async (item, fields) => {
        const r = await saveItem(item.collection, item.id, fields);
        if (!r.ok) throw new Error(r.error);
      },
      adminDelete: async (item) => {
        const r = await removeItem(item.collection, item.id);
        if (!r.ok) throw new Error(r.error);
      },
    };
  }, [
    items,
    loading,
    error,
    ready,
    refresh,
    submitReview,
    addReview,
    bumpDownloads,
    saveItem,
    removeItem,
  ]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore harus di dalam StoreProvider');
  return ctx;
}
