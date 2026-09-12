import { supabase } from './supabase.js';
import { cleanName, uploadFile } from './storage.js';

// Kirim pesan forum. user = { uid, email, displayName } dari useAuth.
export async function sendChatMessage({
  user,
  text = '',
  imageUrl = '',
  replyTo = null,
  forwarded = false,
  forwardedFrom = '',
}) {
  const clean = (text || '').trim().slice(0, 2000);
  if (!clean && !imageUrl) throw new Error('Pesan kosong.');
  const { error } = await supabase.from('messages').insert({
    text: clean,
    image_url: imageUrl || '',
    user_id: user.uid,
    name: (user.displayName || 'Anonim').slice(0, 40),
    email: user.email || '',
    reply_to: replyTo
      ? {
          id: replyTo.id,
          name: (replyTo.name || 'Anonim').slice(0, 40),
          text: (replyTo.text || '').slice(0, 140),
          hasImage: !!replyTo.imageUrl,
        }
      : null,
    forwarded: !!forwarded,
    forwarded_from: (forwardedFrom || '').slice(0, 40),
  });
  if (error) throw new Error(error.message);
}

// Hapus pesan (RLS: pemilik pesan atau admin).
export async function deleteChatMessage(id) {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Upload gambar chat ke Storage bucket chat/ (maks 2MB, dicek klien).
export function uploadChatImage(file, onProgress) {
  return uploadFile(
    `chat/${Date.now()}-${cleanName(file.name)}`,
    file,
    onProgress
  );
}

function normRow(r) {
  return {
    id: r.id,
    text: r.text || '',
    imageUrl: r.image_url || '',
    uid: r.user_id,
    name: r.name || 'Anonim',
    email: r.email || '',
    replyTo: r.reply_to
      ? {
          id: r.reply_to.id,
          name: r.reply_to.name,
          text: r.reply_to.text,
          hasImage: !!r.reply_to.hasImage,
        }
      : null,
    forwarded: !!r.forwarded,
    forwardedFrom: r.forwarded_from || '',
    createdAt: r.created_at,
  };
}

// Pantau forum: ambil 100 terakhir + muat ulang tiap ada perubahan.
export function watchForumMessages(cb, onError) {
  let alive = true;
  async function load() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (!alive) return;
    if (error) {
      onError?.(error);
      return;
    }
    cb((data || []).map(normRow));
  }
  load();
  const ch = supabase
    .channel('forum')
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
}
