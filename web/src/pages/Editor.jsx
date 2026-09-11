import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { COLLECTIONS, COLLECTION_LABELS } from '../config.js';
import { useAuth } from '../lib/auth.jsx';
import { useStore } from '../lib/store.jsx';
import { ArrowLeft, Check } from '../components/icons.jsx';
import { Kicker, NetworkIcon } from '../components/ui.jsx';

const BLANK = {
  collection: 'apps',
  name: '',
  icon: '',
  file: '',
  description: '',
  version: '',
  size: '',
  category: '',
  modType: '',
  developer: '',
  minAndroid: '',
  featured: '0',
  rating: '4.5',
  downloads: '0',
  screenshots: '',
  tags: '',
};

export default function Editor() {
  const { collection, id } = useParams();
  const isEdit = Boolean(id);
  const { isAdmin, authLoading } = useAuth();
  const { findByKey, saveItem, ready } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState(BLANK);
  const [loaded, setLoaded] = useState(!isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!isEdit || !ready || loaded) return;
    if (!COLLECTIONS.includes(collection)) {
      setMissing(true);
      return;
    }
    const item = findByKey(`${collection}/${id}`);
    if (!item) {
      setMissing(true);
      return;
    }
    setForm({
      collection: item.collection,
      name: item.name,
      icon: item.icon,
      file: item.file,
      description: item.description,
      version: item.version,
      size: item.size,
      category: item.category,
      modType: item.modType,
      developer: item.developer,
      minAndroid: item.minAndroid,
      featured: String(item.featured || 0),
      rating: String(item.rating || 0),
      downloads: String(item.downloads || 0),
      screenshots: (item.screenshots || []).join('\n'),
      tags: (item.tags || []).join(', '),
    });
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, ready, collection, id]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/admin" replace />;
  if (missing) return <Navigate to="/404" replace />;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Nama wajib diisi.');
      return;
    }
    if (!form.file.trim()) {
      setError('Link file APK wajib diisi.');
      return;
    }
    if (form.icon && !/^https?:\/\//i.test(form.icon.trim())) {
      setError('Link icon harus URL http(s).');
      return;
    }
    if (!/^https?:\/\//i.test(form.file.trim())) {
      setError('Link file harus URL http(s).');
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      icon: form.icon.trim(),
      file: form.file.trim(),
      description: form.description.trim(),
      version: form.version.trim(),
      size: form.size.trim(),
      category: form.category.trim(),
      modType: form.modType.trim(),
      developer: form.developer.trim(),
      minAndroid: form.minAndroid.trim(),
      featured: Number(form.featured) || 0,
      rating: Math.max(0, Math.min(5, Number(form.rating) || 0)),
      downloads: Math.max(0, Math.floor(Number(form.downloads) || 0)),
      screenshots: form.screenshots
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const r = isEdit
      ? await saveItem(collection, id, payload)
      : await saveItem(form.collection, null, payload);
    setBusy(false);
    if (r.ok) {
      navigate('/admin/dashboard');
    } else {
      setError(r.error || 'Gagal menyimpan.');
    }
  }

  return (
    <div className="editor">
      <div style={{ paddingTop: 26 }}>
        <Kicker>{isEdit ? '// EDIT MOD' : '// MOD BARU'}</Kicker>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8 }}>
          {isEdit ? 'Edit Item' : 'Tambah Mod'}
        </h1>
      </div>

      {!loaded ? (
        <div style={{ color: 'var(--muted)', marginTop: 20 }}>Memuat…</div>
      ) : (
        <form onSubmit={submit} className="form neo" style={{ padding: 22, marginTop: 16 }}>
          {!isEdit && (
            <label>
              Koleksi
              <select
                value={form.collection}
                onChange={(e) => set('collection', e.target.value)}
              >
                {COLLECTIONS.map((c) => (
                  <option key={c} value={c}>
                    {COLLECTION_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Nama *
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="CapCut Pro MOD"
            />
          </label>
          <label>
            Link icon (URL gambar)
            <input
              value={form.icon}
              onChange={(e) => set('icon', e.target.value)}
              placeholder="https://…/icon.png"
            />
          </label>
          {form.icon.trim() && (
            <div className="url-preview">
              <NetworkIcon url={form.icon.trim()} size={52} />
              <span className="hint">Pratinjau icon</span>
            </div>
          )}
          <label>
            Link file APK *
            <input
              required
              value={form.file}
              onChange={(e) => set('file', e.target.value)}
              placeholder="https://…/app-mod.apk"
            />
            <span className="hint">
              Tempel URL langsung (MediaFire, Google Drive direct, dll).
            </span>
          </label>
          <label>
            Deskripsi
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Fitur mod, changelog, catatan…"
            />
          </label>
          <div className="form-row">
            <label>
              Versi
              <input
                value={form.version}
                onChange={(e) => set('version', e.target.value)}
                placeholder="12.3.0"
              />
            </label>
            <label>
              Ukuran
              <input
                value={form.size}
                onChange={(e) => set('size', e.target.value)}
                placeholder="85 MB"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Kategori
              <input
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="Video Editor"
              />
            </label>
            <label>
              Tipe mod
              <input
                value={form.modType}
                onChange={(e) => set('modType', e.target.value)}
                placeholder="Premium Unlocked"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Developer
              <input
                value={form.developer}
                onChange={(e) => set('developer', e.target.value)}
                placeholder="Bytedance"
              />
            </label>
            <label>
              Android min.
              <input
                value={form.minAndroid}
                onChange={(e) => set('minAndroid', e.target.value)}
                placeholder="Android 7.0+"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Rating (0–5)
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => set('rating', e.target.value)}
              />
            </label>
            <label>
              Unduhan awal
              <input
                type="number"
                min="0"
                value={form.downloads}
                onChange={(e) => set('downloads', e.target.value)}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Prioritas Featured
              <input
                type="number"
                min="0"
                value={form.featured}
                onChange={(e) => set('featured', e.target.value)}
              />
              <span className="hint">0 = tidak tampil di Featured.</span>
            </label>
            <label>
              Tag (pisah koma)
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="editor, video, premium"
              />
            </label>
          </div>
          <label>
            Screenshot (satu URL per baris)
            <textarea
              rows={3}
              value={form.screenshots}
              onChange={(e) => set('screenshots', e.target.value)}
              placeholder={'https://…/shot1.jpg\nhttps://…/shot2.jpg'}
            />
          </label>

          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <Link className="btn btn-line" to="/admin/dashboard">
              <ArrowLeft size={16} /> Batal
            </Link>
            <button className="btn btn-lime" disabled={busy}>
              {busy ? (
                'Menyimpan…'
              ) : (
                <>
                  <Check size={16} />{' '}
                  {isEdit ? 'Simpan Perubahan' : 'Terbitkan Mod'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
