-- =====================================================================
-- ICpEP.SE CIT-U Organization Portal — Migration 0003
-- Fix Faculty Registration Role & Employee ID
-- =====================================================================

-- 1. Ensure employee_id and mobile_number columns exist on public.profiles
alter table public.profiles
  add column if not exists employee_id text,
  add column if not exists mobile_number text;

drop index if exists public.profiles_employee_id_key;
create unique index if not exists profiles_employee_id_key
  on public.profiles (lower(trim(employee_id)))
  where employee_id is not null and trim(employee_id) <> '';

-- 2. Ensure all 5 standard roles exist
insert into public.roles (code, name, description) values
  ('non_member', 'Non-Member Student',   'CpE student with an account who is not (yet) a verified ICpEP member'),
  ('member',     'ICpEP Member',         'CpE student with a verified ICpEP membership for the current school year'),
  ('officer',    'ICpEP Officer',        'Elected/appointed officer; manages content, events and membership verification'),
  ('faculty',    'Faculty / Adviser',    'Read-only oversight of activities, reports and announcements'),
  ('admin',      'System Administrator', 'Manages accounts, roles, content moderation and system settings')
on conflict (code) do nothing;

-- 3. Robust handle_new_user trigger supporting faculty & student roles
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
  -- Disallow public self-assignment to admin or officer.
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
end;
$$;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Self-healing function for faculty role sync
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

  -- Only heal faculty; do not allow privilege escalation to admin/officer
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
end;
$$;

grant execute on function public.sync_user_role() to authenticated;

-- 5. Identifier resolver supporting both student_number and employee_id
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
end;
$$;

grant execute on function public.get_email_for_identifier(text) to anon, authenticated;

-- 6. Retroactively heal any existing faculty accounts mislabeled as students
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

