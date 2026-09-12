import { supabase } from './supabase.js';

// Kirim pesan kontak (RLS: publik boleh insert).
export async function sendMessage({ name, email, message }) {
  const { error } = await supabase.from('contacts').insert({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    read: false,
  });
  if (error) throw new Error(error.message);
}

// Baca semua pesan (admin, login wajib).
export async function fetchContacts() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    read: !!r.read,
    createdAt: new Date(r.created_at),
  }));
}

export async function markContactRead(id, read = true) {
  const { error } = await supabase
    .from('contacts')
    .update({ read })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteContact(id) {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
