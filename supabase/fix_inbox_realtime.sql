-- Enable Supabase Realtime for live inbox messaging & store message preview in notifications
-- Run this in the Supabase SQL Editor once.

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
