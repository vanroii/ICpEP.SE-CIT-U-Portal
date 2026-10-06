# ICpEP.SE CIT-U Organization Portal

**Course/Section:** CPEPE361 / SD — H3  
**Project Group:**
- Pogoy, Jovan Roilan E. (Project Manager / Full-Stack)
- Tamares, John Norbert A. (Backend / DBA)
- Babatuan, Edrianne H. (Frontend / UI-UX)

---

## 1. Overview

The **ICpEP.SE CIT-U Organization Portal** is a web portal designed and developed for the Institute of Computer Engineers of the Philippines - Student Edition, Cebu Institute of Technology - University Chapter.

### Key Capabilities
- **Public Information:** Public visitors can browse chapter events, news, announcements, organizational background, and chapter officer rosters without logging in.
- **Account & Access:** CIT-U CpE students register and authenticate through Supabase Auth (bcrypt hashed, email verification).
- **Membership Management:**
  - Non-Member students can apply for verified ICpEP membership.
  - Officers review applications, assign official membership numbers, and approve or decline with remarks.
  - Profile roles automatically synchronize between `non_member` and `member` via database triggers.
- **Events & Registration:**
  - Officers publish, edit, and archive chapter events and workshops.
  - Students register with automatic capacity checks, deadline enforcement, and member-exclusive gating (BR-05, BR-06).
- **Messaging & Notifications:**
  - Internal student-officer messaging network (`/inbox`).
  - Real-time notification fan-out on published events, circulars, membership status updates, and event reminders (`/notifications`).
- **Administration & Oversight:**
  - Administrator dashboard (`/admin`) for account role assignment, user activation/deactivation, and site settings.
  - Faculty/Adviser dashboard (`/faculty`) providing read-only oversight of analytics, participation ratios, and audit logs.

---

## 2. Technology Stack

- **Framework:** Next.js 15+ (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 with custom ICpEP.SE brand theme tokens
- **Database & Auth:** PostgreSQL 15+ on Supabase with Row-Level Security (RLS) on all 14 tables
- **Access Control:** Layered defence-in-depth with Next.js edge route gating (`src/proxy.ts`) + PostgreSQL RLS policies
- **Icons:** Lucide Icons (Feather outline style)

---

## 3. Brand & Design Tokens

Sampled from the official ICpEP.SE CIT-U Chapter Badge:

| Token | Hex | Role |
|---|---|---|
| Primary (brand blue) | `#1CA7E0` | Buttons, links, active states, brand accents |
| Brand dark | `#0A7DB0` | Text links on white surfaces (AA contrast safe) |
| Brand tint | `#E3F6FC` | Info badges, banners, table highlights |
| Ink (near-black) | `#1B1613` | Headers, navbars, body text |
| Surface | `#F8F8F7` | Background page color |
| White | `#FFFFFF` | Cards, modals, panels |

---

## 4. Role Routing & Access Matrix

| Route | Allowed Roles | Notes |
|---|---|---|
| `/`, `/events`, `/news`, `/about` | Public (Everyone) | Public published content only (BR-01) |
| `/login`, `/register` | Signed-out visitors | Redirects signed-in users to their role dashboard |
| `/student` | `non_member`, `member` | Membership status, registrations, events feed |
| `/officer` | `officer`, `admin` | Manage events, posts, verify membership, view reports |
| `/faculty` | `faculty`, `admin` | Read-only oversight of activities & analytics (BR-09) |
| `/admin` | `admin` | User directory, role assignment, account activation, settings |
| `/inbox` | `non_member`, `member`, `officer`, `faculty` | Internal messaging network |
| `/notifications`, `/profile` | All authenticated roles | Own rows only (BR-07) |

---

## 5. Local Setup Guide

### Prerequisites
- Node.js 20+
- npm 10+
- A free Supabase project (at [supabase.com](https://supabase.com))

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Run Database Migrations & Seed
1. Open your Supabase Dashboard → **SQL Editor**.
2. Run `supabase/migrations/0001_schema.sql` top to bottom.
3. Run `supabase/seed.sql` to populate current school years, events, posts, and settings.
4. Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to Redirect URLs.

### 3. Install & Start Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Create First Administrator Account
1. Sign up a new student account at `/register`.
2. Confirm the verification email.
3. In the Supabase SQL editor, elevate your account to `admin`:
```sql
update profiles
set role_id = (select id from roles where code = 'admin')
where email = 'your.email@cit.edu';
```
4. Sign in again at `/login` — you will be routed automatically to `/admin`.

---

## 6. Directory Structure

```text
ICpEP.SE-CIT-U-Portal/
├── src/
│   ├── proxy.ts                    # Edge session refresh and role gating
│   ├── lib/
│   │   ├── roles.ts                # Role mappings and area access definitions
│   │   └── supabase/               # Browser, server, and session SSR clients
│   ├── components/
│   │   ├── NavBar.tsx              # Universal Guest/Auth navigation bar
│   │   ├── ContentCard.tsx         # Event and post cards with brand gradients
│   │   ├── ui/
│   │   │   ├── Button.tsx          # Design system button variants
│   │   │   ├── Badge.tsx           # Design system pill badges
│   │   │   ├── Input.tsx           # Design system form input with focus ring
│   │   │   └── Avatar.tsx          # Initials-based avatar component
│   │   └── Table/TableRow.tsx      # Table row component
│   └── app/
│       ├── layout.tsx              # Root shell layout with brand footer
│       ├── globals.css             # Tailwind v4 theme and brand color tokens
│       ├── page.tsx                # Public landing page with hero and feeds
│       ├── about/                  # About page with officers & faculty roster
│       ├── events/                 # Events catalog and detail registration view
│       ├── news/                   # News, announcements, and circulars
│       ├── login/ & register/      # Authentication pages and server actions
│       ├── student/                # Student / Member dashboard
│       ├── officer/                # Officer dashboard with event & post management
│       ├── faculty/                # Faculty read-only oversight dashboard
│       ├── admin/                  # Administrator user management & settings
│       ├── inbox/                  # Messaging mailbox with split thread view
│       ├── notifications/          # Real-time notifications feed
│       └── profile/                # User profile view and update form
├── supabase/
│   ├── migrations/0001_schema.sql  # Full tested SQL schema with RLS and triggers
│   └── seed.sql                    # Initial seed dataset
├── .env.example
├── package.json
└── README.md
```

---

## 7. License

Academic software developed for CIT-U Department of Computer Engineering (CPEPE361).
