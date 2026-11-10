-- =====================================================================
-- ICpEP.SE CIT-U Organization Portal — Migration 0002
-- Fixes for Signup, Student ID Login, Roles RLS, and Default Data
-- =====================================================================

-- 1. Ensure Roles are readable by anon and authenticated
grant select on public.roles to anon, authenticated;

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles for select to anon, authenticated using (true);

-- Ensure all 5 standard roles exist
insert into public.roles (code, name, description) values
  ('non_member', 'Non-Member Student',   'CpE student with an account who is not (yet) a verified ICpEP member'),
  ('member',     'ICpEP Member',         'CpE student with a verified ICpEP membership for the current school year'),
  ('officer',    'ICpEP Officer',        'Elected/appointed officer; manages content, events and membership verification'),
  ('faculty',    'Faculty / Adviser',    'Read-only oversight of activities, reports and announcements'),
  ('admin',      'System Administrator', 'Manages accounts, roles, content moderation and system settings')
on conflict (code) do nothing;

-- 2. Ensure current active School Year exists
insert into public.school_years (label, start_date, end_date, is_current)
values ('2026-2027', '2026-08-01', '2027-05-31', true)
on conflict (label) do update
  set is_current = true,
      start_date = excluded.start_date,
      end_date = excluded.end_date;

-- 3. Robust handle_new_user trigger function
-- Fallbacks prevent "Database error saving new user" 500 errors
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role smallint;
  v_sy   smallint;
  v_first text;
  v_last  text;
  v_program text;
  v_year smallint;
