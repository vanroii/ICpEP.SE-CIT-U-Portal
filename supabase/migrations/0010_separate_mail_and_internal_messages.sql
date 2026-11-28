-- Keep the portal mail system and internal chat in separate message channels.

alter table public.messages
  add column if not exists message_type text not null default 'internal'
  check (message_type in ('internal', 'mail'));

create index if not exists messages_type_sender_idx
  on public.messages(message_type, sender_id, sent_at desc);
create index if not exists message_recipients_message_type_idx
  on public.message_recipients(recipient_id, message_id);

create or replace function public.send_message(
  p_recipient_ids uuid[], p_subject text, p_body text, p_parent_id bigint default null
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
  v_wanted integer;
  v_valid integer;
begin
  if auth.uid() is null or not coalesce(
    public.auth_role() in ('non_member', 'member', 'officer', 'faculty', 'admin'),
    false
  ) then
    raise exception 'Your role cannot send internal messages';
  end if;
  if nullif(trim(p_subject), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Subject and message body are required';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.messages m
    where m.id = p_parent_id
      and m.message_type = 'internal'
      and (m.sender_id = auth.uid() or public.is_message_recipient(m.id))
  ) then
    raise exception 'The internal message thread was not found';
  end if;

  select count(distinct x) into v_wanted
  from unnest(coalesce(p_recipient_ids, '{}'::uuid[])) x
  where x <> auth.uid();
  select count(distinct p.id) into v_valid
  from public.profiles p
  where p.id = any(coalesce(p_recipient_ids, '{}'::uuid[]))
    and p.is_active and p.id <> auth.uid();
  if v_wanted = 0 or v_wanted <> v_valid then
    raise exception 'One or more recipients are invalid or inactive';
  end if;

  insert into public.messages (sender_id, parent_id, subject, body, message_type)
  values (auth.uid(), p_parent_id, trim(p_subject), trim(p_body), 'internal')
  returning id into v_id;

  insert into public.message_recipients (message_id, recipient_id)
  select v_id, p.id
  from public.profiles p
  where p.id = any(p_recipient_ids) and p.is_active and p.id <> auth.uid();
  return v_id;
end;
$$;
grant execute on function public.send_message(uuid[], text, text, bigint) to authenticated;

create or replace function public.send_mail_message(
  p_recipient_ids uuid[], p_subject text, p_body text, p_parent_id bigint default null
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
  v_wanted integer;
  v_valid integer;
begin
  if auth.uid() is null or not coalesce(
    public.auth_role() in ('member', 'officer', 'faculty'),
    false
  ) then
    raise exception 'Your role cannot send mail';
  end if;
  if nullif(trim(p_subject), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Subject and body are required';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.messages m
    where m.id = p_parent_id
      and m.message_type = 'mail'
      and (m.sender_id = auth.uid() or public.is_message_recipient(m.id))
  ) then
    raise exception 'The mail thread was not found';
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

  insert into public.messages (sender_id, parent_id, subject, body, message_type)
  values (auth.uid(), p_parent_id, trim(p_subject), trim(p_body), 'mail')
  returning id into v_id;

  insert into public.message_recipients (message_id, recipient_id)
  select v_id, p.id
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = any(p_recipient_ids) and p.is_active
    and p.id <> auth.uid()
    and r.code in ('member', 'officer', 'faculty');
  return v_id;
end;
$$;
grant execute on function public.send_mail_message(uuid[], text, text, bigint) to authenticated;

create or replace function public.validate_scheduled_mail_parent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.messages m
    where m.id = new.parent_id and m.message_type = 'mail'
  ) then
    raise exception 'Scheduled mail must reply to another mail message';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_scheduled_mail_parent on public.mail_scheduled;
create trigger validate_scheduled_mail_parent
  before insert or update on public.mail_scheduled
  for each row execute function public.validate_scheduled_mail_parent();

create or replace function public.process_scheduled_mail()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_job public.mail_scheduled%rowtype;
  v_message_id bigint;
  v_wanted integer;
  v_valid integer;
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

      insert into public.messages (sender_id, parent_id, subject, body, message_type)
      values (v_job.owner_id, v_job.parent_id, v_job.subject, v_job.body, 'mail')
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

create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url, entity_type, entity_id)
  select new.recipient_id, 'new_message',
         'New message from ' || coalesce(p.first_name || ' ' || p.last_name, 'a member'),
         left(m.body, 160),
         case when m.message_type = 'mail' then '/mail'
              else '/inbox?thread=' || m.id end,
         'message', m.id
  from public.messages m
  left join public.profiles p on p.id = m.sender_id
  where m.id = new.message_id;
  return new;
end;
$$;

update public.notifications n
set link_url = '/mail'
from public.messages m
where n.entity_type = 'message'
  and n.entity_id = m.id
  and m.message_type = 'mail';

notify pgrst, 'reload schema';
