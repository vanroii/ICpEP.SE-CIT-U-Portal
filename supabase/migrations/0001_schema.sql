-- =====================================================================
-- ICpEP.SE CIT-U Organization Portal — Database Schema  (v1.0)
-- Course/Section : CPEPE361 / SD – H3
-- Target         : PostgreSQL 15+ on Supabase (auth.users is provided by Supabase Auth)
-- Date           : September 25, 2026
--
-- Run order: this whole file, top to bottom, in the Supabase SQL editor.
-- Passwords are NOT stored here: Supabase Auth keeps them hashed (bcrypt) in auth.users (NFR-02 / BR-10).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. ENUM TYPES
-- ---------------------------------------------------------------------
create type content_status      as enum ('draft', 'published', 'archived');
create type content_visibility  as enum ('public', 'members_only');
create type post_type           as enum ('news', 'announcement', 'update');
create type application_status  as enum ('pending', 'approved', 'rejected');
create type membership_status   as enum ('active', 'expired', 'revoked');
create type registration_status as enum ('registered', 'cancelled');
create type notification_type   as enum (
  'event_published', 'post_published', 'new_message',
  'membership_update', 'event_registration', 'event_reminder'
);


-- ---------------------------------------------------------------------
-- 1. LOOKUP TABLES
-- ---------------------------------------------------------------------
create table if not exists roles (
  id          smallint generated always as identity primary key,
  code        text not null unique
              check (code in ('non_member', 'member', 'officer', 'faculty', 'admin')),
  name        text not null,
  description text
);

insert into roles (code, name, description) values
  ('non_member', 'Non-Member Student',   'CpE student with an account who is not (yet) a verified ICpEP member'),
  ('member',     'ICpEP Member',         'CpE student with a verified ICpEP membership for the current school year'),
  ('officer',    'ICpEP Officer',        'Elected/appointed officer; manages content, events and membership verification'),
  ('faculty',    'Faculty / Adviser',    'Read-only oversight of activities, reports and announcements'),
  ('admin',      'System Administrator', 'Manages accounts, roles, content moderation and system settings')
on conflict (code) do nothing;

create table if not exists school_years (
  id          smallint generated always as identity primary key,
  label       text not null unique,                 -- e.g. '2026-2027'
  start_date  date not null,
  end_date    date not null,
  is_current  boolean not null default false,
  check (end_date > start_date)
);
-- at most one current school year
create unique index if not exists school_years_one_current on school_years (is_current) where is_current;


-- ---------------------------------------------------------------------
-- 2. USERS & PROFILES  (1 account = exactly 1 role — BR-02)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  role_id         smallint not null references roles (id),
  student_number  text unique,                       -- students only
  email           text not null check (position('@' in email) > 1),
  first_name      text not null check (length(trim(first_name)) > 0),
  middle_name     text,
  last_name       text not null check (length(trim(last_name)) > 0),
  program         text default 'BS Computer Engineering',
  year_level      smallint check (year_level between 1 and 6),
  department      text,                              -- faculty / adviser
  contact_number  text,
  avatar_url      text,
  bio             text,
  is_active       boolean not null default true,     -- false = deactivated, cannot log in (BR-08)
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists profiles_email_key on profiles (lower(email));
create index if not exists profiles_role_idx on profiles (role_id);


-- ---------------------------------------------------------------------
-- 3. MEMBERSHIP  (application -> verification -> membership record — BR-03)
-- ---------------------------------------------------------------------
create table if not exists membership_applications (
  id                    bigint generated always as identity primary key,
  applicant_id          uuid not null references profiles (id) on delete cascade,
  school_year_id        smallint not null references school_years (id),
  claimed_membership_no text,
  status                application_status not null default 'pending',
  submitted_at          timestamptz not null default now(),
  reviewed_by           uuid references profiles (id) on delete set null,
  reviewed_at           timestamptz,
  review_remarks        text,
  check ((status = 'pending') = (reviewed_at is null))
);
-- one open application per student per school year
create unique index if not exists membership_applications_one_pending
  on membership_applications (applicant_id, school_year_id) where status = 'pending';
create index if not exists membership_applications_status_idx on membership_applications (status, submitted_at);

