-- Cha public star ratings — run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Also turn on Authentication → Sign In / Providers → "Allow anonymous sign-ins".
-- Each browser gets an anonymous session on its first vote; one rating per session per tea.

create table if not exists public.ratings (
  tea_id     text not null check (tea_id ~ '^[a-z0-9]{1,40}$'),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tea_id, user_id)
);
create index if not exists ratings_user_idx on public.ratings (user_id, created_at desc);

alter table public.ratings enable row level security;

-- you can read, add, change and remove only your own ratings; everyone reads the totals through tea_ratings
drop policy if exists "read own" on public.ratings;
create policy "read own" on public.ratings for select to authenticated using (user_id = auth.uid());
drop policy if exists "add own" on public.ratings;
create policy "add own" on public.ratings for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "change own" on public.ratings;
create policy "change own" on public.ratings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "remove own" on public.ratings;
create policy "remove own" on public.ratings for delete to authenticated using (user_id = auth.uid());

-- Spam guard: at most 60 changes an hour per session, and a rating can't be moved to another tea or person.
create or replace function public.ratings_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.ratings where user_id = new.user_id and updated_at > now() - interval '1 hour') >= 60 then
    raise exception 'Too many ratings this hour' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' then
    new.tea_id := old.tea_id; new.user_id := old.user_id; new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists ratings_guard on public.ratings;
create trigger ratings_guard before insert or update on public.ratings
  for each row execute function public.ratings_guard();

-- Per-tea totals for the cards and the "Top rated" sort. Runs with the view owner's rights so
-- visitors see counts and averages but never who voted.
create or replace view public.tea_ratings with (security_invoker = false) as
  select tea_id,
         count(*)::int                          as n,
         round(avg(stars)::numeric, 2)          as avg_stars,
         count(*) filter (where stars = 1)::int as s1,
         count(*) filter (where stars = 2)::int as s2,
         count(*) filter (where stars = 3)::int as s3,
         count(*) filter (where stars = 4)::int as s4,
         count(*) filter (where stars = 5)::int as s5
  from public.ratings
  group by tea_id;

revoke all on public.ratings from anon;
grant select, insert, update, delete on public.ratings to authenticated;
grant select on public.tea_ratings to anon, authenticated;

