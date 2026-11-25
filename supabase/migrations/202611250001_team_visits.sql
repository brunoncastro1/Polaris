begin;

create table public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0)
);

create table public.team_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  name text not null,
  address text,
  checklist text[] not null default array[
    'Clean reception and common areas', 'Clean and sanitize restrooms',
    'Empty trash and replace liners', 'Vacuum and mop floors', 'Restock supplies'
  ] check (cardinality(checklist) > 0)
);

create table public.team_assignments (
  user_id uuid references public.team_members(user_id) on delete cascade,
  site_id uuid references public.team_sites(id) on delete cascade,
  primary key (user_id, site_id)
);

create table public.team_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.team_members(user_id),
  site_id uuid not null references public.team_sites(id),
  checklist text[] not null,
  clock_in timestamptz not null default now(),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  published_visit_id uuid unique references public.visits(id)
);

create unique index team_one_open_visit on public.team_visits(user_id)
  where published_visit_id is null;

alter table public.team_members enable row level security;
alter table public.team_sites enable row level security;
alter table public.team_assignments enable row level security;
alter table public.team_visits enable row level security;

revoke all on public.team_members, public.team_sites, public.team_assignments, public.team_visits
  from public, anon, authenticated;
grant select, insert on public.team_visits to service_role;
grant select on public.team_members, public.team_sites, public.team_assignments to service_role;
grant select on public.clients, public.client_users, public.visits, public.visit_photos to service_role;
grant update (email_sent_at) on public.visits to service_role;

create function public.publish_team_visit(p_user uuid, p_draft uuid, p_tasks text[], p_note text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  draft public.team_visits;
  site public.team_sites;
  visit_id uuid;
  photo_prefix text;
begin
  select * into strict draft from public.team_visits where id = p_draft and user_id = p_user for update;
  if draft.published_visit_id is not null then
    return draft.published_visit_id;
  end if;
  if not exists (select 1 from public.team_assignments where user_id = p_user and site_id = draft.site_id) then
    raise exception 'Site assignment missing';
  end if;
  if p_tasks is null or not (p_tasks <@ draft.checklist) or cardinality(p_tasks) = 0 or length(p_note) > 1000 then
    raise exception 'Invalid visit details';
  end if;

  select * into strict site from public.team_sites where id = draft.site_id;
  photo_prefix := 'team/' || draft.id || '/';
  if (select count(*) from storage.objects
      where bucket_id = 'visit-photos' and name in (photo_prefix || 'before.jpg', photo_prefix || 'after.jpg')) <> 2 then
    raise exception 'Both photos are required';
  end if;

  insert into public.visits (jobber_visit_id, client_id, title, site_name, site_address, status,
    starts_at, clock_in, clock_out, team, tasks, team_note)
  values ('team:' || draft.id, site.client_id, 'Cleaning visit', site.name, site.address, 'completed',
    draft.clock_in, draft.clock_in, clock_timestamp(),
    (select name from public.team_members where user_id = p_user),
    to_jsonb(array(select task from unnest(draft.checklist) as task where task = any(p_tasks))), nullif(trim(p_note), ''))
  returning id into visit_id;
  insert into public.visit_photos (visit_id, kind, room, storage_path)
  values (visit_id, 'before', 'Your facility', photo_prefix || 'before.jpg'),
         (visit_id, 'after', 'Your facility', photo_prefix || 'after.jpg');
  update public.team_visits set published_visit_id = visit_id where id = draft.id;
  return visit_id;
end;
$$;

revoke all on function public.publish_team_visit(uuid, uuid, text[], text) from public, anon, authenticated;
grant execute on function public.publish_team_visit(uuid, uuid, text[], text) to service_role;
commit;