create table if not exists memberships (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references profiles (id) on delete cascade,
  school_year_id  smallint not null references school_years (id),
  application_id  bigint unique references membership_applications (id) on delete set null,
  membership_no   text not null,
  status          membership_status not null default 'active',
  valid_until     date,
  granted_by      uuid references profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (user_id, school_year_id),
  unique (membership_no, school_year_id)
);

create table if not exists officer_terms (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references profiles (id) on delete cascade,
  school_year_id  smallint not null references school_years (id),
  position_title  text not null,                     -- e.g. 'President', 'VP – Internal'
  display_order   smallint not null default 100,
  unique (user_id, school_year_id)
);


-- ---------------------------------------------------------------------
-- 4. EVENTS, NEWS & ANNOUNCEMENTS
-- ---------------------------------------------------------------------
create table if not exists events (
  id                     bigint generated always as identity primary key,
  title                  text not null,
  slug                   text not null unique,
  description            text,
  venue                  text,
  start_at               timestamptz not null,
  end_at                 timestamptz,
  registration_deadline  timestamptz,
  requires_registration  boolean not null default true,
  capacity               integer check (capacity is null or capacity > 0),
  participant_count      integer not null default 0 check (participant_count >= 0),
  cover_image_url        text,
  visibility             content_visibility not null default 'public',
  status                 content_status not null default 'draft',
  created_by             uuid default auth.uid() references profiles (id) on delete set null,
  published_at           timestamptz,
  archived_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (end_at is null or end_at >= start_at),
  check (capacity is null or participant_count <= capacity)
);
create index if not exists events_feed_idx on events (status, visibility, start_at);

create table if not exists event_registrations (
  id             bigint generated always as identity primary key,
  event_id       bigint not null references events (id) on delete cascade,
  user_id        uuid not null references profiles (id) on delete cascade,
  status         registration_status not null default 'registered',
  registered_at  timestamptz not null default now(),
  cancelled_at   timestamptz,
  unique (event_id, user_id),                        -- only once per event (BR-05)
  check ((status = 'cancelled') = (cancelled_at is not null))
);
create index if not exists event_registrations_user_idx on event_registrations (user_id);

