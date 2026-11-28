-- Complete sender-side trash behavior without deleting recipients' copies.

alter table public.messages
  add column if not exists sender_permanently_deleted boolean not null default false;

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using (
    (sender_id = auth.uid() and not sender_permanently_deleted)
    or is_message_recipient(id)
  );

create or replace function public.set_mail_folder(p_message_id bigint, p_folder text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_recipient_rows integer;
  v_sender_rows integer;
begin
  if p_folder not in ('inbox', 'trash') then
    raise exception 'Invalid mail folder';
  end if;

  update public.message_recipients
  set folder = p_folder,
      deleted_at = case when p_folder = 'trash' then now() else null end
  where message_id = p_message_id
    and recipient_id = auth.uid();
  get diagnostics v_recipient_rows = row_count;

  update public.messages
  set sender_deleted_at = case when p_folder = 'trash' then now() else null end
  where id = p_message_id
    and sender_id = auth.uid()
    and not sender_permanently_deleted
    and (
      (p_folder = 'trash' and sender_deleted_at is null)
      or (p_folder = 'inbox' and sender_deleted_at is not null)
    );
  get diagnostics v_sender_rows = row_count;

  if v_recipient_rows = 0 and v_sender_rows = 0 then
    raise exception 'Mail not found or no longer available';
  end if;
end;
$$;

create or replace function public.permanent_delete_mail(p_message_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_recipient_rows integer;
  v_sender_rows integer;
begin
  delete from public.message_recipients
  where message_id = p_message_id
    and recipient_id = auth.uid()
    and folder = 'trash';
  get diagnostics v_recipient_rows = row_count;

  update public.messages
  set sender_permanently_deleted = true
  where id = p_message_id
    and sender_id = auth.uid()
    and sender_deleted_at is not null
    and not sender_permanently_deleted;
  get diagnostics v_sender_rows = row_count;

  if v_recipient_rows = 0 and v_sender_rows = 0 then
    raise exception 'Mail is not in your trash';
  end if;
end;
$$;

grant execute on function public.set_mail_folder(bigint, text) to authenticated;
grant execute on function public.permanent_delete_mail(bigint) to authenticated;

notify pgrst, 'reload schema';
