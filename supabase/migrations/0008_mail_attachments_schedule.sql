-- Attachments and server-side scheduled delivery for internal mail.

create table if not exists public.mail_scheduled (
  id              bigint generated always as identity primary key,
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  to_ids          uuid[] not null,
  subject         text not null,
  body            text not null,
  parent_id       bigint references public.messages(id) on delete set null,
  send_at         timestamptz not null,
  status          text not null default 'queued'
                    check (status in ('queued', 'sent', 'failed')),
  message_id      bigint references public.messages(id) on delete set null,
  failure_reason  text,
  created_at      timestamptz not null default now(),
  check (cardinality(to_ids) > 0)
);

create index if not exists mail_scheduled_due_idx
  on public.mail_scheduled(send_at) where status = 'queued';
create index if not exists mail_scheduled_owner_idx
  on public.mail_scheduled(owner_id, send_at desc);

create table if not exists public.mail_attachments (
  id            bigint generated always as identity primary key,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  draft_id      bigint references public.mail_drafts(id) on delete cascade,
  scheduled_id  bigint references public.mail_scheduled(id) on delete cascade,
  message_id    bigint references public.messages(id) on delete cascade,
  object_path   text not null unique,
  file_name     text not null,
  content_type  text not null,
  size_bytes    bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  created_at    timestamptz not null default now(),
  check (num_nonnulls(draft_id, scheduled_id, message_id) = 1)
);

create index if not exists mail_attachments_draft_idx
  on public.mail_attachments(draft_id) where draft_id is not null;
create index if not exists mail_attachments_scheduled_idx
  on public.mail_attachments(scheduled_id) where scheduled_id is not null;
create index if not exists mail_attachments_message_idx
  on public.mail_attachments(message_id) where message_id is not null;

alter table public.mail_scheduled enable row level security;
alter table public.mail_attachments enable row level security;

drop policy if exists mail_scheduled_owner_read on public.mail_scheduled;
create policy mail_scheduled_owner_read on public.mail_scheduled
  for select to authenticated using (owner_id = auth.uid());
grant select on public.mail_scheduled to authenticated;

drop policy if exists mail_attachments_read on public.mail_attachments;
create policy mail_attachments_read on public.mail_attachments
  for select to authenticated using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.messages m
      where m.id = mail_attachments.message_id and m.sender_id = auth.uid()
    )
    or exists (
      select 1 from public.message_recipients mr
      where mr.message_id = mail_attachments.message_id and mr.recipient_id = auth.uid()
    )
  );

drop policy if exists mail_attachments_add_to_draft on public.mail_attachments;
create policy mail_attachments_add_to_draft on public.mail_attachments
  for insert to authenticated with check (
    owner_id = auth.uid()
    and draft_id is not null
    and exists (
      select 1 from public.mail_drafts d
      where d.id = draft_id and d.owner_id = auth.uid()
    )
    and object_path like auth.uid()::text || '/%'
  );

drop policy if exists mail_attachments_remove_owned on public.mail_attachments;
create policy mail_attachments_remove_owned on public.mail_attachments
  for delete to authenticated using (owner_id = auth.uid());
grant select, insert, delete on public.mail_attachments to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mail-attachments', 'mail-attachments', false, 20971520)
on conflict (id) do update
  set public = false, file_size_limit = 20971520;