create table if not exists posts (
  id               bigint generated always as identity primary key,
  post_type        post_type not null default 'news',
  title            text not null,
  slug             text not null unique,
  summary          text,
  body             text not null,
  cover_image_url  text,
  visibility       content_visibility not null default 'public',
  status           content_status not null default 'draft',
  is_pinned        boolean not null default false,
  author_id        uuid default auth.uid() references profiles (id) on delete set null,
  published_at     timestamptz,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists posts_feed_idx on posts (status, visibility, is_pinned desc, published_at desc);


-- ---------------------------------------------------------------------
-- 5. MESSAGES & NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists messages (
  id                 bigint generated always as identity primary key,
  sender_id          uuid references profiles (id) on delete set null,
  parent_id          bigint references messages (id) on delete set null,   -- reply-to
  subject            text not null,
  body               text not null,
  sent_at            timestamptz not null default now(),
  sender_deleted_at  timestamptz                                            -- soft delete (sent items)
);
create index if not exists messages_sender_idx on messages (sender_id, sent_at desc);

create table if not exists message_recipients (
  message_id    bigint not null references messages (id) on delete cascade,
  recipient_id  uuid   not null references profiles (id) on delete cascade,
  is_read       boolean not null default false,
  read_at       timestamptz,
  deleted_at    timestamptz,                                                -- soft delete (inbox)
  primary key (message_id, recipient_id)
);
create index if not exists message_recipients_inbox_idx on message_recipients (recipient_id, is_read);

create table if not exists notifications (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references profiles (id) on delete cascade,
  type          notification_type not null,
  title         text not null,
  body          text,
  link_url      text,
  entity_type   text check (entity_type in ('event', 'post', 'message', 'membership_application')),
  entity_id     bigint,                                                     -- polymorphic reference
  is_read       boolean not null default false,
  read_at       timestamptz,
  email_sent_at timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, is_read, created_at desc);


-- ---------------------------------------------------------------------
-- 6. SYSTEM TABLES
-- ---------------------------------------------------------------------
create table if not exists activity_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references profiles (id) on delete set null,
  action       text not null,                      -- e.g. 'event.published', 'user.role_changed'
  entity_type  text,
  entity_id    text,
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on activity_logs (created_at desc);
create index if not exists activity_logs_actor_idx   on activity_logs (actor_id);

create table if not exists site_settings (
  key         text primary key,
  value       text not null default '',
  description text,
  updated_by  uuid references profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

insert into site_settings (key, value, description) values
  ('org_name',        'ICpEP.SE CIT-U', 'Organization short name'),
  ('org_full_name',   'Institute of Computer Engineers of the Philippines – Student Edition, CIT-U Chapter', 'Full name'),
  ('about_text',      'The Institute of Computer Engineers of the Philippines Student Edition - CIT-U Chapter represents and empowers aspiring Computer Engineers through technical enrichment, leadership development, and academic excellence.', 'About page text'),
  ('mission',         'To foster professional growth, technical innovation, and collaborative engagement among Computer Engineering students in Cebu Institute of Technology - University.', 'Mission statement'),
  ('vision',          'A premier student engineering organization molding globally competitive, ethical, and innovative Computer Engineers shaping the technological landscape.', 'Vision statement'),
  ('contact_email',   'icpep.se@cit.edu', 'Public contact e-mail'),
  ('contact_address', 'N. Bacalso Ave, Cebu City, 6000 Cebu, Philippines - CIT-U CEA Building', 'Public contact address / office'),
  ('facebook_url',    'https://www.facebook.com/ICpEP.SE.CITU', 'Official Facebook page')
on conflict (key) do nothing;


-- =====================================================================
-- 7. HELPER FUNCTIONS
-- (SECURITY DEFINER so RLS policies can call them without recursion)
-- =====================================================================
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create or replace function public.auth_role() returns text
language sql stable security definer set search_path = public as $$
  select r.code from profiles p join roles r on r.id = p.role_id
  where p.id = auth.uid() and p.is_active
$$;

create or replace function public.is_staff() returns boolean          -- officer or admin
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('officer', 'admin'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = 'admin', false)
$$;

create or replace function public.can_view_members_only() returns boolean   -- BR-06
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('member', 'officer', 'faculty', 'admin'), false)
$$;

create or replace function public.is_message_sender(p_message_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from messages where id = p_message_id and sender_id = auth.uid())
$$;

create or replace function public.is_message_recipient(p_message_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from message_recipients where message_id = p_message_id and recipient_id = auth.uid())
$$;

-- Server-side audit helper (used by the Next.js server, e.g. on login)
create or replace function public.log_activity(
  p_action text, p_entity_type text default null, p_entity_id text default null, p_details jsonb default null
) returns void
language sql security definer set search_path = public as $$
  insert into activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
$$;


-- =====================================================================
-- 8. TRIGGERS
-- =====================================================================

-- 8.1 updated_at
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();

drop trigger if exists trg_events_updated on events;
create trigger trg_events_updated   before update on events   for each row execute function set_updated_at();

drop trigger if exists trg_posts_updated on posts;
create trigger trg_posts_updated    before update on posts    for each row execute function set_updated_at();

-- 8.2 new auth user -> profile (role = Non-Member) [+ pending membership application]
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role smallint;
  v_sy   smallint;
begin
  select id into v_role from roles where code = 'non_member';

  insert into profiles (id, role_id, email, student_number, first_name, middle_name, last_name,
                        program, year_level, contact_number)
  values (new.id, v_role, new.email,
          nullif(v_meta->>'student_number', ''),
          coalesce(v_meta->>'first_name', ''),
          nullif(v_meta->>'middle_name', ''),
          coalesce(v_meta->>'last_name', ''),
          coalesce(nullif(v_meta->>'program', ''), 'BS Computer Engineering'),
          nullif(v_meta->>'year_level', '')::smallint,
          nullif(v_meta->>'contact_number', ''));

  -- "I am already an ICpEP member" on the registration form (FR-03) -> pending application (BR-03)
  if coalesce((v_meta->>'claims_membership')::boolean, false) then
    select id into v_sy from school_years where is_current;
    if v_sy is not null then
      insert into membership_applications (applicant_id, school_year_id, claimed_membership_no)
      values (new.id, v_sy, nullif(v_meta->>'membership_no', ''));
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.system_update', 'on', true);
  update profiles set email = new.email where id = new.id;
  perform set_config('app.system_update', 'off', true);
  return new;
end $$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function public.sync_profile_email();

-- 8.3 users may edit their profile, but not role / status / student no. / e-mail (BR-07, BR-08)
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null
     and coalesce(current_setting('app.system_update', true), 'off') <> 'on'
     and not public.is_admin() then
    if new.role_id        is distinct from old.role_id
       or new.is_active   is distinct from old.is_active
       or new.student_number is distinct from old.student_number
       or new.email       is distinct from old.email then
      raise exception 'Only an administrator can change role, status, student number or e-mail';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_protect on profiles;
create trigger trg_profiles_protect before update on profiles for each row execute function protect_profile_columns();

-- 8.4 events / posts: publish & archive timestamps, activity log, notification fan-out (FR-08, FR-11)
create or replace function public.stamp_content_dates() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status = 'archived' and (tg_op = 'INSERT' or old.status is distinct from 'archived') then
    new.archived_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_events_dates on events;
create trigger trg_events_dates before insert or update on events for each row execute function stamp_content_dates();

drop trigger if exists trg_posts_dates on posts;
create trigger trg_posts_dates  before insert or update on posts  for each row execute function stamp_content_dates();

create or replace function public.log_content_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into activity_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), tg_argv[0] || '.' || new.status::text, tg_argv[0], new.id::text,
            jsonb_build_object('title', new.title));
  end if;
  return null;
