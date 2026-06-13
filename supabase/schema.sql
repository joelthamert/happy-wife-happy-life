-- Happy Wife Happy Life — couples sync schema
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Then enable Email auth (on by default) and optionally Google under
-- Authentication → Providers.

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  data jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists couple_members (
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (couple_id, user_id)
);

alter table couples enable row level security;
alter table couple_members enable row level security;

-- members see and edit only their own couple
create policy "members read couple" on couples for select
  using (id in (select couple_id from couple_members where user_id = auth.uid()));
create policy "members update couple" on couples for update
  using (id in (select couple_id from couple_members where user_id = auth.uid()));
create policy "authenticated create couple" on couples for insert
  with check (auth.uid() is not null);

create policy "members read membership" on couple_members for select
  using (user_id = auth.uid());
create policy "join self only" on couple_members for insert
  with check (user_id = auth.uid());

-- joining by invite code needs to find a couple RLS would hide → security definer
create or replace function join_couple(invite_code text)
returns couples
language plpgsql security definer set search_path = public
as $$
declare target couples;
begin
  select * into target from couples where code = invite_code;
  if target.id is null then
    raise exception 'couple not found';
  end if;
  insert into couple_members (couple_id, user_id)
    values (target.id, auth.uid())
    on conflict do nothing;
  return target;
end;
$$;

-- realtime on couple rows so partner edits appear live
alter publication supabase_realtime add table couples;
