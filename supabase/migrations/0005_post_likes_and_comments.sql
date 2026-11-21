-- Migration 0005: Likes and Comments for Instagram-style Feed

create table if not exists public.post_likes (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.post_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

-- Likes policies
drop policy if exists post_likes_read on public.post_likes;
create policy post_likes_read on public.post_likes for select to authenticated using (true);

drop policy if exists post_likes_anon_read on public.post_likes;
create policy post_likes_anon_read on public.post_likes for select to anon using (true);

drop policy if exists post_likes_insert on public.post_likes;
create policy post_likes_insert on public.post_likes for insert to authenticated with check (user_id = auth.uid());

drop policy if exists post_likes_delete on public.post_likes;
create policy post_likes_delete on public.post_likes for delete to authenticated using (user_id = auth.uid());

-- Comments policies
drop policy if exists post_comments_read on public.post_comments;
create policy post_comments_read on public.post_comments for select to authenticated using (true);

drop policy if exists post_comments_anon_read on public.post_comments;
create policy post_comments_anon_read on public.post_comments for select to anon using (true);

drop policy if exists post_comments_insert on public.post_comments;
create policy post_comments_insert on public.post_comments for insert to authenticated with check (author_id = auth.uid());

drop policy if exists post_comments_delete on public.post_comments;
create policy post_comments_delete on public.post_comments for delete to authenticated using (author_id = auth.uid() or public.is_staff());

grant select, insert, delete on public.post_likes to authenticated;
grant select on public.post_likes to anon;
grant select, insert, delete on public.post_comments to authenticated;
grant select on public.post_comments to anon;