end $$;

drop trigger if exists trg_events_log on events;
create trigger trg_events_log after insert or update of status on events
  for each row execute function log_content_status('event');

drop trigger if exists trg_posts_log on posts;
create trigger trg_posts_log after insert or update of status on posts
  for each row execute function log_content_status('post');

create or replace function public.notify_on_publish() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_type notification_type;
  v_kind text;
  v_link text;
  v_body text;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if tg_table_name = 'events' then
      v_type := 'event_published'; v_kind := 'event'; v_link := '/events/' || new.slug;
      v_body := 'A new event has been published.';
    else
      v_type := 'post_published';  v_kind := 'post';  v_link := '/news/' || new.slug;
      v_body := 'A new post has been published.';
    end if;

    insert into notifications (user_id, type, title, body, link_url, entity_type, entity_id)
    select p.id, v_type, new.title, v_body, v_link, v_kind, new.id
    from profiles p join roles r on r.id = p.role_id
    where p.is_active
      and p.id is distinct from auth.uid()
      and (new.visibility = 'public' or r.code in ('member', 'officer', 'faculty', 'admin'));   -- BR-11
  end if;
  return null;
end $$;

drop trigger if exists trg_events_notify on events;
create trigger trg_events_notify after insert or update of status on events
  for each row execute function notify_on_publish();

drop trigger if exists trg_posts_notify on posts;
create trigger trg_posts_notify after insert or update of status on posts
  for each row execute function notify_on_publish();

-- 8.5 event registration rules (BR-05, BR-06) + participant count (SR-04) + confirmation notification
create or replace function public.guard_event_registration() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  e      events%rowtype;
  v_role text;
begin
  if tg_op = 'INSERT' and exists (
       select 1 from event_registrations
        where event_id = new.event_id and user_id = new.user_id and status = 'registered') then
    raise exception 'You are already registered for this event';
  end if;

  if new.status = 'registered' and (tg_op = 'INSERT' or old.status <> 'registered') then
    select * into e from events where id = new.event_id for update;          -- serialises capacity checks
    select r.code into v_role
      from profiles p join roles r on r.id = p.role_id
     where p.id = new.user_id and p.is_active;

    if v_role is null or v_role not in ('non_member', 'member') then
      raise exception 'Only active students and members can register for events';
    end if;
    if e.status <> 'published' then
      raise exception 'This event is not open for registration';
    end if;
    if not e.requires_registration then
      raise exception 'This event does not require registration';
    end if;
    if e.visibility = 'members_only' and v_role <> 'member' then
      raise exception 'This event is for ICpEP members only';
    end if;
    if e.registration_deadline is not null and now() > e.registration_deadline then
      raise exception 'The registration deadline has passed';
    end if;
    if e.capacity is not null and e.participant_count >= e.capacity then
      raise exception 'This event is already full';
    end if;
  end if;

  if new.status = 'cancelled' and new.cancelled_at is null then new.cancelled_at := now(); end if;
  if new.status = 'registered' then new.cancelled_at := null; end if;
  return new;
