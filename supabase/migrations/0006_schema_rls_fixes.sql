-- =====================================================================
-- ICpEP.SE CIT-U Organization Portal — Migration 0006
-- Schema, RLS & RPC Fixes for Recent Features:
--   1. Allow faculty to create/update events & posts and read dashboard counts
--   2. Allow admin to send messages via send_message()
--   3. Add updated_at trigger on post_comments
--   4. Add safe public_author_profiles view for feed/comment author display
--   5. Ensure Realtime publication for messages & message_recipients
-- =====================================================================

-- 1. Faculty content management (events & posts) and read-only dashboard counts
create or replace function public.is_content_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('officer', 'faculty', 'admin'), false)
$$;

drop policy if exists events_staff_insert on public.events;
create policy events_staff_insert on public.events
  for insert to authenticated
  with check (public.is_content_manager() and created_by = auth.uid());

drop policy if exists events_staff_update on public.events;
create policy events_staff_update on public.events
  for update to authenticated
  using (public.is_content_manager())
  with check (public.is_content_manager());

drop policy if exists posts_staff_insert on public.posts;
create policy posts_staff_insert on public.posts
  for insert to authenticated
  with check (public.is_content_manager() and author_id = auth.uid());

drop policy if exists posts_staff_update on public.posts;
create policy posts_staff_update on public.posts
  for update to authenticated
  using (public.is_content_manager())
  with check (public.is_content_manager());

drop policy if exists posts_staff_delete on public.posts;
create policy posts_staff_delete on public.posts
  for delete to authenticated
  using (public.is_content_manager());

-- Allow faculty to read all events/posts (including drafts/archived) and dashboard counts
drop policy if exists events_auth_read on public.events;
create policy events_auth_read on public.events
  for select to authenticated
  using (
    public.is_content_manager()
    or (status = 'published' and (visibility = 'public' or public.can_view_members_only()))
  );

drop policy if exists posts_auth_read on public.posts;
create policy posts_auth_read on public.posts
  for select to authenticated
  using (
    public.is_content_manager()
    or (status = 'published' and (visibility = 'public' or public.can_view_members_only()))
  );

drop policy if exists memberships_faculty_read on public.memberships;
create policy memberships_faculty_read on public.memberships
  for select to authenticated
  using (public.auth_role() = 'faculty');

drop policy if exists applications_faculty_read on public.membership_applications;
create policy applications_faculty_read on public.membership_applications
  for select to authenticated
  using (public.auth_role() = 'faculty');

-- 2. Allow admin to send messages too (alongside non_member, member, officer, faculty)
create or replace function public.send_message(
  p_recipient_ids uuid[], p_subject text, p_body text, p_parent_id bigint default null
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id     bigint;
  v_wanted int;
  v_valid  int;
begin
  if public.auth_role() is null
     or public.auth_role() not in ('non_member', 'member', 'officer', 'faculty', 'admin') then
    raise exception 'Your role cannot send messages';
  end if;

  select count(distinct x) into v_wanted from unnest(p_recipient_ids) x where x <> auth.uid();
  select count(*) into v_valid from profiles
   where id = any (p_recipient_ids) and is_active and id <> auth.uid();
  if v_wanted = 0 or v_wanted <> v_valid then
    raise exception 'One or more recipients are invalid or inactive';
  end if;

  insert into messages (sender_id, parent_id, subject, body)
  values (auth.uid(), p_parent_id, p_subject, p_body) returning id into v_id;

  insert into message_recipients (message_id, recipient_id)
  select v_id, p.id from profiles p
   where p.id = any (p_recipient_ids) and p.is_active and p.id <> auth.uid();
  return v_id;
end $$;

-- 3. updated_at trigger on post_comments
drop trigger if exists trg_post_comments_updated on public.post_comments;
create trigger trg_post_comments_updated
  before update on public.post_comments
  for each row execute function public.set_updated_at();

-- 4. Safe author profile view for feed posts & comments (no sensitive PII)
create or replace view public.public_author_profiles as
select p.id, p.first_name, p.last_name, p.avatar_url,
       r.code as role_code, r.name as role_name
  from public.profiles p
  join public.roles r on r.id = p.role_id
 where p.is_active;

grant select on public.public_author_profiles to anon, authenticated;

-- 5. Ensure Supabase Realtime & message preview notifications are active
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.message_recipients;
exception
  when duplicate_object then null;
end $$;

create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, type, title, body, link_url, entity_type, entity_id)
  select new.recipient_id, 'new_message',
         'New message from ' || coalesce(p.first_name || ' ' || p.last_name, 'a member'),
         left(m.body, 160), '/inbox/' || m.id, 'message', m.id
    from messages m left join profiles p on p.id = m.sender_id
   where m.id = new.message_id;
  return new;
end $$;

notify pgrst, 'reload schema';