begin
  -- Resolve non_member role
  select id into v_role from public.roles where code = 'non_member';
  if v_role is null then
    insert into public.roles (code, name, description)
    values ('non_member', 'Non-Member Student', 'CpE student with an account who is not (yet) a verified ICpEP member')
    on conflict (code) do update set name = excluded.name
    returning id into v_role;
  end if;

  -- Resolve safe first & last names
  v_first := coalesce(nullif(trim(v_meta->>'first_name'), ''), split_part(new.email, '@', 1), 'Student');
  v_last  := coalesce(nullif(trim(v_meta->>'last_name'), ''), 'Member');
  v_program := coalesce(nullif(trim(v_meta->>'program'), ''), 'BS Computer Engineering');

  v_year := case
    when (v_meta->>'year_level') ~ '^[1-6]$' then (v_meta->>'year_level')::smallint
    else 1
  end;

  insert into public.profiles (
    id, role_id, email, student_number, first_name, middle_name, last_name,
    program, year_level, contact_number
  ) values (
    new.id,
    v_role,
    lower(new.email),
    nullif(trim(v_meta->>'student_number'), ''),
    v_first,
    nullif(trim(v_meta->>'middle_name'), ''),
    v_last,
    v_program,
    v_year,
    nullif(trim(v_meta->>'contact_number'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(excluded.first_name, ''), profiles.first_name),
        last_name = coalesce(nullif(excluded.last_name, ''), profiles.last_name),
        student_number = coalesce(excluded.student_number, profiles.student_number),
        program = coalesce(excluded.program, profiles.program),
        year_level = coalesce(excluded.year_level, profiles.year_level);

  -- "I am already an ICpEP member" on registration form -> pending membership application
  if coalesce((v_meta->>'claims_membership')::boolean, false) then
    select id into v_sy from public.school_years where is_current limit 1;
    if v_sy is null then
      select id into v_sy from public.school_years order by id desc limit 1;
    end if;

    if v_sy is not null then
      insert into public.membership_applications (applicant_id, school_year_id, claimed_membership_no)
      values (new.id, v_sy, nullif(trim(v_meta->>'membership_no'), ''))
      on conflict do nothing;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 4. Identifier-to-Email resolver for dual email/student-ID login
create or replace function public.get_email_for_identifier(p_identifier text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_clean text := trim(p_identifier);
begin
  if position('@' in v_clean) > 0 then
    return lower(v_clean);
  end if;

  select lower(email) into v_email
    from public.profiles
   where lower(trim(student_number)) = lower(v_clean)
     and is_active
   limit 1;

  return coalesce(v_email, lower(v_clean));
end $$;

grant execute on function public.get_email_for_identifier(text) to anon, authenticated;

-- 5. Seed initial official events if empty
insert into public.events (
  title, slug, description, venue, start_at, end_at, registration_deadline,
  requires_registration, capacity, participant_count, visibility, status
) values
(
  'CpE General Assembly 2026: Innovate, Integrate, Inspire',
  'cpe-general-assembly-2026',
  'The premier gathering of all Computer Engineering students at Cebu Institute of Technology - University. Discover the annual roadmap, meet your chapter officers, and engage in technical breakout sessions.',
  'CIT-U Auditorium & Virtual Stream',
  '2026-11-20 13:00:00+08',
  '2026-11-20 17:00:00+08',
  '2026-11-19 23:59:00+08',
  true,
  250,
  0,
  'public',
  'published'
),
(
  'Embedded Systems & IoT Hands-On Workshop',
  'embedded-systems-iot-workshop-2026',
  'Hands-on micro-controller programming with ESP32 and FreeRTOS. Open exclusively to verified ICpEP Members. Hardware kits will be provided on-site.',
  'CEA Building Lab 304',
  '2026-11-28 09:00:00+08',
  '2026-11-28 16:00:00+08',
  '2026-11-26 23:59:00+08',
  true,
  40,
  0,
  'members_only',
  'published'
),
(
  'Wildcat Hackathon 2026: Solutions for Tomorrow',
  'wildcat-hackathon-2026',
  'Annual 24-hour hackathon challenging CpE student teams to build hardware-software integrated prototypes addressing community challenges.',
  'CIT-U Innovation Hub',
  '2026-12-05 08:00:00+08',
  '2026-12-06 12:00:00+08',
  '2026-12-01 23:59:00+08',
  true,
  120,
  0,
  'public',
  'published'
),
(
  'Industry Tech Talk: FPGA Acceleration & AI at the Edge',
  'fpga-acceleration-ai-edge-tech-talk',
  'Keynote session with guest senior silicon engineers discussing advanced computer architecture, FPGA acceleration, and modern edge AI pipelines.',
  'CIT-U Multimedia Hall',
  '2026-12-18 14:00:00+08',
  '2026-12-18 16:30:00+08',
  '2026-12-17 23:59:00+08',
  true,
  150,
  0,
  'public',
  'published'
)
on conflict (slug) do nothing;

-- 6. Seed initial official posts if empty
insert into public.posts (
  post_type, title, slug, summary, body, visibility, status, is_pinned, published_at
) values
(
  'announcement',
  'Official Call for ICpEP.SE CIT-U Membership AY 2026–2027',
  'membership-call-ay-2026-2027',
  'Registration and renewal for the ICpEP.SE Student Chapter are now officially open. Learn about member benefits, exclusive seminars, and technical workshops.',
  'We are excited to invite all CIT-U Computer Engineering students to join ICpEP.SE for the Academic Year 2026–2027! As a member, you gain access to members-only workshops, national competitions, technical certifications, and networking with industry mentors. Sign up and claim your membership through this portal today.',
  'public',
  'published',
  true,
  now()
),
(
  'news',
  'CIT-U CpE Wildcats Secure Top Spots at National Robotics Challenge',
  'cpe-wildcats-robotics-challenge-victory',
  'Our chapter delegation emerged victorious, securing 1st and 3rd runners-up in the Autonomous Rover and Micro-controller Innovation categories.',
  'Congratulations to our student teams who proudly represented Cebu Institute of Technology - University at the National Robotics and Embedded Systems Challenge. Their hard work, guided by our faculty advisers, showcases the exemplary talent in CIT-U Computer Engineering.',
  'public',
  'published',
  false,
  now() - interval '3 days'
),
(
  'update',
  'ICpEP.SE Student Lounge & Laboratory Access Guidelines',
  'student-lounge-lab-guidelines-update',
  'Updated laboratory safety protocols, tool checkout procedures, and collaborative workspace reservations for CpE students.',
  'Please review the updated guidelines for using the CEA Lab and Student Hub. All equipment reservations and project fabrication requests must be logged through the portal or chapter officers.',
  'public',
  'published',
  false,
  now() - interval '7 days'
)
on conflict (slug) do nothing;
