-- ============================================================
-- VAN MOD — Skema Supabase (migrasi total dari Firebase)
-- Cara pakai: Supabase Dashboard → SQL Editor → New query →
-- paste SELURUH file ini → Run. Dijalankan sekali saja.
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------
-- TABEL
-- ----------------------------------------------------------

-- Profil user (1 baris per akun auth, dibuat otomatis via trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text default '',
  display_name text default 'Anonim',
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

-- Katalog (menggantikan koleksi Firestore apps/games/tools)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (collection in ('apps', 'games', 'tools')),
  name text default 'Untitled' not null,
  description text default '' not null,
  category text default '' not null,
  version text default '' not null,
  size text default '' not null,
  mod_type text default '' not null,
  developer text default '' not null,
  package_name text default '' not null,
  min_android text default '' not null,
  license text default '' not null,
  download_url text default '' not null,
  icon text default '' not null,
  file_kind text default 'apk' not null,
  rating float default 0 not null,
  downloads integer default 0 not null,
  featured integer default 0 not null,
  tags text[] default '{}' not null,
  screenshots text[] default '{}' not null,
  reviews jsonb default '[]' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists items_collection_downloads_idx
  on public.items (collection, downloads desc);
create index if not exists items_updated_idx on public.items (updated_at desc);

-- Pesan kontak masuk
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text default '' not null,
  email text default '' not null,
  message text default '' not null,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

-- Forum chat umum
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  text text default '' not null,
  image_url text default '' not null,
  user_id uuid not null,
  name text default 'Anonim' not null,
  email text default '' not null,
  reply_to jsonb,
  forwarded boolean default false not null,
  forwarded_from text default '' not null,
  created_at timestamptz default now() not null
);
create index if not exists messages_created_idx on public.messages (created_at desc);

-- Thread chat privat (id = gabungan 2 uid, mis. aaa_bbb)
create table if not exists public.dm_threads (
  id text primary key,
  members uuid[] not null,
  names jsonb default '{}' not null,
  emails jsonb default '{}' not null,
  last_text text default '' not null,
  last_by uuid,
  updated_at timestamptz default now() not null
);

-- Pesan chat privat
create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null references public.dm_threads (id) on delete cascade,
  text text default '' not null,
  image_url text default '' not null,
  user_id uuid not null,
  name text default 'Anonim' not null,
  email text default '' not null,
  members uuid[] not null,
  created_at timestamptz default now() not null
);
create index if not exists dm_messages_thread_idx
  on public.dm_messages (thread_id, created_at asc);

-- Indikator "sedang mengetik" (data sementara)
create table if not exists public.typing (
  id text primary key,
  user_id uuid not null,
  name text default 'Anonim' not null,
  scope text default 'forum' not null,
  updated_at timestamptz default now() not null
);
create index if not exists typing_scope_idx on public.typing (scope);

-- ----------------------------------------------------------
-- FUNGSI BANTU
-- ----------------------------------------------------------

-- Cek admin (security definer agar tidak rekursi RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Auto updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_items_updated on public.items;
create trigger trg_items_updated before update on public.items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_dm_threads_updated on public.dm_threads;
create trigger trg_dm_threads_updated before update on public.dm_threads
  for each row execute function public.set_updated_at();

drop trigger if exists trg_typing_updated on public.typing;
create trigger trg_typing_updated before update on public.typing
  for each row execute function public.set_updated_at();

-- Buat baris profil otomatis saat user daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Anonim'
    ), 40)
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cegah user mengangkat dirinya jadi admin
create or replace function public.protect_admin_flag()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.is_admin is distinct from new.is_admin and not public.is_admin() then
    raise exception 'Hanya admin yang bisa ubah flag admin';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_admin on public.profiles;
create trigger trg_profiles_admin before update on public.profiles
  for each row execute function public.protect_admin_flag();

