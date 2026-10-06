-- =====================================================================
-- ICpEP.SE CIT-U Organization Portal — Seed Data
-- =====================================================================

-- 1. Current School Year
insert into school_years (label, start_date, end_date, is_current)
values ('2026-2027', '2026-08-01', '2027-05-31', true)
on conflict (label) do update
  set is_current = excluded.is_current,
      start_date = excluded.start_date,
      end_date = excluded.end_date;

-- 2. Initial Sample Events
insert into events (
  title, slug, description, venue, start_at, end_at, registration_deadline,
  requires_registration, capacity, participant_count, visibility, status
) values
(
  'CpE General Assembly 2026: Innovate, Integrate, Inspire',
  'cpe-general-assembly-2026',
  'The premier gathering of all Computer Engineering students at Cebu Institute of Technology - University. Discover the annual roadmap, meet your chapter officers, and engage in technical breakout sessions.',
  'CIT-U Auditorium & Virtual Stream',
  '2026-10-15 13:00:00+08',
  '2026-10-15 17:00:00+08',
  '2026-10-14 23:59:00+08',
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
  '2026-10-22 09:00:00+08',
  '2026-10-22 16:00:00+08',
  '2026-10-20 23:59:00+08',
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
  '2026-11-05 08:00:00+08',
  '2026-11-06 12:00:00+08',
  '2026-11-01 23:59:00+08',
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
  '2026-11-18 14:00:00+08',
  '2026-11-18 16:30:00+08',
  '2026-11-17 23:59:00+08',
  true,
  150,
  0,
  'public',
  'published'
)
on conflict (slug) do nothing;

-- 3. Initial Sample Posts
insert into posts (
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
