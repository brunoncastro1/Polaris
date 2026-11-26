begin;

create or replace function public.publish_team_visit(p_user uuid, p_draft uuid, p_tasks text[], p_note text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  draft public.team_visits;
  site public.team_sites;
  visit_id uuid;
  photo_prefix text;
  before_names text[];
  after_names text[];
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
  select array_agg(name order by name) filter (where name like photo_prefix || 'before%'),
         array_agg(name order by name) filter (where name like photo_prefix || 'after%')
    into before_names, after_names
  from storage.objects
  where bucket_id = 'visit-photos' and name like photo_prefix || '%'
    and substring(name from length(photo_prefix) + 1) ~ '^(before|after)(-[2-8])?\.jpg$';

  if not coalesce(photo_prefix || 'before.jpg' = any(before_names), false)
    or not coalesce(photo_prefix || 'after.jpg' = any(after_names), false) then
    raise exception 'Both photos are required for pair 1';
  end if;
  if array(select replace(name, '/before', '/after') from unnest(before_names) as name)
       is distinct from after_names then
    raise exception 'Both photos are required for every started pair';
  end if;

  insert into public.visits (jobber_visit_id, client_id, title, site_name, site_address, status,
    starts_at, clock_in, clock_out, team, tasks, team_note)
  values ('team:' || draft.id, site.client_id, 'Cleaning visit', site.name, site.address, 'completed',
    draft.clock_in, draft.clock_in, clock_timestamp(),
    (select name from public.team_members where user_id = p_user),
    to_jsonb(array(select task from unnest(draft.checklist) as task where task = any(p_tasks))), nullif(trim(p_note), ''))
  returning id into visit_id;
  insert into public.visit_photos (visit_id, kind, room, storage_path)
  select visit_id, kind,
    case when slot is null then 'Your facility' else 'Area ' || slot end, path
  from unnest(before_names || after_names) as path
  cross join lateral (
    select substring(path from length(photo_prefix) + 1) as filename
  ) as photo
  cross join lateral (
    select split_part(split_part(filename, '.', 1), '-', 1) as kind,
           substring(filename from '-([2-8])\.jpg$') as slot
  ) as detail;

  update public.team_visits set published_visit_id = visit_id where id = draft.id;
  return visit_id;
end;
$$;

revoke all on function public.publish_team_visit(uuid, uuid, text[], text) from public, anon, authenticated;
grant execute on function public.publish_team_visit(uuid, uuid, text[], text) to service_role;
commit;
