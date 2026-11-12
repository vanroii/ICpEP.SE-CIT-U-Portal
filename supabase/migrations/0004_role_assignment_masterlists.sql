-- Faculty-managed student roster and guarded role assignment/import functions.

create table if not exists public.student_masterlist (
  student_number text primary key check (length(trim(student_number)) > 0),
  first_name text not null check (length(trim(first_name)) > 0),
  middle_name text,
  last_name text not null check (length(trim(last_name)) > 0),
  email text,
  program text,
  year_level smallint check (year_level between 1 and 6),
  imported_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists student_masterlist_student_number_lower_key
  on public.student_masterlist (lower(trim(student_number)));

alter table public.student_masterlist enable row level security;
grant select on public.student_masterlist to authenticated;

drop policy if exists student_masterlist_staff_read on public.student_masterlist;
create policy student_masterlist_staff_read on public.student_masterlist
  for select to authenticated
  using (coalesce(public.auth_role() in ('faculty', 'officer', 'admin'), false));

create or replace function public.faculty_assign_officer(p_student_number text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_role_id smallint;
begin
  if not coalesce(public.auth_role() in ('faculty', 'admin'), false) then
    raise exception 'Only faculty and administrators can assign officers';
  end if;

  select p.id into v_student_id
    from public.profiles p
    join public.roles r on r.id = p.role_id
   where lower(trim(p.student_number)) = lower(trim(p_student_number))
     and r.code in ('non_member', 'member')
   for update of p;

  if v_student_id is null then
    raise exception 'No eligible student account was found for student number %', p_student_number;
  end if;

  select id into v_role_id from public.roles where code = 'officer';
  perform set_config('app.system_update', 'on', true);
  update public.profiles set role_id = v_role_id where id = v_student_id;
  perform set_config('app.system_update', 'off', true);

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'user.officer_assigned', 'profile', v_student_id::text,
          jsonb_build_object('student_number', p_student_number));
end;
$$;

create or replace function public.import_student_masterlist(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_student_number text;
  v_first_name text;
  v_middle_name text;
  v_last_name text;
  v_email text;
  v_program text;
  v_year_level smallint;
  v_imported integer := 0;
  v_matched integer := 0;
  v_row_number integer := 0;
begin
  if not coalesce(public.auth_role() in ('faculty', 'admin'), false) then
    raise exception 'Only faculty and administrators can import the student masterlist';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Student rows must be provided as a CSV row array';
  end if;
  if jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 5000 then
    raise exception 'Upload between 1 and 5,000 student rows';
  end if;

  perform set_config('app.system_update', 'on', true);
  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_row_number := v_row_number + 1;
    v_student_number := nullif(trim(v_row->>'student_number'), '');
    v_first_name := nullif(trim(v_row->>'first_name'), '');
    v_middle_name := nullif(trim(v_row->>'middle_name'), '');
    v_last_name := nullif(trim(v_row->>'last_name'), '');
    v_email := nullif(trim(v_row->>'email'), '');
    v_program := nullif(trim(v_row->>'program'), '');
    v_year_level := nullif(trim(v_row->>'year_level'), '')::smallint;

    if v_student_number is null or v_first_name is null or v_last_name is null then
      raise exception 'Student number, first name, and last name are required on imported row %', v_row_number;
    end if;
    if v_year_level is not null and v_year_level not between 1 and 6 then
      raise exception 'Year level must be from 1 to 6 on imported row %', v_row_number;
    end if;

    insert into public.student_masterlist
      (student_number, first_name, middle_name, last_name, email, program, year_level, imported_by, updated_at)
    values
      (v_student_number, v_first_name, v_middle_name, v_last_name, v_email, v_program, v_year_level, auth.uid(), now())
    on conflict ((lower(trim(student_number)))) do update
      set first_name = excluded.first_name,
          middle_name = excluded.middle_name,
          last_name = excluded.last_name,
          email = excluded.email,
          program = excluded.program,
          year_level = excluded.year_level,
          imported_by = excluded.imported_by,
          updated_at = excluded.updated_at;
    v_imported := v_imported + 1;

    update public.profiles
       set first_name = v_first_name,
           middle_name = v_middle_name,
           last_name = v_last_name,
           program = coalesce(v_program, program),
           year_level = coalesce(v_year_level, year_level)
     where lower(trim(student_number)) = lower(v_student_number)
       and exists (
         select 1 from public.roles r
          where r.id = profiles.role_id and r.code in ('non_member', 'member', 'officer')
       );
    if found then v_matched := v_matched + 1; end if;
  end loop;
  perform set_config('app.system_update', 'off', true);

  insert into public.activity_logs (actor_id, action, entity_type, details)
  values (auth.uid(), 'student.masterlist_imported', 'student_masterlist',
          jsonb_build_object('imported', v_imported, 'matched_accounts', v_matched));

  return jsonb_build_object('imported', v_imported, 'matched', v_matched);
end;
$$;

create or replace function public.import_member_masterlist(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_student_id uuid;
  v_student_number text;
  v_membership_no text;
  v_school_year_id smallint;
  v_valid_until date;
  v_imported integer := 0;
  v_row_number integer := 0;
begin
  if not coalesce(public.auth_role() in ('officer', 'admin'), false) then
    raise exception 'Only officers and administrators can import the member masterlist';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Member rows must be provided as a CSV row array';
  end if;
  if jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 5000 then
    raise exception 'Upload between 1 and 5,000 member rows';
  end if;

  select id, end_date into v_school_year_id, v_valid_until
    from public.school_years where is_current;
  if v_school_year_id is null then
    raise exception 'There is no current school year for membership assignment';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_row_number := v_row_number + 1;
    v_student_number := nullif(trim(v_row->>'student_number'), '');
    v_membership_no := nullif(trim(v_row->>'membership_no'), '');
    if v_student_number is null or v_membership_no is null then
      raise exception 'Student number and membership number are required on imported row %', v_row_number;
    end if;

    select p.id into v_student_id
      from public.profiles p
      join public.roles r on r.id = p.role_id
     where lower(trim(p.student_number)) = lower(v_student_number)
       and r.code in ('non_member', 'member')
     for update of p;
    if v_student_id is null then
      raise exception 'No eligible student account found for student number % on imported row %',
        v_student_number, v_row_number;
    end if;

    insert into public.memberships
      (user_id, school_year_id, membership_no, status, valid_until, granted_by)
    values
      (v_student_id, v_school_year_id, v_membership_no, 'active', v_valid_until, auth.uid())
    on conflict (user_id, school_year_id) do update
      set membership_no = excluded.membership_no,
          status = 'active',
          valid_until = excluded.valid_until,
          granted_by = excluded.granted_by;
    v_imported := v_imported + 1;
  end loop;

  insert into public.activity_logs (actor_id, action, entity_type, details)
  values (auth.uid(), 'membership.masterlist_imported', 'memberships',
          jsonb_build_object('imported', v_imported, 'school_year_id', v_school_year_id));

  return jsonb_build_object('imported', v_imported, 'matched', v_imported);
end;
$$;

revoke all on function public.faculty_assign_officer(text) from public, anon;
revoke all on function public.import_student_masterlist(jsonb) from public, anon;
revoke all on function public.import_member_masterlist(jsonb) from public, anon;
grant execute on function public.faculty_assign_officer(text) to authenticated;
grant execute on function public.import_student_masterlist(jsonb) to authenticated;
grant execute on function public.import_member_masterlist(jsonb) to authenticated;

notify pgrst, 'reload schema';