drop policy if exists mail_attachments_upload on storage.objects;
create policy mail_attachments_upload on storage.objects
  for insert to authenticated with check (
    bucket_id = 'mail-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists mail_attachments_download on storage.objects;
create policy mail_attachments_download on storage.objects
  for select to authenticated using (
    bucket_id = 'mail-attachments'
    and exists (
      select 1 from public.mail_attachments a
      where a.object_path = storage.objects.name
        and (
          a.owner_id = auth.uid()
          or exists (
            select 1 from public.message_recipients mr
            where mr.message_id = a.message_id and mr.recipient_id = auth.uid()
          )
        )
    )
  );

drop policy if exists mail_attachments_delete on storage.objects;
create policy mail_attachments_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'mail-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.send_message(
  p_recipient_ids uuid[], p_subject text, p_body text, p_parent_id bigint default null
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
  v_wanted int;
  v_valid int;
begin
  if auth.uid() is null or not coalesce(public.auth_role() in ('member', 'officer', 'faculty'), false) then
    raise exception 'Your role cannot send mail';
  end if;
  if nullif(trim(p_subject), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Subject and body are required';
  end if;

  select count(distinct x) into v_wanted
  from unnest(coalesce(p_recipient_ids, '{}'::uuid[])) x
  where x <> auth.uid();

  select count(distinct p.id) into v_valid
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = any(coalesce(p_recipient_ids, '{}'::uuid[]))
    and p.is_active
    and p.id <> auth.uid()
    and r.code in ('member', 'officer', 'faculty');

  if v_wanted = 0 or v_wanted <> v_valid then
    raise exception 'One or more recipients are invalid, inactive, or cannot use mail';
  end if;

  insert into public.messages (sender_id, parent_id, subject, body)
  values (auth.uid(), p_parent_id, trim(p_subject), trim(p_body))
  returning id into v_id;

  insert into public.message_recipients (message_id, recipient_id)
  select v_id, p.id
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = any(p_recipient_ids)
    and p.is_active
    and p.id <> auth.uid()
    and r.code in ('member', 'officer', 'faculty');
  return v_id;
end;
$$;
grant execute on function public.send_message(uuid[], text, text, bigint) to authenticated;

create or replace function public.finalize_mail_draft_send(p_draft_id bigint, p_message_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.messages
    where id = p_message_id and sender_id = auth.uid()
  ) then
    raise exception 'Sent message not found';
  end if;

  update public.mail_attachments
  set message_id = p_message_id, draft_id = null
  where draft_id = p_draft_id and owner_id = auth.uid();

  delete from public.mail_drafts
  where id = p_draft_id and owner_id = auth.uid();
end;
$$;
grant execute on function public.finalize_mail_draft_send(bigint, bigint) to authenticated;

create or replace function public.schedule_mail(
  p_recipient_ids uuid[],
  p_subject text,
  p_body text,
  p_send_at timestamptz,
  p_draft_id bigint default null,
  p_parent_id bigint default null
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
  v_wanted int;
  v_valid int;
begin
  if auth.uid() is null or not coalesce(public.auth_role() in ('member', 'officer', 'faculty'), false) then
    raise exception 'Your role cannot schedule mail';
  end if;
  if p_send_at is null or p_send_at <= now() then
    raise exception 'Choose a future send time';
  end if;
  if nullif(trim(p_subject), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Subject and body are required';
  end if;
  if p_draft_id is not null and not exists (
    select 1 from public.mail_drafts
    where id = p_draft_id and owner_id = auth.uid()
  ) then
    raise exception 'Draft not found';
  end if;

  select count(distinct x) into v_wanted
  from unnest(coalesce(p_recipient_ids, '{}'::uuid[])) x
  where x <> auth.uid();
  select count(distinct p.id) into v_valid
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = any(coalesce(p_recipient_ids, '{}'::uuid[]))
    and p.is_active and p.id <> auth.uid()
    and r.code in ('member', 'officer', 'faculty');
  if v_wanted = 0 or v_wanted <> v_valid then
    raise exception 'One or more recipients are invalid, inactive, or cannot use mail';
  end if;

  insert into public.mail_scheduled (owner_id, to_ids, subject, body, parent_id, send_at)
  values (auth.uid(), p_recipient_ids, trim(p_subject), trim(p_body), p_parent_id, p_send_at)
  returning id into v_id;

  update public.mail_attachments
  set scheduled_id = v_id, draft_id = null
  where draft_id = p_draft_id and owner_id = auth.uid();

  if p_draft_id is not null then
    delete from public.mail_drafts where id = p_draft_id and owner_id = auth.uid();
  end if;
  return v_id;
end;
$$;
grant execute on function public.schedule_mail(uuid[], text, text, timestamptz, bigint, bigint) to authenticated;

create or replace function public.process_scheduled_mail()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_job public.mail_scheduled%rowtype;
  v_message_id bigint;
  v_wanted int;
  v_valid int;
  v_processed integer := 0;
begin
  for v_job in
    select * from public.mail_scheduled
    where status = 'queued' and send_at <= now()
    order by send_at
    for update skip locked
  loop
    begin
      if not exists (
        select 1 from public.profiles p join public.roles r on r.id = p.role_id
        where p.id = v_job.owner_id and p.is_active
          and r.code in ('member', 'officer', 'faculty')
      ) then
        raise exception 'Sender account is no longer active or eligible to send mail';
      end if;

      select count(distinct x) into v_wanted
      from unnest(v_job.to_ids) x where x <> v_job.owner_id;
      select count(distinct p.id) into v_valid
      from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.id = any(v_job.to_ids) and p.is_active
        and p.id <> v_job.owner_id
        and r.code in ('member', 'officer', 'faculty');
      if v_wanted = 0 or v_wanted <> v_valid then
        raise exception 'One or more recipients are no longer active or eligible to receive mail';
      end if;

      insert into public.messages (sender_id, parent_id, subject, body)
      values (v_job.owner_id, v_job.parent_id, v_job.subject, v_job.body)
      returning id into v_message_id;
      insert into public.message_recipients (message_id, recipient_id)
      select v_message_id, p.id
      from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.id = any(v_job.to_ids) and p.is_active
        and p.id <> v_job.owner_id
        and r.code in ('member', 'officer', 'faculty');

      update public.mail_attachments
      set message_id = v_message_id, scheduled_id = null
      where scheduled_id = v_job.id;
      update public.mail_scheduled
      set status = 'sent', message_id = v_message_id, failure_reason = null
      where id = v_job.id;
      v_processed := v_processed + 1;
    exception when others then
      update public.mail_scheduled
      set status = 'failed', failure_reason = left(sqlerrm, 500)
      where id = v_job.id;
    end;
  end loop;
  return v_processed;
end;
$$;
revoke all on function public.process_scheduled_mail() from public, anon, authenticated;

do $$
begin
  execute 'create extension if not exists pg_cron';
  if not exists (select 1 from pg_namespace where nspname = 'cron') then
    raise exception 'pg_cron did not create its cron schema';
  end if;
  if exists (select 1 from cron.job where jobname = 'process-scheduled-mail') then
    perform cron.unschedule(jobid)
    from cron.job where jobname = 'process-scheduled-mail';
  end if;
  perform cron.schedule(
    'process-scheduled-mail',
    '* * * * *',
    'select public.process_scheduled_mail()'
  );
exception
  when insufficient_privilege or undefined_file or feature_not_supported then
    raise exception 'pg_cron is required for scheduled mail. Enable the Supabase pg_cron extension and rerun this migration.';
end;
$$;

notify pgrst, 'reload schema';
