-- Polaris Client Portal: run once in Supabase → SQL Editor.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  jobber_client_id text unique not null,
  name text not null,
  email text,
  phone text,
  address text,
  plan text,
  access_notes text,
  preferences text,
  client_since date,
  created_at timestamptz default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  jobber_visit_id text unique not null,
  client_id uuid not null references clients(id) on delete cascade,
  title text,
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
alter table visits enable row level security;
alter table visit_photos enable row level security;
alter table invoices enable row level security;
alter table jobber_tokens enable row level security;  -- no policies = no client access

create policy "own client row" on clients for select using (auth_user_id = auth.uid());
create policy "own visits" on visits for select
  using (client_id in (select id from clients where auth_user_id = auth.uid()));
create policy "own photos" on visit_photos for select
  using (visit_id in (select v.id from visits v join clients c on c.id = v.client_id where c.auth_user_id = auth.uid()));
create policy "own invoices" on invoices for select
  using (client_id in (select id from clients where auth_user_id = auth.uid()));

-- Private bucket for photos; the portal serves them through short-lived signed URLs.
insert into storage.buckets (id, name, public) values ('visit-photos', 'visit-photos', false)
  on conflict (id) do nothing;
