-- =====================================================================
-- ICpEP.SE CIT-U Portal — fix_signup.sql
-- Run this ONCE in the Supabase SQL Editor (top → bottom).
-- Fixes: Bug 1 (signup 500), Bug 2 (separate name cols),
--        Bug 3 (faculty registration), Bug 6 (faculty events RLS)
-- =====================================================================

-- -----------------------------------------------------------------------
-- 1. Add mobile_number and employee_id columns to profiles (Bug 2 & 3)
-- -----------------------------------------------------------------------
alter table public.profiles
  add column if not exists mobile_number text,
  add column if not exists employee_id text;

drop index if exists public.profiles_employee_id_key;
create unique index if not exists profiles_employee_id_key
  on public.profiles (lower(trim(employee_id)))
  where employee_id is not null and trim(employee_id) <> '';

-- -----------------------------------------------------------------------
-- 2. Ensure roles table is readable by anon + authenticated (Bug 1 prereq)
-- -----------------------------------------------------------------------
grant select on public.roles to anon, authenticated;

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
  for select to anon, authenticated using (true);

-- Ensure all 5 standard roles exist
insert into public.roles (code, name, description) values
  ('non_member', 'Non-Member Student',   'CpE student with an account who is not (yet) a verified ICpEP member'),
  ('member',     'ICpEP Member',         'CpE student with a verified ICpEP membership for the current school year'),
  ('officer',    'ICpEP Officer',        'Elected/appointed officer; manages content, events and membership verification'),
  ('faculty',    'Faculty / Adviser',    'Read-only oversight of activities, reports and announcements'),
  ('admin',      'System Administrator', 'Manages accounts, roles, content moderation and system settings')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------
-- 3. Ensure current active School Year exists (Bug 1 prereq for trigger)
-- -----------------------------------------------------------------------
insert into public.school_years (label, start_date, end_date, is_current)
values ('2026-2027', '2026-08-01', '2027-05-31', true)
on conflict (label) do update
  set is_current = true,
      start_date = excluded.start_date,
      end_date = excluded.end_date;

-- -----------------------------------------------------------------------
-- 4. Robust handle_new_user trigger (Bug 1 & 3 — Faculty & Student roles)
-- Reads: first_name, middle_name, last_name, mobile_number,
--        student_number, employee_id, program, year_level, department, role
-- Fallbacks prevent 500 "Database error saving new user".
-- -----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta       jsonb    := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role_code  text;
  v_role_id    smallint;
  v_sy         smallint;
  v_first      text;
  v_last       text;
  v_is_faculty boolean;
