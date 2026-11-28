-- =====================================================================
-- ICpEP.SE CIT-U Portal — Migration 0007
-- Full Mail System: starred, drafts, trash, forward support
-- Extends the existing messages / message_recipients tables
-- =====================================================================

-- ── 1. Add mail-system columns to message_recipients (safe, idempotent) ──────
alter table public.message_recipients
  add column if not exists is_starred   boolean not null default false,
  add column if not exists folder       text    not null default 'inbox'
    check (folder in ('inbox','trash'));

-- ── 2. Add columns to messages for drafts & forward support ──────────────────
alter table public.messages
  add column if not exists is_draft     boolean not null default false,
  add column if not exists is_forward   boolean not null default false,
  add column if not exists forward_of   bigint  references public.messages(id) on delete set null;

-- ── 3. Draft table (unsent, per-user) ────────────────────────────────────────
create table if not exists public.mail_drafts (
  id              bigint generated always as identity primary key,
  owner_id        uuid   not null references public.profiles(id) on delete cascade,
  to_ids          uuid[] not null default '{}',
  subject         text   not null default '',
  body            text   not null default '',
  parent_id       bigint references public.messages(id) on delete set null,
  is_forward      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists mail_drafts_owner_idx on public.mail_drafts(owner_id);

-- ── 4. RLS on mail_drafts ─────────────────────────────────────────────────────
alter table public.mail_drafts enable row level security;

drop policy if exists mail_drafts_owner on public.mail_drafts;
create policy mail_drafts_owner on public.mail_drafts
  for all to authenticated
  using  (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.mail_drafts to authenticated;

-- ── 5. Helper: toggle star on a received message ──────────────────────────────
create or replace function public.toggle_mail_star(p_message_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_new boolean;
begin
  update message_recipients
  set    is_starred = not is_starred
  where  message_id = p_message_id
    and  recipient_id = auth.uid()
  returning is_starred into v_new;
  return coalesce(v_new, false);
end;
$$;

-- ── 6. Helper: move received message to trash / restore to inbox ──────────────
create or replace function public.set_mail_folder(p_message_id bigint, p_folder text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update message_recipients
  set    folder     = p_folder,
         deleted_at = case when p_folder = 'trash' then now() else null end
  where  message_id = p_message_id
    and  recipient_id = auth.uid();
end;
$$;

-- ── 7. Helper: permanently delete a message from trash ───────────────────────
create or replace function public.permanent_delete_mail(p_message_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Only allow if the row is already in trash
  delete from message_recipients
  where  message_id  = p_message_id
    and  recipient_id = auth.uid()
    and  folder       = 'trash';

  -- Also allow sender to hard-delete their own sent copy
  update messages
  set    sender_deleted_at = now()
  where  id        = p_message_id
    and  sender_id = auth.uid();
end;
$$;

-- ── 8. Helper: save / upsert a draft ─────────────────────────────────────────
create or replace function public.save_draft(
  p_draft_id  bigint,       -- NULL = new draft
  p_to_ids    uuid[],
  p_subject   text,
  p_body      text,
  p_parent_id bigint,
  p_is_forward boolean
) returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if p_draft_id is not null then
    update mail_drafts
    set    to_ids     = p_to_ids,
           subject    = p_subject,
           body       = p_body,
           parent_id  = p_parent_id,
           is_forward = p_is_forward,
           updated_at = now()
    where  id = p_draft_id and owner_id = auth.uid()
    returning id into v_id;
  end if;

  if v_id is null then
    insert into mail_drafts (owner_id, to_ids, subject, body, parent_id, is_forward)
    values (auth.uid(), p_to_ids, p_subject, p_body, p_parent_id, p_is_forward)
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

-- ── 9. Helper: delete a draft ─────────────────────────────────────────────────
create or replace function public.delete_draft(p_draft_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from mail_drafts where id = p_draft_id and owner_id = auth.uid();
end;
$$;

-- ── 10. Grant execute on new functions ────────────────────────────────────────
grant execute on function public.toggle_mail_star(bigint)             to authenticated;
grant execute on function public.set_mail_folder(bigint, text)        to authenticated;
grant execute on function public.permanent_delete_mail(bigint)        to authenticated;
grant execute on function public.save_draft(bigint,uuid[],text,text,bigint,boolean) to authenticated;
grant execute on function public.delete_draft(bigint)                 to authenticated;

notify pgrst, 'reload schema';