end $$;

drop trigger if exists trg_registration_guard on event_registrations;
create trigger trg_registration_guard before insert or update on event_registrations
  for each row execute function guard_event_registration();

create or replace function public.sync_participant_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_event bigint := coalesce(new.event_id, old.event_id);
begin
  update events
     set participant_count = (select count(*) from event_registrations
                               where event_id = v_event and status = 'registered')
   where id = v_event;
  return null;
end $$;

drop trigger if exists trg_registration_count on event_registrations;
create trigger trg_registration_count after insert or update of status or delete on event_registrations
  for each row execute function sync_participant_count();

create or replace function public.notify_registration() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'registered' and (tg_op = 'INSERT' or old.status = 'cancelled') then
    insert into notifications (user_id, type, title, body, link_url, entity_type, entity_id)
    select new.user_id, 'event_registration', 'Registration confirmed: ' || e.title,
           'You are registered for this event.', '/events/' || e.slug, 'event', e.id
      from events e where e.id = new.event_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_registration_notify on event_registrations;
create trigger trg_registration_notify after insert or update of status on event_registrations
  for each row execute function notify_registration();

-- 8.6 messages: recipients must be registered, active users (BR-12) + new-message notification
create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, type, title, body, link_url, entity_type, entity_id)
  select new.recipient_id, 'new_message',
         'New message' || coalesce(' from ' || p.first_name || ' ' || p.last_name, ''),
         m.subject, '/inbox/' || m.id, 'message', m.id
    from messages m left join profiles p on p.id = m.sender_id
   where m.id = new.message_id;
  return null;
end $$;

drop trigger if exists trg_message_notify on message_recipients;
create trigger trg_message_notify after insert on message_recipients
  for each row execute function notify_new_message();

-- 8.7 membership record -> keeps the Member / Non-Member role in step (BR-03)
create or replace function public.sync_member_role() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_member smallint;
  v_non    smallint;
begin
  select id into v_member from roles where code = 'member';
  select id into v_non    from roles where code = 'non_member';
  perform set_config('app.system_update', 'on', true);

  if exists (select 1 from memberships m join school_years sy on sy.id = m.school_year_id
              where m.user_id = new.user_id and m.status = 'active' and sy.is_current) then
    update profiles set role_id = v_member where id = new.user_id and role_id = v_non;
  else
    update profiles set role_id = v_non    where id = new.user_id and role_id = v_member;
  end if;

  perform set_config('app.system_update', 'off', true);
  return null;
end $$;

drop trigger if exists trg_membership_role on memberships;
create trigger trg_membership_role after insert or update of status on memberships
  for each row execute function sync_member_role();


-- =====================================================================
-- 9. RPC FUNCTIONS  (called from the Next.js server with the user's JWT)
-- =====================================================================

-- 9.1 Officer/Admin verifies a membership application (FR-07)
create or replace function public.review_membership_application(
  p_application_id bigint, p_approve boolean, p_remarks text default null, p_membership_no text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  a    membership_applications%rowtype;
  v_no text;
begin
  if not public.is_staff() then
    raise exception 'Only officers and administrators can review membership applications';
  end if;

  select * into a from membership_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if a.status <> 'pending' then raise exception 'This application was already reviewed'; end if;

  if p_approve then
    v_no := coalesce(nullif(p_membership_no, ''), a.claimed_membership_no);
    if v_no is null then raise exception 'A membership number is required to approve'; end if;
  end if;

  update membership_applications
     set status = (case when p_approve then 'approved' else 'rejected' end)::application_status,
         reviewed_by = auth.uid(), reviewed_at = now(), review_remarks = p_remarks
   where id = a.id;

  if p_approve then
    insert into memberships (user_id, school_year_id, application_id, membership_no, status, valid_until, granted_by)
    select a.applicant_id, a.school_year_id, a.id, v_no, 'active', sy.end_date, auth.uid()
      from school_years sy where sy.id = a.school_year_id
    on conflict (user_id, school_year_id) do update
      set status = 'active', application_id = excluded.application_id, membership_no = excluded.membership_no,
          valid_until = excluded.valid_until, granted_by = excluded.granted_by;
  end if;

  insert into notifications (user_id, type, title, body, link_url, entity_type, entity_id)
  values (a.applicant_id, 'membership_update',
          case when p_approve then 'Your ICpEP membership was approved'
               else 'Your ICpEP membership application was declined' end,
          p_remarks, '/profile', 'membership_application', a.id);

  insert into activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), case when p_approve then 'membership.approved' else 'membership.rejected' end,
          'membership_application', a.id::text,
          jsonb_build_object('applicant_id', a.applicant_id, 'remarks', p_remarks));