begin
  -- Determine role from metadata (student=non_member, faculty=faculty).
  -- Never allow admin or officer from public registration.
  v_is_faculty := (
    lower(coalesce(v_meta->>'role', '')) = 'faculty'
    or nullif(trim(coalesce(v_meta->>'employee_id', '')), '') is not null
    or (nullif(trim(coalesce(v_meta->>'department', '')), '') is not null and nullif(trim(coalesce(v_meta->>'student_number', '')), '') is null)
  );
  v_role_code  := case when v_is_faculty then 'faculty' else 'non_member' end;

  -- Resolve role_id, auto-creating if missing
  select id into v_role_id from public.roles where code = v_role_code;
  if v_role_id is null then
    insert into public.roles (code, name, description)
    values (
      v_role_code,
      case when v_is_faculty then 'Faculty / Adviser' else 'Non-Member Student' end,
      case when v_is_faculty then 'Read-only oversight of activities, reports and announcements'
           else 'CpE student with an account who is not (yet) a verified ICpEP member' end
    )
    on conflict (code) do update set name = excluded.name
    returning id into v_role_id;
  end if;

  -- Safe name fallbacks
  v_first := coalesce(nullif(trim(v_meta->>'first_name'), ''),
                      split_part(new.email, '@', 1),
                      case when v_is_faculty then 'Faculty' else 'Student' end);
  v_last  := coalesce(nullif(trim(v_meta->>'last_name'), ''),
                      case when v_is_faculty then 'Adviser' else 'Member' end);

  insert into public.profiles (
    id, role_id, email,
    first_name, middle_name, last_name,
    student_number, employee_id, program, year_level,
    department, mobile_number, contact_number
  ) values (
    new.id,
    v_role_id,
    lower(new.email),
    v_first,
    nullif(trim(v_meta->>'middle_name'), ''),
    v_last,
    case when v_is_faculty then null else nullif(trim(v_meta->>'student_number'), '') end,
    case when v_is_faculty then nullif(trim(v_meta->>'employee_id'), '') else null end,
    case when v_is_faculty then null else coalesce(nullif(trim(v_meta->>'program'), ''), 'BS Computer Engineering') end,
    case
      when v_is_faculty then null
      when (v_meta->>'year_level') ~ '^[1-6]$' then (v_meta->>'year_level')::smallint
      else 1
    end,
    nullif(trim(v_meta->>'department'), ''),
    coalesce(nullif(trim(v_meta->>'mobile_number'), ''), nullif(trim(v_meta->>'contact_number'), '')),
    coalesce(nullif(trim(v_meta->>'mobile_number'), ''), nullif(trim(v_meta->>'contact_number'), ''))
  )
  on conflict (id) do update
    set role_id        = excluded.role_id,
        email          = excluded.email,
        first_name     = coalesce(nullif(excluded.first_name, ''), profiles.first_name),
        last_name      = coalesce(nullif(excluded.last_name,  ''), profiles.last_name),
        middle_name    = coalesce(excluded.middle_name,   profiles.middle_name),
        student_number = coalesce(excluded.student_number, profiles.student_number),
        employee_id    = coalesce(excluded.employee_id, profiles.employee_id),
        mobile_number  = coalesce(excluded.mobile_number, profiles.mobile_number),
        department     = coalesce(excluded.department,    profiles.department),
        program        = coalesce(excluded.program,       profiles.program),
        year_level     = coalesce(excluded.year_level,    profiles.year_level);

  -- Auto-create pending membership application if student claims existing membership
  if (not v_is_faculty) and coalesce((v_meta->>'claims_membership')::boolean, false) then
    select id into v_sy from public.school_years where is_current limit 1;
    if v_sy is null then
      select id into v_sy from public.school_years order by id desc limit 1;
    end if;
    if v_sy is not null then
      insert into public.membership_applications
        (applicant_id, school_year_id, claimed_membership_no)
      values
        (new.id, v_sy, nullif(trim(v_meta->>'membership_no'), ''))
      on conflict do nothing;
    end if;
  end if;

  return new;
end $$;

-- 4b. Self-healing function for faculty role sync
create or replace function public.sync_user_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_meta jsonb;
  v_target_role text;
  v_role_id smallint;
begin
  if v_uid is null then
    return;
  end if;

  select raw_user_meta_data into v_meta
    from auth.users
   where id = v_uid;

  v_target_role := lower(coalesce(v_meta->>'role', ''));

  if v_target_role = 'faculty' then
    select id into v_role_id from public.roles where code = 'faculty';
    if v_role_id is not null then
      update public.profiles
         set role_id = v_role_id,
             department = coalesce(department, nullif(trim(v_meta->>'department'), '')),
             employee_id = coalesce(employee_id, nullif(trim(v_meta->>'employee_id'), '')),
             year_level = null
       where id = v_uid;
    end if;
  end if;
end $$;

grant execute on function public.sync_user_role() to authenticated;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------
-- 5. Identifier-to-Email resolver for dual email/student-ID/employee-ID login
-- -----------------------------------------------------------------------
create or replace function public.get_email_for_identifier(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_clean text := trim(p_identifier);
begin
  if position('@' in v_clean) > 0 then
    return lower(v_clean);
  end if;
  select lower(email) into v_email
    from public.profiles
   where (
     lower(trim(coalesce(student_number, ''))) = lower(v_clean)
     or lower(trim(coalesce(employee_id, ''))) = lower(v_clean)
   )
     and is_active
   limit 1;
  return coalesce(v_email, lower(v_clean));
end $$;

grant execute on function public.get_email_for_identifier(text) to anon, authenticated;

-- -----------------------------------------------------------------------
-- 6. Faculty can create/edit events (Bug 6)
-- The existing RLS uses is_staff() which should include faculty already.
-- This block makes it explicit and safe.
-- -----------------------------------------------------------------------

-- Redefine is_staff() to explicitly include faculty
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
      join public.roles r on r.id = p.role_id
     where p.id = auth.uid()
       and r.code in ('officer', 'faculty', 'admin')
       and p.is_active
  )
$$;

