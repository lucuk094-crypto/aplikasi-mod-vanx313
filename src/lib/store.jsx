import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from './supabase.js';
import { COLLECTIONS, MAX_DOCS } from '../config.js';

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Baris Postgres (snake_case) → bentuk item aplikasi (camelCase).
function norm(m) {
  return {
    id: m.id,
    key: `${m.collection}/${m.id}`,
    collection: m.collection,
    name: m.name ?? 'Untitled',
    description: m.description ?? '',
    category: m.category ?? '',
    version: m.version ?? '',
    size: m.size ?? '',
    modType: m.mod_type ?? '',
    developer: m.developer ?? '',
    packageName: m.package_name ?? '',
    androidVersion: m.min_android ?? '',
    minAndroid: m.min_android ?? '',
    license: m.license ?? '',
    downloadUrl: m.download_url ?? '',
    file: m.download_url ?? '',
    icon: m.icon ?? '',
    fileKind: m.file_kind ?? 'apk',
    rating: typeof m.rating === 'number' ? m.rating : 0,
    downloads: typeof m.downloads === 'number' ? m.downloads : 0,
    featured: typeof m.featured === 'number' ? m.featured : 0,
    tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
    screenshots: Array.isArray(m.screenshots) ? m.screenshots.map(String) : [],
    reviews: Array.isArray(m.reviews) ? m.reviews : [],
    createdAt: toDate(m.created_at),
    updatedAt: toDate(m.updated_at),
  };
}

// Form editor → baris Postgres. Saat insert: lengkap + default.
// Saat update: hanya kolom yang dikirim (rating/downloads/reviews aman).
function toRow(collectionId, fields, forInsert) {
  const row = {};
  const set = (col, val) => {
    if (val !== undefined || forInsert) row[col] = val;
  };
  if (forInsert) {
    row.collection = collectionId;
    row.name = fields.name ?? 'Untitled';
    row.description = fields.description ?? '';
    row.category = (fields.category ?? '').trim();
    row.version = fields.version ?? '';
    row.size = fields.size ?? '';
    row.mod_type = fields.modType ?? '';
    row.developer = fields.developer ?? '';
    row.package_name = fields.packageName ?? '';
    row.min_android = fields.minAndroid ?? fields.androidVersion ?? '';
    row.license = fields.license ?? '';
    row.download_url = fields.downloadUrl ?? fields.file ?? '';
    row.icon = fields.icon ?? '';
    row.file_kind = fields.fileKind ?? 'apk';
    row.rating = Number(fields.rating) || 0;
    row.downloads = Number(fields.downloads) || 0;
    row.featured = Number(fields.featured) || 0;
    row.tags = Array.isArray(fields.tags) ? fields.tags : [];
    row.screenshots = Array.isArray(fields.screenshots)
      ? fields.screenshots
      : [];
    return row;
  }
  row.collection = collectionId;
  set('name', fields.name);
  set('description', fields.description);
  set(
    'category',
    fields.category !== undefined ? String(fields.category).trim() : undefined
  );
  set('version', fields.version);
  set('size', fields.size);
  set('mod_type', fields.modType);
  set('developer', fields.developer);
  set('package_name', fields.packageName);
  set(
    'min_android',
    fields.minAndroid !== undefined
      ? fields.minAndroid
      : fields.androidVersion
  );
  set('license', fields.license);
  set(
    'download_url',
    fields.downloadUrl !== undefined ? fields.downloadUrl : fields.file
  );
  set('icon', fields.icon);
  set('file_kind', fields.fileKind);
  if (fields.rating !== undefined) row.rating = Number(fields.rating) || 0;
  if (fields.downloads !== undefined)
    row.downloads = Number(fields.downloads) || 0;
  if (fields.featured !== undefined)
    row.featured = Number(fields.featured) || 0;
  set('tags', fields.tags);
  set('screenshots', fields.screenshots);
  return row;
}

// Batasi waktu tunggu operasi agar UI tidak loading selamanya.
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
  const msg = (e?.message || '').toLowerCase();
  const code = e?.code || '';
  if (
    code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('violates row-level')
  )
    return 'Izin ditolak. Pastikan kamu login sebagai admin.';
  if (msg.includes('fetch') || msg.includes('network'))
    return 'Jaringan bermasalah. Coba lagi sebentar.';
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
      const { data, error: err } = await withTimeout(
        supabase
          .from('items')
          .select('*')
          .order('downloads', { ascending: false })
          .limit(MAX_DOCS * COLLECTIONS.length),
        25000,
        'Memuat katalog'
      );
      if (err) throw err;
      const next = { apps: [], games: [], tools: [] };
      for (const row of data || []) {
        if (next[row.collection]) next[row.collection].push(norm(row));
      }
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

  // Naikkan counter download (via rpc aman, boleh publik).
  const bumpDownloads = useCallback(
    async (item) => {
      bumpLocal(item.key);
      try {
        await withTimeout(
          supabase.rpc('bump_downloads', { p_item: item.id }),
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
    const { data, error: err } = await withTimeout(
      supabase.rpc('submit_review', {
        p_item: item.id,
        p_user: user,
        p_rating: rating,
        p_comment: comment,
      }),
      25000,
      'Mengirim ulasan'
    );
    if (err) throw err;
    return { next: data.reviews || [], rounded: data.rating || 0 };
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

  // Dipakai Editor (tambah + edit). id null = baris baru.
  const saveItem = useCallback(
    async (collectionId, id, fields) => {
      try {
        if (id) {
          const { error: err } = await withTimeout(
            supabase
              .from('items')
              .update(toRow(collectionId, fields, false))
              .eq('id', id),
            25000,
            'Menyimpan perubahan'
          );
          if (err) throw err;
          const current = (items[collectionId] || []).find(
            (it) => it.id === id
          );
          upsertLocal(collectionId, {
            ...(current || {
              id,
              key: `${collectionId}/${id}`,
              collection: collectionId,
            }),
            ...fields,
            updatedAt: new Date(),
          });
          refresh({ silent: true });
          return { ok: true, id };
        }
        const { data, error: err } = await withTimeout(
          supabase
            .from('items')
            .insert(toRow(collectionId, fields, true))
            .select('id')
            .single(),
          25000,
          'Menyimpan mod'
        );
        if (err) throw err;
        const now = new Date();
        upsertLocal(
          collectionId,
          norm({
            id: data.id,
            collection: collectionId,
            ...toRow(collectionId, fields, true),
            rating: Number(fields.rating) || 0,
            downloads: Number(fields.downloads) || 0,
            featured: Number(fields.featured) || 0,
            reviews: [],
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
        );
        refresh({ silent: true });
        return { ok: true, id: data.id };
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
        const { error: err } = await withTimeout(
          supabase.from('items').delete().eq('id', id),
          25000,
          'Menghapus'
        );
        if (err) throw err;
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