end $$;

-- 9.2 Student registers / cancels (rules enforced by trigger 8.5)
create or replace function public.register_for_event(p_event_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'You must be logged in to register'; end if;
  insert into event_registrations (event_id, user_id, status)
  values (p_event_id, auth.uid(), 'registered')
  on conflict (event_id, user_id) do update
    set status = 'registered', registered_at = now(), cancelled_at = null
    where event_registrations.status = 'cancelled';
  if not found then raise exception 'You are already registered for this event'; end if;
end $$;

create or replace function public.cancel_event_registration(p_event_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update event_registrations set status = 'cancelled'
   where event_id = p_event_id and user_id = auth.uid() and status = 'registered';
  if not found then raise exception 'No active registration found for this event'; end if;
end $$;

-- 9.3 Messaging (FR-10)
create or replace function public.send_message(
  p_recipient_ids uuid[], p_subject text, p_body text, p_parent_id bigint default null
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id       bigint;
  v_wanted   int;
  v_valid    int;
begin
  if public.auth_role() is null or public.auth_role() not in ('non_member', 'member', 'officer', 'faculty') then
    raise exception 'Your role cannot send messages';
  end if;

  select count(distinct x) into v_wanted from unnest(p_recipient_ids) x where x <> auth.uid();
  select count(*) into v_valid from profiles
   where id = any (p_recipient_ids) and is_active and id <> auth.uid();
  if v_wanted = 0 or v_wanted <> v_valid then
    raise exception 'One or more recipients are invalid or inactive';                 -- BR-12
  end if;

  insert into messages (sender_id, parent_id, subject, body)
  values (auth.uid(), p_parent_id, p_subject, p_body) returning id into v_id;

  insert into message_recipients (message_id, recipient_id)
  select v_id, p.id from profiles p
   where p.id = any (p_recipient_ids) and p.is_active and p.id <> auth.uid();
  return v_id;
end $$;

create or replace function public.mark_message_read(p_message_id bigint) returns void
language sql security definer set search_path = public as $$
  update message_recipients set is_read = true, read_at = coalesce(read_at, now())
   where message_id = p_message_id and recipient_id = auth.uid();
  update notifications set is_read = true, read_at = coalesce(read_at, now())
   where user_id = auth.uid() and entity_type = 'message' and entity_id = p_message_id;
$$;

create or replace function public.delete_message(p_message_id bigint) returns void
language sql security definer set search_path = public as $$
  update message_recipients set deleted_at = now()
   where message_id = p_message_id and recipient_id = auth.uid();
  update messages set sender_deleted_at = now()
   where id = p_message_id and sender_id = auth.uid();
$$;

-- 9.4 Administrator account management (FR-12)
create or replace function public.admin_set_role(p_user_id uuid, p_role_code text) returns void
language plpgsql security definer set search_path = public as $$
declare v_old text; v_new smallint;
begin
  if not public.is_admin() then raise exception 'Only the administrator can assign roles'; end if;
  select id into v_new from roles where code = p_role_code;
  if v_new is null then raise exception 'Unknown role: %', p_role_code; end if;
  select r.code into v_old from profiles p join roles r on r.id = p.role_id where p.id = p_user_id;
  update profiles set role_id = v_new where id = p_user_id;
  insert into activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'user.role_changed', 'profile', p_user_id::text,
          jsonb_build_object('from', v_old, 'to', p_role_code));
end $$;

create or replace function public.admin_set_active(p_user_id uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only the administrator can (de)activate accounts'; end if;
  if p_user_id = auth.uid() and not p_active then raise exception 'You cannot deactivate your own account'; end if;
  update profiles set is_active = p_active where id = p_user_id;
  insert into activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), case when p_active then 'user.activated' else 'user.deactivated' end,
          'profile', p_user_id::text, null);
end $$;

-- 9.5 Scheduled jobs (register with pg_cron / Supabase Cron)
create or replace function public.expire_memberships() returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update memberships set status = 'expired'
   where status = 'active' and valid_until is not null and valid_until < current_date;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

create or replace function public.send_event_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  insert into notifications (user_id, type, title, body, link_url, entity_type, entity_id)
  select er.user_id, 'event_reminder', 'Reminder: ' || e.title, 'This event starts within 24 hours.',
         '/events/' || e.slug, 'event', e.id
    from event_registrations er join events e on e.id = er.event_id
   where er.status = 'registered' and e.status = 'published'
     and e.start_at between now() and now() + interval '24 hours'
     and not exists (select 1 from notifications n
                      where n.user_id = er.user_id and n.type = 'event_reminder'
                        and n.entity_type = 'event' and n.entity_id = e.id);
  get diagnostics v_n = row_count;
  return v_n;
end $$;


-- =====================================================================
-- 10. VIEWS
-- =====================================================================

-- Public "Officers" section of the About page (no login needed, FR-02)
create or replace view public.public_officers as
select ot.id, p.first_name, p.middle_name, p.last_name, p.avatar_url,
       ot.position_title, ot.display_order, sy.label as school_year
  from officer_terms ot
  join profiles p      on p.id  = ot.user_id
  join school_years sy on sy.id = ot.school_year_id
 where sy.is_current and p.is_active;

-- Minimal people directory used by the message composer
create or replace view public.user_directory as
select p.id, p.first_name, p.last_name, p.avatar_url, r.code as role_code, p.program, p.year_level
  from profiles p join roles r on r.id = p.role_id
 where p.is_active and auth.uid() is not null;

-- Reports for officers / faculty / admin (SR-07) — read-only
create or replace view public.report_membership_counts as
select sy.label as school_year, m.status, count(*)::int as total
  from memberships m join school_years sy on sy.id = m.school_year_id
 where public.auth_role() in ('officer', 'faculty', 'admin')
 group by sy.label, m.status;

create or replace view public.report_event_participation as
select e.id as event_id, e.title, e.start_at, e.status, e.capacity,
       count(er.*) filter (where er.status = 'registered')::int as registered,
       count(er.*) filter (where er.status = 'cancelled')::int  as cancelled
  from events e left join event_registrations er on er.event_id = e.id
 where public.auth_role() in ('officer', 'faculty', 'admin')
 group by e.id;

create or replace view public.report_activity_log as
select l.id, l.created_at, p.first_name || ' ' || p.last_name as actor,
       l.action, l.entity_type, l.entity_id
  from activity_logs l left join profiles p on p.id = l.actor_id
 where public.auth_role() in ('officer', 'faculty', 'admin');

grant select on public.public_officers to anon, authenticated;
grant select on public.user_directory, public.report_membership_counts,
                public.report_event_participation, public.report_activity_log to authenticated;


-- =====================================================================
-- 11. ROW LEVEL SECURITY  (role-based access — BR-01, BR-07, BR-08, BR-09)
-- =====================================================================
alter table roles                   enable row level security;
alter table school_years            enable row level security;
alter table profiles                enable row level security;
alter table membership_applications enable row level security;
alter table memberships             enable row level security;
alter table officer_terms           enable row level security;
alter table events                  enable row level security;
alter table event_registrations     enable row level security;
alter table posts                   enable row level security;
alter table messages                enable row level security;
alter table message_recipients      enable row level security;
alter table notifications           enable row level security;
alter table activity_logs           enable row level security;
alter table site_settings           enable row level security;

-- lookup / public info
drop policy if exists roles_read on roles;
create policy roles_read on roles for select to authenticated using (true);

drop policy if exists school_years_read on school_years;
create policy school_years_read on school_years for select to anon, authenticated using (true);

drop policy if exists school_years_admin on school_years;
create policy school_years_admin on school_years for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists settings_read on site_settings;
create policy settings_read on site_settings for select to anon, authenticated using (true);

drop policy if exists settings_admin on site_settings;
create policy settings_admin on site_settings for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists officer_terms_read on officer_terms;
create policy officer_terms_read on officer_terms for select to authenticated using (true);

drop policy if exists officer_terms_admin on officer_terms;
create policy officer_terms_admin on officer_terms for all to authenticated using (is_admin()) with check (is_admin());

-- profiles: own row; staff can look people up; admin can do everything
drop policy if exists profiles_read_own on profiles;
create policy profiles_read_own   on profiles for select to authenticated using (id = auth.uid());

drop policy if exists profiles_read_staff on profiles;
create policy profiles_read_staff on profiles for select to authenticated using (is_staff());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all  on profiles for all to authenticated using (is_admin()) with check (is_admin());

-- membership
drop policy if exists applications_read_own on membership_applications;
create policy applications_read_own on membership_applications for select to authenticated using (applicant_id = auth.uid());

drop policy if exists applications_staff on membership_applications;
create policy applications_staff    on membership_applications for select to authenticated using (is_staff());

drop policy if exists applications_insert on membership_applications;
create policy applications_insert   on membership_applications for insert to authenticated
  with check (applicant_id = auth.uid() and status = 'pending' and auth_role() = 'non_member');

drop policy if exists memberships_read_own on memberships;
create policy memberships_read_own  on memberships for select to authenticated using (user_id = auth.uid());

drop policy if exists memberships_staff on memberships;
create policy memberships_staff     on memberships for select to authenticated using (is_staff());

-- events & posts: visitors see published public rows only (BR-01); members_only needs BR-06; staff manage (BR-04)
drop policy if exists events_anon_read on events;
create policy events_anon_read   on events for select to anon using (status = 'published' and visibility = 'public');

drop policy if exists events_auth_read on events;
create policy events_auth_read   on events for select to authenticated
  using (is_staff() or (status = 'published' and (visibility = 'public' or can_view_members_only())));

drop policy if exists events_staff_insert on events;
create policy events_staff_insert on events for insert to authenticated with check (is_staff() and created_by = auth.uid());

drop policy if exists events_staff_update on events;
create policy events_staff_update on events for update to authenticated using (is_staff()) with check (is_staff());

drop policy if exists events_admin_delete on events;
create policy events_admin_delete on events for delete to authenticated using (is_admin());

drop policy if exists posts_anon_read on posts;
create policy posts_anon_read    on posts for select to anon using (status = 'published' and visibility = 'public');

drop policy if exists posts_auth_read on posts;
create policy posts_auth_read    on posts for select to authenticated
  using (is_staff() or (status = 'published' and (visibility = 'public' or can_view_members_only())));

drop policy if exists posts_staff_insert on posts;
create policy posts_staff_insert on posts for insert to authenticated with check (is_staff() and author_id = auth.uid());

drop policy if exists posts_staff_update on posts;
create policy posts_staff_update on posts for update to authenticated using (is_staff()) with check (is_staff());

drop policy if exists posts_admin_delete on posts;
create policy posts_admin_delete on posts for delete to authenticated using (is_admin());

-- registrations: read own (BR-07) or staff; writes go through register_for_event()/cancel_event_registration()
drop policy if exists registrations_read_own on event_registrations;
create policy registrations_read_own   on event_registrations for select to authenticated using (user_id = auth.uid());

drop policy if exists registrations_read_staff on event_registrations;
create policy registrations_read_staff on event_registrations for select to authenticated using (is_staff());

-- messages: read what you sent or received; writes go through send_message()/mark_message_read()/delete_message()
drop policy if exists messages_read on messages;
create policy messages_read on messages for select to authenticated
  using ((sender_id = auth.uid() and sender_deleted_at is null)
         or (is_message_recipient(id)
             and not exists (select 1 from message_recipients mr
                              where mr.message_id = messages.id and mr.recipient_id = auth.uid() and mr.deleted_at is not null)));

drop policy if exists recipients_read on message_recipients;
create policy recipients_read on message_recipients for select to authenticated
  using (recipient_id = auth.uid() or is_message_sender(message_id));

-- notifications: own only
drop policy if exists notifications_read on notifications;
create policy notifications_read   on notifications for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete on notifications;
create policy notifications_delete on notifications for delete to authenticated using (user_id = auth.uid());

-- audit trail: administrators only (officers/faculty use report_activity_log)
drop policy if exists activity_admin_read on activity_logs;
create policy activity_admin_read on activity_logs for select to authenticated using (is_admin());
