-- Tent & Table database (version 16).
-- Paste this whole file into Supabase: SQL Editor -> New query -> Run.
-- It is safe to run more than once. Every table starts with "ed_", so it can
-- share a Supabase project with Tend Home without touching Tend's data.
--
-- How it fits together
--   Ministry (ed_orgs) ── up to 10 logins (ed_members). One login belongs to one ministry.
--   Directory: the ministry's pool, shared by every event
--     ed_people, ed_vendors, ed_contacts, ed_equipment, ed_budget
--   Events (ed_events) and what each one uses
--     assignments drawn from the Directory: ed_event_people, ed_event_vendors,
--       ed_event_contacts, ed_event_equipment
--     the event's own plan: ed_schedule, ed_tasks, ed_agenda, ed_setlists
--     public sign-ups: ed_items (serve spots and meals) and ed_signups
--     money: ed_offerings, ed_expenses (plus vendor and speaker costs on the assignments)
--     follow-up: ed_cards (connection cards)
--     prayer: ed_prayer (scripture, declarations and needs the prayer team intercedes for)
--   Public pages call only the ed_public, ed_sign, ed_unsign, ed_mine, ed_connect and ed_checkin functions.

-- ============================================================ accounts
create table if not exists public.ed_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- One login, one ministry: user_id is unique. Someone who serves two ministries
-- signs up a second time with a different email.
create table if not exists public.ed_members (
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text,
  name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Ministry profile and personal settings (added in version 3; safe to re-run).
alter table public.ed_orgs add column if not exists website text not null default '' check (length(website) <= 300);
alter table public.ed_orgs add column if not exists email text not null default '' check (length(email) <= 200);
alter table public.ed_orgs add column if not exists phone text not null default '' check (length(phone) <= 40);
alter table public.ed_orgs add column if not exists address text not null default '' check (length(address) <= 300);
alter table public.ed_orgs add column if not exists about text not null default '' check (length(about) <= 2000);
alter table public.ed_orgs add column if not exists giving_link text not null default '' check (length(giving_link) <= 300);
alter table public.ed_orgs add column if not exists timezone text not null default 'America/Chicago' check (length(timezone) <= 60);
alter table public.ed_members add column if not exists phone text not null default '' check (length(phone) <= 40);
alter table public.ed_members add column if not exists prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) < 4000);

create table if not exists public.ed_invites (
  code text primary key,
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);
create index if not exists ed_invites_org_idx on public.ed_invites (org_id);

-- ============================================================ directory
create table if not exists public.ed_people (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  title text not null default '',            -- President, Worship Director, Guest Speaker...
  groups text[] not null default '{}',       -- Team Member, Volunteer, Speaker, Worship, Prayer Team, Board
  status text not null default 'current' check (status in ('current', 'previous')),
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_people_org_idx on public.ed_people (org_id);

create table if not exists public.ed_vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  category text not null default '',
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_vendors_org_idx on public.ed_vendors (org_id);

create table if not exists public.ed_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  organization text not null default '',
  role text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_contacts_org_idx on public.ed_contacts (org_id);

create table if not exists public.ed_equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  category text not null default '',
  quantity int not null default 1 check (quantity between 0 and 100000),
  location text not null default '',
  condition text not null default 'Good' check (condition in ('Good', 'Needs Repair', 'Missing', 'Retired')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_equipment_org_idx on public.ed_equipment (org_id);

-- ============================================================ events
create table if not exists public.ed_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{4,60}$'),
  title text not null check (length(title) between 1 and 120),
  starts_on date,
  ends_on date,
  time_label text not null default '',       -- "Nightly at 7 PM"
  place text not null default '',
  address text not null default '',
  about text not null default '',
  contact_line text not null default '',
  giving_link text not null default '',
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  notes text not null default '',            -- meeting notes and decisions
  sections text[] not null default '{}',     -- which tabs the event uses; empty means all
  is_open boolean not null default true,     -- public sign-ups open
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index if not exists ed_events_org_idx on public.ed_events (org_id);

-- Budget lines for the year. event_id is set when a line belongs to one event.
create table if not exists public.ed_budget (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  year int not null check (year between 2000 and 2200),
  name text not null check (length(name) between 1 and 120),
  planned numeric(12, 2) not null default 0 check (planned >= 0),
  event_id uuid references public.ed_events (id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_budget_org_idx on public.ed_budget (org_id, year);

-- ---------- assignments: what an event draws from the Directory
create table if not exists public.ed_event_people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  person_id uuid not null references public.ed_people (id) on delete cascade,
  team text not null check (team in ('leader', 'team', 'speaker', 'worship', 'volunteer')),
  role text not null default '',             -- Altar Counselor, Keys, Guest Speaker...
  days text not null default '',
  details jsonb not null default '{}'::jsonb, -- speaker: topic, time, travel, lodging
  amount numeric(12, 2) not null default 0 check (amount >= 0),   -- honorarium or stipend
  pay_status text not null default 'Not Paid' check (pay_status in ('Not Paid', 'Deposit Paid', 'Paid In Full')),
  payer text not null default '',            -- who is responsible for paying
  due_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, person_id, team)
);
create index if not exists ed_event_people_person_idx on public.ed_event_people (person_id);

create table if not exists public.ed_event_vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  vendor_id uuid not null references public.ed_vendors (id) on delete cascade,
  service text not null default '',
  status text not null default 'Quoted' check (status in ('Quoted', 'Booked', 'Cancelled')),
  arrival text not null default '',
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  paid numeric(12, 2) not null default 0 check (paid >= 0),
  pay_status text not null default 'Not Paid' check (pay_status in ('Not Paid', 'Deposit Paid', 'Paid In Full')),
  payer text not null default '',
  due_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, vendor_id)
);
create index if not exists ed_event_vendors_vendor_idx on public.ed_event_vendors (vendor_id);

create table if not exists public.ed_event_contacts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  contact_id uuid not null references public.ed_contacts (id) on delete cascade,
  role text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, contact_id)
);
create index if not exists ed_event_contacts_contact_idx on public.ed_event_contacts (contact_id);

