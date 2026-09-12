import { supabase } from './supabase.js';

const lastTouch = {};

function typingId(uid, threadId) {
  return threadId ? `dm_${threadId}_${uid}` : `forum_${uid}`;
}

// Catat "sedang mengetik" (di-throttle 3 detik biar hemat tulis).
export async function touchTyping(uid, name, threadId = null) {
  const id = typingId(uid, threadId);
  const now = Date.now();
  if (lastTouch[id] && now - lastTouch[id] < 3000) return;
  lastTouch[id] = now;
  try {
    await supabase.from('typing').upsert(
      {
        id,
        user_id: uid,
        name: (name || 'Anonim').slice(0, 40),
        scope: threadId || 'forum',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch {
    // abaikan: indikator tidak kritis
  }
}

// Hapus status mengetik (habis kirim / keluar).
export async function clearTyping(uid, threadId = null) {
  const id = typingId(uid, threadId);
  delete lastTouch[id];
  try {
    await supabase.from('typing').delete().eq('id', id);
  } catch {
    // abaikan
  }
}

// Pantau siapa yang mengetik di forum (threadId null) atau thread DM.
// Hanya yang segar (<6 detik) yang dilaporkan.
export function watchTyping(threadId, cb) {
  const scope = threadId || 'forum';
  let alive = true;
  async function load() {
    const { data } = await supabase
      .from('typing')
      .select('*')
      .eq('scope', scope)
      .limit(20);
    if (!alive) return;
    const now = Date.now();
    const list = [];
    for (const m of data || []) {
      const t = new Date(m.updated_at).getTime();
      if (!Number.isNaN(t) && now - t < 6000) {
        list.push({ id: m.id, uid: m.user_id, name: m.name || 'Anonim' });
      }
    }
    cb(list);
  }
  load();
  const timer = setInterval(load, 3000);
  const ch = supabase
    .channel(`typing-${scope}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing',
        filter: `scope=eq.${scope}`,
      },
      () => load()
    )
    .subscribe();
  return () => {
    alive = false;
    clearInterval(timer);
    supabase.removeChannel(ch);
  };
}
