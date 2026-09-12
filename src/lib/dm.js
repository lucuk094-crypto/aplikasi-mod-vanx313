import { supabase } from './supabase.js';
import { cleanName, uploadFile } from './storage.js';

// ID thread deterministik dari dua uid (urutan bebas, hasil sama).
export function threadIdFor(a, b) {
  return [a, b].sort().join('_');
}

function tsOf(v) {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function normMsg(r) {
  return {
    id: r.id,
    thread_id: r.thread_id,
    text: r.text || '',
    imageUrl: r.image_url || '',
    uid: r.user_id,
    name: r.name || 'Anonim',
    email: r.email || '',
    members: r.members || [],
    createdAt: r.created_at,
  };
}

// Daftar thread milik user (RLS otomatis hanya kembalikan milik anggota).
export function watchThreads(uid, cb, onError) {
  let alive = true;
  async function load() {
    const { data, error } = await supabase
      .from('dm_threads')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30);
    if (!alive) return;
    if (error) {
      onError?.(error);
      return;
    }
    const list = (data || [])
      .filter((t) => (t.members || []).includes(uid))
      .sort((a, b) => tsOf(b.updated_at) - tsOf(a.updated_at));
    cb(list);
  }
  load();
  const ch = supabase
    .channel('dm-threads')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dm_threads' },
      () => load()
    )
    .subscribe();
  return () => {
    alive = false;
    supabase.removeChannel(ch);
  };
}

// Pesan dalam satu thread (real-time).
export function watchThreadMessages(threadId, cb, onError) {
  let alive = true;
  async function load() {
    const { data, error } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (!alive) return;
    if (error) {
      onError?.(error);
      return;
    }
    cb((data || []).map(normMsg));
  }
  load();
  const ch = supabase
    .channel(`dm-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dm_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      () => load()
    )
    .subscribe();
  return () => {
    alive = false;
    supabase.removeChannel(ch);
  };
}

// Kirim pesan DM + update ringkasan thread.
export async function sendDM({ threadId, user, peer, text = '', imageUrl = '' }) {
  const clean = (text || '').trim().slice(0, 2000);
  if (!clean && !imageUrl) throw new Error('Pesan kosong.');
  const members = [user.uid, peer.uid].sort();
  const { error } = await supabase.from('dm_messages').insert({
    thread_id: threadId,
    text: clean,
    image_url: imageUrl || '',
    user_id: user.uid,
    name: (user.displayName || 'Anonim').slice(0, 40),
    email: user.email || '',
    members,
  });
  if (error) throw new Error(error.message);
  const { error: err2 } = await supabase.from('dm_threads').upsert(
    {
      id: threadId,
      members,
      names: {
        [user.uid]: (user.displayName || 'Anonim').slice(0, 40),
        [peer.uid]: (peer.name || 'Pengguna').slice(0, 40),
      },
      emails: {
        [user.uid]: user.email || '',
        [peer.uid]: peer.email || '',
      },
      last_text: (clean || '📷 Gambar').slice(0, 120),
      last_by: user.uid,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (err2) throw new Error(err2.message);
}

// Hapus pesan DM milik sendiri.
export async function deleteDM(threadId, id) {
  const { error } = await supabase
    .from('dm_messages')
    .delete()
    .eq('id', id)
    .eq('thread_id', threadId);
  if (error) throw new Error(error.message);
}

// Upload gambar DM (pakai bucket chat/ yang sama dengan forum).
export function uploadDMImage(file, onProgress) {
  return uploadFile(
    `chat/${Date.now()}-${cleanName(file.name)}`,
    file,
    onProgress
  );
}