create table if not exists public.ed_event_equipment (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  equipment_id uuid not null references public.ed_equipment (id) on delete cascade,
  quantity int not null default 1 check (quantity between 1 and 100000),
  loaded boolean not null default false,
  returned boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, equipment_id)
);
create index if not exists ed_event_equipment_eq_idx on public.ed_event_equipment (equipment_id);

-- ---------- the event's own plan
create table if not exists public.ed_schedule (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  on_date date not null,
  start_time time,
  end_time time,
  title text not null check (length(title) between 1 and 160),
  location text not null default '',
  owner text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_schedule_event_idx on public.ed_schedule (event_id, on_date);

create table if not exists public.ed_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  phase text not null default 'planning',
  title text not null check (length(title) between 1 and 160),
  due_on date,
  due_time text not null default '',
  owner text not null default '',
  done boolean not null default false,
  notes text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_tasks_event_idx on public.ed_tasks (event_id);

create table if not exists public.ed_agenda (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  leader text not null default '',
  minutes int check (minutes between 0 and 1440),
  done boolean not null default false,
  notes text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_agenda_event_idx on public.ed_agenda (event_id);

create table if not exists public.ed_setlists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  on_date date,
  title text not null default '',
  rehearsal text not null default '',
  songs text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_setlists_event_idx on public.ed_setlists (event_id);

-- ---------- public sign-ups
create table if not exists public.ed_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  kind text not null check (kind in ('serve', 'meal')),
  title text not null check (length(title) between 1 and 120),
  on_date date,
  time_label text not null default '',
  needed int not null default 1 check (needed between 1 and 500),
  notes text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_items_event_idx on public.ed_items (event_id);

create table if not exists public.ed_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  item_id uuid not null references public.ed_items (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  phone text not null default '',
  email text not null default '',
  note text not null default '',
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_signups_event_idx on public.ed_signups (event_id);
create index if not exists ed_signups_item_idx on public.ed_signups (item_id);
-- version 11: each task records who created it (task_owner); the work goes to the assignees
alter table public.ed_tasks add column if not exists task_owner text not null default '';
alter table public.ed_tasks drop constraint if exists ed_tasks_task_owner_check;
alter table public.ed_tasks add constraint ed_tasks_task_owner_check check (length(task_owner) <= 120);

-- version 10: a task can go to several contacts, and says how many people it needs.
-- assignee_refs holds "ed_people:<id>", "ed_vendors:<id>" or "ed_contacts:<id>"; owner keeps the names.
alter table public.ed_tasks add column if not exists assignee_refs text[] not null default '{}';
alter table public.ed_tasks drop constraint if exists ed_tasks_assignee_refs_check;
alter table public.ed_tasks add constraint ed_tasks_assignee_refs_check check (cardinality(assignee_refs) <= 40);
alter table public.ed_tasks add column if not exists needed int not null default 1;
alter table public.ed_tasks drop constraint if exists ed_tasks_needed_check;
alter table public.ed_tasks add constraint ed_tasks_needed_check check (needed between 1 and 100);

-- version 9: the heart of each event, and who leads each agenda segment or schedule item
alter table public.ed_events add column if not exists theme text not null default '';
alter table public.ed_events drop constraint if exists ed_events_theme_check;
alter table public.ed_events add constraint ed_events_theme_check check (length(theme) <= 200);
alter table public.ed_events add column if not exists purpose text not null default '';
alter table public.ed_events drop constraint if exists ed_events_purpose_check;
alter table public.ed_events add constraint ed_events_purpose_check check (length(purpose) <= 3000);
-- leader_ref / owner_ref point at a contact as "ed_people:<id>", "ed_vendors:<id>" or "ed_contacts:<id>";
-- leader / owner keep the name, so a deleted contact still leaves a name behind.
alter table public.ed_agenda add column if not exists leader_ref text not null default '';
alter table public.ed_agenda drop constraint if exists ed_agenda_leader_ref_check;
alter table public.ed_agenda add constraint ed_agenda_leader_ref_check check (length(leader_ref) <= 60);
alter table public.ed_agenda add column if not exists start_time time;
alter table public.ed_schedule add column if not exists owner_ref text not null default '';
alter table public.ed_schedule drop constraint if exists ed_schedule_owner_ref_check;
alter table public.ed_schedule add constraint ed_schedule_owner_ref_check check (length(owner_ref) <= 60);

-- version 8: notes for next year on each event
alter table public.ed_events add column if not exists debrief text not null default '';
alter table public.ed_events drop constraint if exists ed_events_debrief_check;
alter table public.ed_events add constraint ed_events_debrief_check check (length(debrief) <= 5000);

-- version 7: tasks get a segment (planning, prep, setup, during, teardown, after) and an area (Food, Stage, AV...)
alter table public.ed_tasks add column if not exists area text not null default '';
alter table public.ed_tasks drop constraint if exists ed_tasks_phase_check;
alter table public.ed_tasks add constraint ed_tasks_phase_check check (phase in ('planning', 'prep', 'setup', 'during', 'teardown', 'followup'));
alter table public.ed_tasks drop constraint if exists ed_tasks_area_check;
alter table public.ed_tasks add constraint ed_tasks_area_check check (length(area) <= 40);

-- version 6: ministry logo (a small image, stored as a data URL)
alter table public.ed_orgs add column if not exists logo text not null default '';
alter table public.ed_orgs drop constraint if exists ed_orgs_logo_check;
alter table public.ed_orgs add constraint ed_orgs_logo_check check (length(logo) <= 400000 and (logo = '' or logo like 'data:image/%'));
-- version 5: volunteer goal per event
alter table public.ed_events add column if not exists volunteer_goal int not null default 0;
alter table public.ed_events drop constraint if exists ed_events_volunteer_goal_check;
alter table public.ed_events add constraint ed_events_volunteer_goal_check check (volunteer_goal between 0 and 10000);
-- version 4: guest RSVPs ("attend" items) and party size
alter table public.ed_items drop constraint if exists ed_items_kind_check;
alter table public.ed_items add constraint ed_items_kind_check check (kind in ('serve', 'meal', 'attend'));
alter table public.ed_items drop constraint if exists ed_items_needed_check;
alter table public.ed_items add constraint ed_items_needed_check check (needed between 1 and 5000);
alter table public.ed_signups add column if not exists party int not null default 1;
alter table public.ed_signups drop constraint if exists ed_signups_party_check;
alter table public.ed_signups add constraint ed_signups_party_check check (party between 1 and 50);

-- ---------- money
create table if not exists public.ed_offerings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  service text not null default '',
  on_date date,
  cash numeric(12, 2) not null default 0 check (cash >= 0),
  checks numeric(12, 2) not null default 0 check (checks >= 0),
  online numeric(12, 2) not null default 0 check (online >= 0),
  other numeric(12, 2) not null default 0 check (other >= 0),
  counter1 text not null default '',
  counter2 text not null default '',
  deposited boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_offerings_event_idx on public.ed_offerings (event_id);

create table if not exists public.ed_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  description text not null check (length(description) between 1 and 160),
  category text not null default '',
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  pay_status text not null default 'Not Paid' check (pay_status in ('Not Paid', 'Deposit Paid', 'Paid In Full')),
  payer text not null default '',
  due_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_expenses_event_idx on public.ed_expenses (event_id);

-- ---------- follow-up
create table if not exists public.ed_cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  phone text not null default '',
  email text not null default '',
  responses text[] not null default '{}',
  prayer text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'connected')),
  follow_up_by text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_cards_event_idx on public.ed_cards (event_id);

-- Upgrades from versions 12 to 16 (they come after every table above exists).
-- version 16: registration fee on a service, consent to contact and paid on an RSVP, "no bulk email" on a contact, ministry tax number
alter table public.ed_items add column if not exists fee numeric(8,2) not null default 0;
alter table public.ed_items drop constraint if exists ed_items_fee_check;
alter table public.ed_items add constraint ed_items_fee_check check (fee >= 0 and fee <= 10000);
alter table public.ed_signups add column if not exists consent boolean not null default false;
alter table public.ed_signups add column if not exists paid boolean not null default false;
alter table public.ed_people add column if not exists no_email boolean not null default false;
alter table public.ed_orgs add column if not exists tax_id text not null default '' check (length(tax_id) <= 40);

-- version 15: sign in with a text code (Supabase phone auth); a member's login phone is saved on joining

-- version 14: background checks (a cleared date and optional expiry on each person; a flag on shifts that need one)
alter table public.ed_people add column if not exists bg_cleared_on date;
alter table public.ed_people add column if not exists bg_expires_on date;
alter table public.ed_items add column if not exists needs_check boolean not null default false;

-- version 13: automatic texts and emails (supabase/functions/ed-notify). The function writes the log
-- with the service key; members can read their ministry's log so the app shows what already went out.
alter table public.ed_orgs add column if not exists auto_remind boolean not null default false;
alter table public.ed_orgs add column if not exists notify_seen_at timestamptz;
alter table public.ed_orgs add column if not exists notify_channels text not null default '';
create table if not exists public.ed_notify_log (
  id bigserial primary key,
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  key text not null check (length(key) <= 400),
  kind text not null default '',
  channel text not null default '',
  to_name text not null default '',
  to_addr text not null default '',
  subject text not null default '',
  status text not null default 'sending',
  error text not null default '',
  created_at timestamptz not null default now(),
  unique (org_id, key)
);
create index if not exists ed_notify_log_org_time on public.ed_notify_log (org_id, created_at desc);
alter table public.ed_notify_log enable row level security;
-- (its read policy is set further down, after the helper functions it uses)
revoke all on public.ed_notify_log from anon, authenticated;
grant select on public.ed_notify_log to authenticated;

-- version 12: volunteer shifts have start and end times; connection cards name who follows up and by when
alter table public.ed_items add column if not exists start_time time;
alter table public.ed_items add column if not exists end_time time;
alter table public.ed_cards add column if not exists follow_up_ref text not null default '';
alter table public.ed_cards drop constraint if exists ed_cards_follow_up_ref_check;
alter table public.ed_cards add constraint ed_cards_follow_up_ref_check check (length(follow_up_ref) <= 60);
alter table public.ed_cards add column if not exists follow_up_on date;

-- ============================================================ helpers
create or replace function public.ed_is_member(oid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ed_members m where m.org_id = oid and m.user_id = auth.uid());
$$;

create or replace function public.ed_is_owner(oid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ed_members m where m.org_id = oid and m.user_id = auth.uid() and m.role = 'owner');
$$;

create or replace function public.ed_can_event(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ed_events e join public.ed_members m on m.org_id = e.org_id
                 where e.id = eid and m.user_id = auth.uid());
$$;

-- True when a Directory row belongs to the same ministry as the event.
create or replace function public.ed_same_org(eid uuid, tbl text, rid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare ok boolean;
begin
  if tbl not in ('ed_people', 'ed_vendors', 'ed_contacts', 'ed_equipment') then return false; end if;
  execute format('select exists (select 1 from public.%I d join public.ed_events e on e.org_id = d.org_id where d.id = $1 and e.id = $2)', tbl)
    into ok using rid, eid;
  return ok;
end $$;

create or replace function public.ed_clip(t text, n int) returns text
language sql immutable set search_path = public as $$
  select left(trim(coalesce(t, '')), n);
$$;

-- Stamp updated_at, and refuse to move a row to another ministry or event.
create or replace function public.ed_touch() returns trigger
language plpgsql set search_path = public as $$
declare o jsonb := to_jsonb(old); n jsonb := to_jsonb(new);
begin
  if (o ? 'org_id' and o ->> 'org_id' is distinct from n ->> 'org_id')
     or (o ? 'event_id' and tg_table_name <> 'ed_budget' and o ->> 'event_id' is distinct from n ->> 'event_id') then
    raise exception 'A record can''t be moved to another ministry or event.';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['ed_people', 'ed_vendors', 'ed_contacts', 'ed_equipment', 'ed_events', 'ed_budget',
    'ed_event_people', 'ed_event_vendors', 'ed_event_contacts', 'ed_event_equipment', 'ed_schedule', 'ed_tasks',
    'ed_agenda', 'ed_setlists', 'ed_items', 'ed_signups', 'ed_offerings', 'ed_expenses', 'ed_cards'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.ed_touch()', t || '_touch', t);
  end loop;
end $$;

-- ============================================================ account functions
-- The phone number a text-code login signed in with ('' for email logins), as +15555550123.
create or replace function public.ed_login_phone() returns text
language sql stable set search_path = public as $$
  select case when coalesce(auth.jwt() ->> 'phone', '') = '' then '' else '+' || regexp_replace(auth.jwt() ->> 'phone', '[^0-9]', '', 'g') end
$$;

create or replace function public.ed_create_org(p_name text, p_display text) returns uuid
language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select org_id into oid from public.ed_members where user_id = auth.uid();
  if oid is not null then return oid; end if;
  insert into public.ed_orgs (name, created_by) values (coalesce(nullif(ed_clip(p_name, 120), ''), 'Our Ministry'), auth.uid()) returning id into oid;
  insert into public.ed_members (org_id, user_id, email, name, role, phone)
    values (oid, auth.uid(), nullif(auth.jwt() ->> 'email', ''), nullif(ed_clip(p_display, 80), ''), 'owner', public.ed_login_phone());
  return oid;
end $$;

create or replace function public.ed_create_invite(oid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.ed_is_owner(oid) then raise exception 'Only the account owner can invite people'; end if;
  if (select count(*) from public.ed_members where org_id = oid) >= 10 then raise exception 'This account already has 10 people'; end if;
  c := replace(gen_random_uuid()::text, '-', '');
  insert into public.ed_invites (code, org_id, created_by) values (c, oid, auth.uid());
  return c;
end $$;

create or replace function public.ed_accept_invite(p_code text, p_display text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.ed_invites; existing uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into inv from public.ed_invites where code = trim(p_code) and expires_at > now();
  if inv.code is null then raise exception 'That invite has expired or was already used. Ask for a new one.'; end if;
  select org_id into existing from public.ed_members where user_id = auth.uid();
  if existing is not null and existing <> inv.org_id then
    raise exception 'This login already belongs to another ministry. Sign up with a different email to join this one.';
  end if;
  if (select count(*) from public.ed_members where org_id = inv.org_id) >= 10 then raise exception 'This account already has 10 people'; end if;
  insert into public.ed_members (org_id, user_id, email, name, role, phone)
    values (inv.org_id, auth.uid(), nullif(auth.jwt() ->> 'email', ''), nullif(ed_clip(p_display, 80), ''), 'member', public.ed_login_phone())
    on conflict (org_id, user_id) do nothing;
  delete from public.ed_invites where code = inv.code;
  return inv.org_id;
end $$;

create or replace function public.ed_remove_member(oid uuid, uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if uid = auth.uid() then
    if public.ed_is_owner(oid) and (select count(*) from public.ed_members where org_id = oid) > 1 then
      raise exception 'Remove the others first, or they lose the account.';
    end if;
  elsif not public.ed_is_owner(oid) then
    raise exception 'Only the account owner can remove people';
  end if;
  delete from public.ed_members where org_id = oid and user_id = uid;
  if not exists (select 1 from public.ed_members where org_id = oid) then
    delete from public.ed_orgs where id = oid;
  end if;
end $$;

-- ============================================================ event functions
-- Get an annual event ready for next year: move the dates and reset what's done.
-- p_opts keys (all true/false): clear_signups, clear_volunteers, clear_speakers,
-- clear_money, clear_cards, clear_setlists. Tasks, equipment checks and payments always reset.
create or replace function public.ed_renew_event(p_event uuid, p_start date, p_end date, p_opts jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare ev public.ed_events; delta int;
begin
  select * into ev from public.ed_events where id = p_event;
  if ev.id is null or not public.ed_can_event(p_event) then raise exception 'Event not found'; end if;
  if p_start is null then raise exception 'Pick the new first day.'; end if;
  delta := p_start - coalesce(ev.starts_on, p_start);
  update public.ed_events set starts_on = p_start, ends_on = coalesce(p_end, p_start + coalesce(ev.ends_on - ev.starts_on, 0)), is_open = true where id = p_event;
  update public.ed_schedule set on_date = on_date + delta where event_id = p_event;
  update public.ed_items set on_date = on_date + delta where event_id = p_event and on_date is not null;
  update public.ed_tasks set done = false, due_on = due_on + delta where event_id = p_event;
  update public.ed_agenda set done = false where event_id = p_event;
  update public.ed_event_equipment set loaded = false, returned = false where event_id = p_event;
  update public.ed_event_vendors set paid = 0, pay_status = 'Not Paid', status = case when status = 'Cancelled' then status else 'Quoted' end,
    due_on = due_on + delta where event_id = p_event;
  update public.ed_event_people set pay_status = 'Not Paid', due_on = due_on + delta where event_id = p_event;
  if coalesce((p_opts ->> 'clear_signups')::boolean, true) then delete from public.ed_signups where event_id = p_event; end if;
  if coalesce((p_opts ->> 'clear_volunteers')::boolean, true) then delete from public.ed_event_people where event_id = p_event and team = 'volunteer'; end if;
  if coalesce((p_opts ->> 'clear_speakers')::boolean, false) then delete from public.ed_event_people where event_id = p_event and team = 'speaker'; end if;
  if coalesce((p_opts ->> 'clear_money')::boolean, true) then
    delete from public.ed_offerings where event_id = p_event;
    delete from public.ed_expenses where event_id = p_event;
  end if;
  if coalesce((p_opts ->> 'clear_cards')::boolean, false) then delete from public.ed_cards where event_id = p_event; end if;
  if coalesce((p_opts ->> 'clear_setlists')::boolean, true) then delete from public.ed_setlists where event_id = p_event;
  else update public.ed_setlists set on_date = on_date + delta where event_id = p_event; end if;
end $$;

-- Copy an event as a starting point for a new one (a template). Copies the plan
-- and the assignments, not sign-ups, money or connection cards.
create or replace function public.ed_copy_event(p_event uuid, p_title text, p_start date) returns uuid
language plpgsql security definer set search_path = public as $$
declare ev public.ed_events; nid uuid; delta int; s text;
begin
  select * into ev from public.ed_events where id = p_event;
  if ev.id is null or not public.ed_can_event(p_event) then raise exception 'Event not found'; end if;
  delta := coalesce(p_start - ev.starts_on, 0);
  s := left(regexp_replace(lower(coalesce(nullif(trim(p_title), ''), ev.title)), '[^a-z0-9]+', '-', 'g'), 40);
  s := trim(both '-' from s) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 4);
  if length(s) < 6 then s := 'event-' || s; end if;
  insert into public.ed_events (org_id, slug, title, starts_on, ends_on, time_label, place, address, about, contact_line, giving_link, budget, sections, is_open, volunteer_goal, theme, purpose)
    values (ev.org_id, s, coalesce(nullif(ed_clip(p_title, 120), ''), ev.title), coalesce(p_start, ev.starts_on), ev.ends_on + delta,
            ev.time_label, ev.place, ev.address, ev.about, ev.contact_line, ev.giving_link, ev.budget, ev.sections, true, ev.volunteer_goal, ev.theme, ev.purpose)
    returning id into nid;
  insert into public.ed_schedule (event_id, on_date, start_time, end_time, title, location, owner, owner_ref, notes)
    select nid, on_date + delta, start_time, end_time, title, location, owner, owner_ref, notes from public.ed_schedule where event_id = p_event;
  insert into public.ed_items (event_id, kind, title, on_date, time_label, start_time, end_time, needed, needs_check, notes, sort)
    select nid, kind, title, on_date + delta, time_label, start_time, end_time, needed, needs_check, notes, sort from public.ed_items where event_id = p_event;
  insert into public.ed_tasks (event_id, phase, area, title, due_on, due_time, owner, task_owner, assignee_refs, needed, notes, sort)
    select nid, phase, area, title, due_on + delta, due_time, owner, task_owner, assignee_refs, needed, notes, sort from public.ed_tasks where event_id = p_event;
  insert into public.ed_agenda (event_id, title, leader, leader_ref, start_time, minutes, notes, sort)
    select nid, title, leader, leader_ref, start_time, minutes, '', sort from public.ed_agenda where event_id = p_event;
  -- scripture and declarations carry over; prayer needs are for this event only
  insert into public.ed_prayer (event_id, kind, title, body, sort)
    select nid, kind, title, body, sort from public.ed_prayer where event_id = p_event and kind <> 'intercede';
  insert into public.ed_event_people (event_id, person_id, team, role, days, details, amount, payer, notes)
    select nid, person_id, team, role, days, details, amount, payer, notes from public.ed_event_people where event_id = p_event and team <> 'volunteer';
  insert into public.ed_event_vendors (event_id, vendor_id, service, arrival, cost, payer, notes)
    select nid, vendor_id, service, arrival, cost, payer, notes from public.ed_event_vendors where event_id = p_event and status <> 'Cancelled';
  insert into public.ed_event_contacts (event_id, contact_id, role, notes)
    select nid, contact_id, role, notes from public.ed_event_contacts where event_id = p_event;
  insert into public.ed_event_equipment (event_id, equipment_id, quantity, notes)
    select nid, equipment_id, quantity, notes from public.ed_event_equipment where event_id = p_event;
  return nid;
end $$;

-- ============================================================ public (no account)
create or replace function public.ed_public(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare ev public.ed_events; res jsonb;
begin
  select * into ev from public.ed_events where slug = lower(trim(p_slug));
  if ev.id is null then return null; end if;
  select jsonb_build_object(
    'event', jsonb_build_object('slug', ev.slug, 'title', ev.title, 'starts_on', ev.starts_on, 'ends_on', ev.ends_on,
      'time_label', ev.time_label, 'place', ev.place, 'address', ev.address, 'about', ev.about, 'contact_line', ev.contact_line,
      'giving_link', ev.giving_link, 'is_open', ev.is_open, 'volunteer_goal', ev.volunteer_goal,
      'volunteer_count', (select count(*) from public.ed_signups s join public.ed_items i on i.id = s.item_id where i.event_id = ev.id and i.kind = 'serve')
        + (select count(*) from public.ed_event_people p where p.event_id = ev.id and p.team = 'volunteer'), 'sections', to_jsonb(ev.sections),
      'ministry', (select name from public.ed_orgs where id = ev.org_id),
      'logo', (select logo from public.ed_orgs where id = ev.org_id)),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'kind', i.kind, 'title', i.title, 'on_date', i.on_date,
        'time_label', i.time_label, 'needed', i.needed, 'notes', i.notes, 'needs_check', i.needs_check, 'fee', i.fee,
        'taken', coalesce((select case when i.kind = 'attend' then sum(s.party) else count(*) end
                           from public.ed_signups s where s.item_id = i.id), 0),
        'names', case when i.kind = 'attend' then '[]'::jsonb else coalesce((select jsonb_agg(split_part(s.name, ' ', 1) order by s.created_at)
                           from public.ed_signups s where s.item_id = i.id), '[]'::jsonb) end)
        order by i.on_date nulls first, i.sort, i.created_at)
      from public.ed_items i where i.event_id = ev.id), '[]'::jsonb)
  ) into res;
  return res;
end $$;

drop function if exists public.ed_sign(text, uuid, text, text, text, text);
drop function if exists public.ed_sign(text, uuid, text, text, text, text, int);
create or replace function public.ed_sign(p_slug text, p_item uuid, p_name text, p_phone text, p_email text, p_note text, p_party int default 1, p_consent boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare ev public.ed_events; it public.ed_items; taken int; tok text; pty int;
  nm text := ed_clip(p_name, 80); ph text := ed_clip(p_phone, 40); em text := lower(ed_clip(p_email, 120));
begin
  select * into ev from public.ed_events where slug = lower(trim(p_slug));
  if ev.id is null then raise exception 'This event was not found.'; end if;
  if not ev.is_open then raise exception 'Sign-ups for this event are closed.'; end if;
  select * into it from public.ed_items where id = p_item and event_id = ev.id for update;
  if it.id is null then raise exception 'That spot was removed. Refresh the page.'; end if;
  if nm = '' then raise exception 'Please add your name.'; end if;
  if ph = '' and em = '' then raise exception 'Please add a phone number or email so the team can reach you.'; end if;
  if exists (select 1 from public.ed_signups where item_id = it.id and lower(name) = lower(nm)
             and ((ph <> '' and phone = ph) or (em <> '' and email = em))) then
    raise exception 'You are already signed up for this one.';
  end if;
  pty := case when it.kind = 'attend' then least(greatest(coalesce(p_party, 1), 1), 50) else 1 end;
  select coalesce(sum(party), 0) into taken from public.ed_signups where item_id = it.id;
  if it.kind <> 'attend' then select count(*) into taken from public.ed_signups where item_id = it.id; end if;
  if taken + pty > it.needed then
    if it.kind = 'attend' and taken < it.needed then raise exception 'Only % seats are left for this one.', it.needed - taken; end if;
    raise exception 'That one just filled up. Please pick another.';
  end if;
  insert into public.ed_signups (event_id, item_id, name, phone, email, note, party, consent)
    values (ev.id, it.id, nm, ph, em, ed_clip(p_note, 300), pty, coalesce(p_consent, false)) returning token into tok;
  return tok;
end $$;

create or replace function public.ed_unsign(p_token text) returns void
language sql security definer set search_path = public as $$
  delete from public.ed_signups where token = p_token and length(p_token) >= 20;
$$;

create or replace function public.ed_mine(p_tokens text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('token', s.token, 'item_id', s.item_id, 'name', s.name)), '[]'::jsonb)
  from public.ed_signups s where s.token = any (coalesce(p_tokens[1:50], '{}'));
$$;

-- Self check-in from the event's check-in QR code: the phone number someone signed up or RSVP'd with
-- checks them in for today's shifts and services. "Today" is in the ministry's time zone.
create or replace function public.ed_checkin(p_slug text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ev public.ed_events; want text; today date; res jsonb;
begin
  select * into ev from public.ed_events where slug = lower(trim(p_slug));
  if ev.id is null then raise exception 'This event was not found.'; end if;
  want := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(want) = 11 and left(want, 1) = '1' then want := substr(want, 2); end if;
  if length(want) < 7 then raise exception 'Enter the phone number you signed up with.'; end if;
  today := (now() at time zone coalesce((select nullif(timezone, '') from public.ed_orgs where id = ev.org_id), 'America/Chicago'))::date;
  with hits as (
    select s.id, s.name, i.title from public.ed_signups s join public.ed_items i on i.id = s.item_id
    where i.event_id = ev.id
      and (i.on_date = today or (i.on_date is null and ev.starts_on <= today and coalesce(ev.ends_on, ev.starts_on) >= today))
      and right(regexp_replace(s.phone, '[^0-9]', '', 'g'), 10) = right(want, 10)
    limit 20
  ), upd as (
    update public.ed_signups s set checked_in_at = coalesce(s.checked_in_at, now()) from hits where s.id = hits.id returning s.id
  )
  select coalesce(jsonb_agg(jsonb_build_object('name', hits.name, 'title', hits.title)), '[]'::jsonb) into res from hits where hits.id in (select id from upd);
  if res = '[]'::jsonb then raise exception 'We couldn''t find a sign-up for today with that number. Please see someone at the welcome table.'; end if;
  return res;
end $$;

create or replace function public.ed_connect(p_slug text, p_name text, p_phone text, p_email text, p_responses text[], p_prayer text)
returns void language plpgsql security definer set search_path = public as $$
declare ev public.ed_events; nm text := ed_clip(p_name, 80);
begin
  select * into ev from public.ed_events where slug = lower(trim(p_slug));
  if ev.id is null then raise exception 'This event was not found.'; end if;
  if nm = '' then raise exception 'Please add your name.'; end if;
  if (select count(*) from public.ed_cards where event_id = ev.id and created_at > now() - interval '1 minute') > 60 then
    raise exception 'Lots of cards are coming in. Please try again in a minute.';
  end if;
  insert into public.ed_cards (event_id, name, phone, email, responses, prayer)
    values (ev.id, nm, ed_clip(p_phone, 40), lower(ed_clip(p_email, 120)),
            coalesce((select array_agg(ed_clip(r, 60)) from unnest(p_responses[1:10]) r where trim(r) <> ''), '{}'),
            ed_clip(p_prayer, 2000));
end $$;

-- ============================================================ row level security
do $$ declare t text; begin
  foreach t in array array['ed_orgs', 'ed_members', 'ed_invites', 'ed_people', 'ed_vendors', 'ed_contacts', 'ed_equipment',
    'ed_events', 'ed_budget', 'ed_event_people', 'ed_event_vendors', 'ed_event_contacts', 'ed_event_equipment', 'ed_schedule',
    'ed_tasks', 'ed_agenda', 'ed_setlists', 'ed_items', 'ed_signups', 'ed_offerings', 'ed_expenses', 'ed_cards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

drop policy if exists ed_orgs_read on public.ed_orgs;
create policy ed_orgs_read on public.ed_orgs for select to authenticated using (public.ed_is_member(id));
drop policy if exists ed_notify_log_read on public.ed_notify_log;
create policy ed_notify_log_read on public.ed_notify_log for select to authenticated using (public.ed_is_member(org_id));
drop policy if exists ed_orgs_rename on public.ed_orgs;
create policy ed_orgs_rename on public.ed_orgs for update to authenticated using (public.ed_is_owner(id)) with check (public.ed_is_owner(id));
drop policy if exists ed_members_read on public.ed_members;
create policy ed_members_read on public.ed_members for select to authenticated using (public.ed_is_member(org_id));
drop policy if exists ed_members_self on public.ed_members;
create policy ed_members_self on public.ed_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ed_invites_read on public.ed_invites;
create policy ed_invites_read on public.ed_invites for select to authenticated using (public.ed_is_owner(org_id));
drop policy if exists ed_invites_cancel on public.ed_invites;
create policy ed_invites_cancel on public.ed_invites for delete to authenticated using (public.ed_is_owner(org_id));

-- Directory and events: anyone in the ministry.
do $$ declare t text; begin
  foreach t in array array['ed_people', 'ed_vendors', 'ed_contacts', 'ed_equipment', 'ed_events'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.ed_is_member(org_id)) with check (public.ed_is_member(org_id))', t || '_all', t);
  end loop;
end $$;
drop policy if exists ed_budget_all on public.ed_budget;
create policy ed_budget_all on public.ed_budget for all to authenticated using (public.ed_is_member(org_id))
  with check (public.ed_is_member(org_id) and (event_id is null or exists (select 1 from public.ed_events e where e.id = event_id and e.org_id = ed_budget.org_id)));

-- An event's own rows: anyone in the event's ministry.
do $$ declare t text; begin
  foreach t in array array['ed_schedule', 'ed_tasks', 'ed_agenda', 'ed_setlists', 'ed_items', 'ed_signups', 'ed_offerings', 'ed_expenses', 'ed_cards'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.ed_can_event(event_id)) with check (public.ed_can_event(event_id))', t || '_all', t);
  end loop;
end $$;

-- Assignments: also check the Directory row is from the same ministry.
drop policy if exists ed_event_people_all on public.ed_event_people;
create policy ed_event_people_all on public.ed_event_people for all to authenticated using (public.ed_can_event(event_id))
  with check (public.ed_can_event(event_id) and public.ed_same_org(event_id, 'ed_people', person_id));
drop policy if exists ed_event_vendors_all on public.ed_event_vendors;
create policy ed_event_vendors_all on public.ed_event_vendors for all to authenticated using (public.ed_can_event(event_id))
  with check (public.ed_can_event(event_id) and public.ed_same_org(event_id, 'ed_vendors', vendor_id));
drop policy if exists ed_event_contacts_all on public.ed_event_contacts;
create policy ed_event_contacts_all on public.ed_event_contacts for all to authenticated using (public.ed_can_event(event_id))
  with check (public.ed_can_event(event_id) and public.ed_same_org(event_id, 'ed_contacts', contact_id));
drop policy if exists ed_event_equipment_all on public.ed_event_equipment;
create policy ed_event_equipment_all on public.ed_event_equipment for all to authenticated using (public.ed_can_event(event_id))
  with check (public.ed_can_event(event_id) and public.ed_same_org(event_id, 'ed_equipment', equipment_id));

-- ---------- grants
revoke all on public.ed_orgs, public.ed_members, public.ed_invites from authenticated;
grant select on public.ed_orgs, public.ed_members to authenticated;
grant update (name, website, email, phone, address, about, giving_link, timezone, logo, auto_remind, tax_id) on public.ed_orgs to authenticated;
grant update (name, phone, prefs) on public.ed_members to authenticated;
grant select, delete on public.ed_invites to authenticated;
grant select, insert, update, delete on public.ed_people, public.ed_vendors, public.ed_contacts, public.ed_equipment,
  public.ed_events, public.ed_budget, public.ed_event_people, public.ed_event_vendors, public.ed_event_contacts,
  public.ed_event_equipment, public.ed_schedule, public.ed_tasks, public.ed_agenda, public.ed_setlists, public.ed_items,
  public.ed_signups, public.ed_offerings, public.ed_expenses, public.ed_cards to authenticated;

revoke all on function public.ed_is_member(uuid), public.ed_is_owner(uuid), public.ed_can_event(uuid), public.ed_same_org(uuid, text, uuid),
  public.ed_create_org(text, text), public.ed_create_invite(uuid), public.ed_accept_invite(text, text), public.ed_remove_member(uuid, uuid),
  public.ed_renew_event(uuid, date, date, jsonb), public.ed_copy_event(uuid, text, date),
  public.ed_public(text), public.ed_sign(text, uuid, text, text, text, text, int, boolean), public.ed_unsign(text), public.ed_mine(text[]),
  public.ed_connect(text, text, text, text, text[], text), public.ed_checkin(text, text) from public;
grant execute on function public.ed_is_member(uuid), public.ed_is_owner(uuid), public.ed_can_event(uuid), public.ed_same_org(uuid, text, uuid),
  public.ed_create_org(text, text), public.ed_create_invite(uuid), public.ed_accept_invite(text, text), public.ed_remove_member(uuid, uuid),
  public.ed_renew_event(uuid, date, date, jsonb), public.ed_copy_event(uuid, text, date) to authenticated;
grant execute on function public.ed_public(text), public.ed_sign(text, uuid, text, text, text, text, int, boolean), public.ed_unsign(text),
  public.ed_mine(text[]), public.ed_connect(text, text, text, text, text[], text), public.ed_checkin(text, text) to anon, authenticated;

-- ============================================================ version 9: prayer
-- Scripture, declarations and the needs the prayer team intercedes for. Nothing is checked off:
-- a row stays until someone deletes it. A need can name a contact, a follow-up date, and what God did.
create table if not exists public.ed_prayer (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ed_events (id) on delete cascade,
  kind text not null default 'intercede' check (kind in ('intercede', 'declare', 'verse')),
  title text not null check (length(title) between 1 and 600),
  body text not null default '' check (length(body) <= 4000),
  person_id uuid references public.ed_people (id) on delete set null,
  follow_up_on date,
  answer text not null default '' check (length(answer) <= 4000),
  private boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_prayer_event_idx on public.ed_prayer (event_id);
create index if not exists ed_prayer_person_idx on public.ed_prayer (person_id);
drop trigger if exists ed_prayer_touch on public.ed_prayer;
create trigger ed_prayer_touch before update on public.ed_prayer for each row execute function public.ed_touch();
alter table public.ed_prayer enable row level security;
revoke all on public.ed_prayer from anon;
drop policy if exists ed_prayer_all on public.ed_prayer;
create policy ed_prayer_all on public.ed_prayer for all to authenticated using (public.ed_can_event(event_id))
  with check (public.ed_can_event(event_id) and (person_id is null or public.ed_same_org(event_id, 'ed_people', person_id)));
grant select, insert, update, delete on public.ed_prayer to authenticated;

-- ============================================================ version 16: bulk email
-- A mailing is one designed email (invite, reminder, thank-you) for an event. Its recipients are
-- listed one per row, so each person gets their own RSVP link and unsubscribe link, and nobody is emailed twice.
create table if not exists public.ed_mailings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  event_id uuid references public.ed_events (id) on delete cascade,
  template text not null default 'invite' check (length(template) <= 40),
  subject text not null default '' check (length(subject) <= 200),
  fields jsonb not null default '{}'::jsonb check (jsonb_typeof(fields) = 'object' and pg_column_size(fields) < 20000),
  html text not null default '' check (length(html) <= 200000),
  audience text not null default '' check (length(audience) <= 200),
  base_url text not null default '' check (length(base_url) <= 300),
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  sent_at timestamptz,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ed_mailings_org_idx on public.ed_mailings (org_id);
create table if not exists public.ed_mail_rcpt (
  id uuid primary key default gen_random_uuid(),
  mailing_id uuid not null references public.ed_mailings (id) on delete cascade,
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  email text not null check (length(email) between 3 and 200),
  name text not null default '' check (length(name) <= 120),
  phone text not null default '' check (length(phone) <= 40),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  error text not null default '',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (mailing_id, email)
);
create index if not exists ed_mail_rcpt_mailing_idx on public.ed_mail_rcpt (mailing_id);
create table if not exists public.ed_unsub (
  org_id uuid not null references public.ed_orgs (id) on delete cascade,
  email text not null check (length(email) between 3 and 200),
  created_at timestamptz not null default now(),
  primary key (org_id, email)
);
drop trigger if exists ed_mailings_touch on public.ed_mailings;
create trigger ed_mailings_touch before update on public.ed_mailings for each row execute function public.ed_touch();
alter table public.ed_mailings enable row level security;
alter table public.ed_mail_rcpt enable row level security;
alter table public.ed_unsub enable row level security;
revoke all on public.ed_mailings, public.ed_mail_rcpt, public.ed_unsub from anon;
drop policy if exists ed_mailings_all on public.ed_mailings;
create policy ed_mailings_all on public.ed_mailings for all to authenticated using (public.ed_is_member(org_id))
  with check (public.ed_is_member(org_id) and (event_id is null or public.ed_can_event(event_id)));
drop policy if exists ed_mail_rcpt_all on public.ed_mail_rcpt;
create policy ed_mail_rcpt_all on public.ed_mail_rcpt for all to authenticated using (public.ed_is_member(org_id))
  with check (public.ed_is_member(org_id) and exists (select 1 from public.ed_mailings m where m.id = mailing_id and m.org_id = ed_mail_rcpt.org_id));
drop policy if exists ed_unsub_read on public.ed_unsub;
create policy ed_unsub_read on public.ed_unsub for select to authenticated using (public.ed_is_member(org_id));
grant select, insert, update, delete on public.ed_mailings, public.ed_mail_rcpt to authenticated;
grant select on public.ed_unsub to authenticated;

-- The link in an email knows who it was sent to, so the RSVP form can be filled in for them.
create or replace function public.ed_guest(p_rcpt uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', r.name, 'email', r.email, 'phone', r.phone) from public.ed_mail_rcpt r where r.id = p_rcpt;
$$;
-- "Unsubscribe" in an email: no more bulk email from that ministry to that address.
create or replace function public.ed_unsubscribe(p_rcpt uuid) returns text
language plpgsql security definer set search_path = public as $$
declare r public.ed_mail_rcpt; nm text;
begin
  select * into r from public.ed_mail_rcpt where id = p_rcpt;
  if r.id is null then return ''; end if;
  insert into public.ed_unsub (org_id, email) values (r.org_id, lower(r.email)) on conflict do nothing;
  update public.ed_people set no_email = true where org_id = r.org_id and lower(email) = lower(r.email);
  select name into nm from public.ed_orgs where id = r.org_id;
  return coalesce(nm, '');
end $$;
revoke all on function public.ed_guest(uuid), public.ed_unsubscribe(uuid) from public;
grant execute on function public.ed_guest(uuid), public.ed_unsubscribe(uuid) to anon, authenticated;

-- Photos and logos used in emails live in a public storage folder, one folder per ministry.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public) values ('ed-mail', 'ed-mail', true) on conflict (id) do nothing;
    drop policy if exists ed_mail_upload on storage.objects;
    create policy ed_mail_upload on storage.objects for insert to authenticated
      with check (bucket_id = 'ed-mail' and exists (select 1 from public.ed_members m where m.user_id = auth.uid() and m.org_id::text = (storage.foldername(name))[1]));
    drop policy if exists ed_mail_replace on storage.objects;
    create policy ed_mail_replace on storage.objects for update to authenticated
      using (bucket_id = 'ed-mail' and exists (select 1 from public.ed_members m where m.user_id = auth.uid() and m.org_id::text = (storage.foldername(name))[1]));
  end if;
end $$;
