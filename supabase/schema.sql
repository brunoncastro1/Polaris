-- Polaris Client Portal: run once in Supabase → SQL Editor.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  jobber_client_id text unique not null,
  name text not null,                               -- company name, e.g. "Lakeshore Property Management"
  contact_name text,                                -- main contact from Jobber
  email text,
  phone text,
  address text,
  plan text,
  access_notes text,
  preferences text,
  client_since date,
  created_at timestamptz default now()
);

-- People who can sign in for a client (manager, owner's rep, front desk...).
create table if not exists client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  email text not null,
  name text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  invited_at timestamptz,
  created_at timestamptz default now(),
  unique (client_id, email)
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  jobber_visit_id text unique not null,
  client_id uuid not null references clients(id) on delete cascade,
  title text,
  jobber_property_id text,
  site_name text,                                   -- building / property
  site_address text,
  status text not null default 'scheduled',        -- scheduled | completed
  starts_at timestamptz,
  clock_in timestamptz,
  clock_out timestamptz,
  team text,
  tasks jsonb not null default '[]'::jsonb,         -- ["Kitchen counters scrubbed", ...]
  team_note text,
  email_sent_at timestamptz,
  updated_at timestamptz default now()
);
create index if not exists visits_client_idx on visits(client_id, starts_at desc);

create table if not exists visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits(id) on delete cascade,
  kind text not null check (kind in ('before','after','other')),
  room text,
  storage_path text not null,
  jobber_file_id text unique,
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  jobber_invoice_id text unique not null,
  client_id uuid not null references clients(id) on delete cascade,
  number text,
  subject text,
  issued_at date,
  due_at date,
  total numeric(10,2) not null default 0,
  balance numeric(10,2) not null default 0,
  status text,                                       -- paid | awaiting_payment | past_due | draft
  payment_url text
);

-- Jobber OAuth tokens (single row, only the server can read it)
create table if not exists jobber_tokens (
  id int primary key default 1 check (id = 1),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null
);

-- Row Level Security: a signed-in client sees only their own rows.
alter table clients enable row level security;
alter table client_users enable row level security;
alter table visits enable row level security;
alter table visit_photos enable row level security;
alter table invoices enable row level security;
alter table jobber_tokens enable row level security;  -- no policies = no client access

-- Clients the signed-in person belongs to.
create or replace function my_client_ids() returns setof uuid
  language sql stable security definer set search_path = public
  as $$ select client_id from client_users where auth_user_id = auth.uid() $$;

create policy "own membership" on client_users for select using (auth_user_id = auth.uid());
create policy "own client row" on clients for select using (id in (select my_client_ids()));
create policy "own visits" on visits for select using (client_id in (select my_client_ids()));
create policy "own photos" on visit_photos for select
  using (visit_id in (select id from visits where client_id in (select my_client_ids())));
create policy "own invoices" on invoices for select using (client_id in (select my_client_ids()));

-- Newer Supabase projects don't expose new tables to signed-in users automatically.
-- Grant read access; Row Level Security above still limits each client to their own rows.
grant usage on schema public to authenticated;
grant select on clients, client_users, visits, visit_photos, invoices to authenticated;
grant execute on function my_client_ids() to authenticated;
revoke all on jobber_tokens from anon, authenticated;

-- Private bucket for photos; the portal serves them through short-lived signed URLs.
insert into storage.buckets (id, name, public) values ('visit-photos', 'visit-photos', false)
  on conflict (id) do nothing;