-- events insert: officer, faculty, admin may insert (created_by = themselves)
drop policy if exists events_staff_insert on events;
create policy events_staff_insert on events
  for insert to authenticated
  with check (is_staff() and created_by = auth.uid());

-- events update: officer, faculty (own only), admin (all)
drop policy if exists events_staff_update on events;
create policy events_staff_update on events
  for update to authenticated
  using (
    is_staff() and (
      auth_role() = 'admin'
      or created_by = auth.uid()
    )
  )
  with check (
    is_staff() and (
      auth_role() = 'admin'
      or created_by = auth.uid()
    )
  );

-- posts insert: officer, faculty, admin
drop policy if exists posts_staff_insert on posts;
create policy posts_staff_insert on posts
  for insert to authenticated
  with check (is_staff() and author_id = auth.uid());

-- posts update: officer, faculty (own), admin (all)
drop policy if exists posts_staff_update on posts;
create policy posts_staff_update on posts
  for update to authenticated
  using (
    is_staff() and (
      auth_role() = 'admin'
      or author_id = auth.uid()
    )
  )
  with check (
    is_staff() and (
      auth_role() = 'admin'
      or author_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------
-- 7. Seed default school year + demo events/posts if tables are empty
-- -----------------------------------------------------------------------
insert into public.events (
  title, slug, description, venue, start_at, end_at, registration_deadline,
  requires_registration, capacity, participant_count, visibility, status
) values
(
  'CpE General Assembly 2026: Innovate, Integrate, Inspire',
  'cpe-general-assembly-2026',
  'The premier gathering of all Computer Engineering students at CIT-U.',
  'CIT-U Auditorium & Virtual Stream',
  '2026-11-20 13:00:00+08', '2026-11-20 17:00:00+08', '2026-11-19 23:59:00+08',
  true, 250, 0, 'public', 'published'
),
(
  'Embedded Systems & IoT Hands-On Workshop',
  'embedded-systems-iot-workshop-2026',
  'Hands-on ESP32 and FreeRTOS programming. Members only.',
  'CEA Building Lab 304',
  '2026-11-28 09:00:00+08', '2026-11-28 16:00:00+08', '2026-11-26 23:59:00+08',
  true, 40, 0, 'members_only', 'published'
),
(
  'Wildcat Hackathon 2026: Solutions for Tomorrow',
  'wildcat-hackathon-2026',
  '24-hour hackathon building hardware-software integrated prototypes.',
  'CIT-U Innovation Hub',
  '2026-12-05 08:00:00+08', '2026-12-06 12:00:00+08', '2026-12-01 23:59:00+08',
  true, 120, 0, 'public', 'published'
)
on conflict (slug) do nothing;

insert into public.posts (
  post_type, title, slug, summary, body, visibility, status, is_pinned, published_at
) values
(
  'announcement',
  'Official Call for ICpEP.SE CIT-U Membership AY 2026-2027',
  'membership-call-ay-2026-2027',
  'Registration for ICpEP.SE Student Chapter is now open.',
  'We invite all CIT-U Computer Engineering students to join ICpEP.SE for AY 2026-2027.',
  'public', 'published', true, now()
),
(
  'news',
  'CIT-U CpE Wildcats Secure Top Spots at National Robotics Challenge',
  'cpe-wildcats-robotics-challenge-victory',
  'Our chapter delegation secured 1st and 3rd runners-up.',
  'Congratulations to our teams who represented CIT-U at the National Robotics Challenge.',
  'public', 'published', false, now() - interval '3 days'
)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------
-- 8. Retroactively heal existing faculty accounts mislabeled as student
-- -----------------------------------------------------------------------
update public.profiles p
   set role_id = r.id,
       department = coalesce(p.department, nullif(trim(u.raw_user_meta_data->>'department'), '')),
       employee_id = coalesce(p.employee_id, nullif(trim(u.raw_user_meta_data->>'employee_id'), '')),
       year_level = null
  from auth.users u
  cross join public.roles r
 where p.id = u.id
   and (
     lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'faculty'
     or nullif(trim(coalesce(u.raw_user_meta_data->>'employee_id', '')), '') is not null
     or (nullif(trim(coalesce(u.raw_user_meta_data->>'department', '')), '') is not null and nullif(trim(coalesce(u.raw_user_meta_data->>'student_number', '')), '') is null)
   )
   and r.code = 'faculty';