-- Naikkan counter download (dipanggil publik via rpc, aman)
create or replace function public.bump_downloads(p_item uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.items set downloads = downloads + 1 where id = p_item;
$$;
grant execute on function public.bump_downloads(uuid) to anon, authenticated;

-- Kirim ulasan + hitung ulang rating (dipanggil publik via rpc, aman)
create or replace function public.submit_review(
  p_item uuid, p_user text, p_rating int, p_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviews jsonb;
  v_next jsonb;
  v_avg float;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating harus 1-5';
  end if;
  if char_length(coalesce(p_comment, '')) > 2000 then
    raise exception 'Komentar terlalu panjang';
  end if;
  select coalesce(reviews, '[]'::jsonb) into v_reviews
    from public.items where id = p_item;
  if not found then
    raise exception 'Item tidak ditemukan';
  end if;
  v_next := v_reviews || jsonb_build_array(jsonb_build_object(
    'id', 'r-' || (extract(epoch from now()) * 1000)::bigint,
    'user', left(coalesce(p_user, 'Anonim'), 40),
    'rating', p_rating,
    'comment', left(coalesce(p_comment, ''), 2000),
    'createdAt', now()
  ));
  select coalesce(avg((r ->> 'rating')::float), 0) into v_avg
    from jsonb_array_elements(v_next) r;
  v_avg := round(v_avg * 10) / 10;
  update public.items
    set reviews = v_next, rating = v_avg, updated_at = now()
    where id = p_item;
  return jsonb_build_object('reviews', v_next, 'rating', v_avg);
end;
$$;
grant execute on function public.submit_review(uuid, text, int, text)
  to anon, authenticated;

-- ----------------------------------------------------------
-- ROW LEVEL SECURITY (pengganti firestore.rules)
-- ----------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;
alter table public.typing enable row level security;

-- profiles: baca publik, ubah milik sendiri / admin
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select to anon, authenticated using (true);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- items: baca publik, tulis admin (publik via rpc saja)
drop policy if exists "items_read" on public.items;
create policy "items_read" on public.items
  for select to anon, authenticated using (true);
drop policy if exists "items_admin_write" on public.items;
create policy "items_admin_write" on public.items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- contacts: kirim publik, kelola admin
drop policy if exists "contacts_insert" on public.contacts;
create policy "contacts_insert" on public.contacts
  for insert to anon, authenticated with check (true);
drop policy if exists "contacts_admin" on public.contacts;
create policy "contacts_admin" on public.contacts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- messages (forum): baca publik, kirim login, hapus pemilik/admin
drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages
  for select to anon, authenticated using (true);
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages
  for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- typing: baca publik, tulis login
drop policy if exists "typing_read" on public.typing;
create policy "typing_read" on public.typing
  for select to anon, authenticated using (true);
drop policy if exists "typing_write" on public.typing;
create policy "typing_write" on public.typing
  for all to authenticated
  using (true)
  with check (true);

-- dm_threads: hanya anggota
drop policy if exists "dm_threads_member" on public.dm_threads;
create policy "dm_threads_member" on public.dm_threads
  for all to authenticated
  using (auth.uid() = any (members))
  with check (auth.uid() = any (members));

-- dm_messages: hanya anggota, hapus pemilik/admin
drop policy if exists "dm_messages_read" on public.dm_messages;
create policy "dm_messages_read" on public.dm_messages
  for select to authenticated
  using (auth.uid() = any (members));
drop policy if exists "dm_messages_insert" on public.dm_messages;
create policy "dm_messages_insert" on public.dm_messages
  for insert to authenticated
  with check (auth.uid() = any (members) and auth.uid() = user_id);
drop policy if exists "dm_messages_delete" on public.dm_messages;
create policy "dm_messages_delete" on public.dm_messages
  for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------
-- STORAGE (pengganti storage.rules)
-- ----------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('icons', 'icons', true),
  ('screenshots', 'screenshots', true),
  ('apks', 'apks', true),
  ('chat', 'chat', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('icons', 'screenshots', 'apks', 'chat'));

drop policy if exists "storage_admin_insert" on storage.objects;
create policy "storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('icons', 'screenshots', 'apks') and public.is_admin()
  );

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('icons', 'screenshots', 'apks') and public.is_admin()
  )
  with check (
    bucket_id in ('icons', 'screenshots', 'apks') and public.is_admin()
  );

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('icons', 'screenshots', 'apks', 'chat')
    and public.is_admin()
  );

drop policy if exists "storage_chat_insert" on storage.objects;
create policy "storage_chat_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat');

drop policy if exists "storage_chat_update" on storage.objects;
create policy "storage_chat_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'chat')
  with check (bucket_id = 'chat');

-- ----------------------------------------------------------
-- REALTIME (agar chat/notifikasi langsung muncul)
-- ----------------------------------------------------------

alter publication supabase_realtime add table
  public.messages, public.dm_messages, public.dm_threads, public.typing;

-- ============================================================
-- SELESAI. Langkah terakhir (via SQL Editor, setelah daftar
-- akun admin di web):
--   update public.profiles set is_admin = true
--   where email = 'vanxmod313@gmail.com';
-- ============================================================
