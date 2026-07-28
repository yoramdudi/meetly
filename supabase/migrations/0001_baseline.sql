-- Meetly baseline schema, RLS policies and invite RPCs.
--
-- READ BEFORE APPLYING. This file was written from what the client code requires
-- (supabase-client.js / app.js); it is NOT a dump of the live database. Reconcile it
-- against the current project before running anything -- if the live tables already
-- hold data with a different shape, applying this as-is can break them.
--
-- Verify in the Supabase dashboard, then adjust and apply:
--   1. Database -> Tables      : do events/responses already exist, with these columns?
--   2. Authentication -> Policies : which policies exist today?
--   3. Database -> Functions   : do invited_event / submit_response already exist?
--
-- Security model
--   * Organizers are authenticated users; they reach their own rows through RLS.
--   * Invitees are anonymous and have NO table policies at all. They can only act
--     through the two SECURITY DEFINER functions below, which require a valid
--     per-guest invite token.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title           text not null,
  duration        text,
  deadline        date,
  options         jsonb not null default '[]'::jsonb,
  guests          jsonb not null default '[]'::jsonb,
  organizer       jsonb not null default '{}'::jsonb,
  final_selection jsonb,
  finalized_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists events_owner_id_idx on public.events (owner_id);

create table if not exists public.responses (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  guest_id   text not null,
  answers    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, guest_id)
);

create index if not exists responses_event_id_idx on public.responses (event_id);

-- ------------------------------------------------- guest ids and invite tokens
--
-- The client builds invite links from guests[].inviteToken and identifies guests by
-- guests[].id, but it never invents either value -- both are minted here so a token
-- is never chosen by, or visible to, another client.

-- On UPDATE the token is taken from the row as it already stands, never from the
-- request. The organizer can correct a guest's name, phone or e-mail; they cannot
-- rotate a token, because that would silently kill an invite link already sent and
-- orphan any answer stored against that guest id.
create or replace function public.stamp_guest_tokens()
returns trigger
language plpgsql
as $$
declare
  stored_tokens jsonb := '{}'::jsonb;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(g ->> 'id', g ->> 'inviteToken'), '{}'::jsonb)
      into stored_tokens
      from jsonb_array_elements(coalesce(old.guests, '[]'::jsonb)) g
     where g ->> 'id' is not null
       and g ->> 'inviteToken' is not null;
  end if;

  new.guests := (
    select coalesce(
      jsonb_agg(
        guest || jsonb_build_object(
          'id', coalesce(guest ->> 'id', gen_random_uuid()::text),
          'inviteToken', coalesce(
            stored_tokens ->> (guest ->> 'id'),  -- known guest: keep the stored token
            guest ->> 'inviteToken',             -- carried over on insert
            encode(gen_random_bytes(16), 'hex')  -- genuinely new guest: mint one
          )
        )
        order by ord
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(new.guests, '[]'::jsonb)) with ordinality as t (guest, ord)
  );
  return new;
end;
$$;

drop trigger if exists events_stamp_guests on public.events;
create trigger events_stamp_guests
  before insert or update of guests on public.events
  for each row execute function public.stamp_guest_tokens();

-- ---------------------------------------------------------------- RLS

alter table public.events enable row level security;
alter table public.responses enable row level security;

drop policy if exists events_owner_select on public.events;
create policy events_owner_select on public.events
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists events_owner_insert on public.events;
create policy events_owner_insert on public.events
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists events_owner_update on public.events;
create policy events_owner_update on public.events
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists events_owner_delete on public.events;
create policy events_owner_delete on public.events
  for delete to authenticated using (owner_id = auth.uid());

-- Organizers read the responses to their own events. Nobody writes responses
-- directly -- submit_response is the only path in.
drop policy if exists responses_owner_select on public.responses;
create policy responses_owner_select on public.responses
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = responses.event_id and e.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------- invite RPCs

-- Returns the event for a valid invite token. Deliberately omits every other
-- guest's contact details and token: an invitee needs the schedule, not the
-- organizer's contact list. `my_answers` lets a returning guest see the choices
-- they already made instead of an empty form.
create or replace function public.invited_event(p_event_id uuid, p_invite_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',              e.id,
    'title',           e.title,
    'duration',        e.duration,
    'deadline',        e.deadline,
    'options',         e.options,
    'organizer',       e.organizer,
    'final_selection', e.final_selection,
    'finalized_at',    e.finalized_at,
    'guests',          (
      select coalesce(jsonb_agg(jsonb_build_object('name', g ->> 'name')), '[]'::jsonb)
      from jsonb_array_elements(e.guests) g
    ),
    'my_answers',      (
      select r.answers
      from public.responses r
      where r.event_id = e.id
        and r.guest_id = (
          select g ->> 'id'
          from jsonb_array_elements(e.guests) g
          where g ->> 'inviteToken' = p_invite_token
          limit 1
        )
    )
  )
  from public.events e
  where e.id = p_event_id
    and exists (
      select 1 from jsonb_array_elements(e.guests) g
      where g ->> 'inviteToken' = p_invite_token
    );
$$;

-- Records (or replaces) one guest's availability. The guest is resolved from the
-- token server-side, so a caller cannot answer on someone else's behalf.
create or replace function public.submit_response(p_event_id uuid, p_invite_token text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id text;
  v_deadline date;
begin
  select g ->> 'id', e.deadline
    into v_guest_id, v_deadline
    from public.events e,
         jsonb_array_elements(e.guests) g
   where e.id = p_event_id
     and g ->> 'inviteToken' = p_invite_token
   limit 1;

  if v_guest_id is null then
    raise exception 'invalid invite' using errcode = '42501';
  end if;

  -- The deadline is the last day on which answering is still allowed. Enforced here
  -- as well as in the UI, because a client-side check is only a courtesy.
  if v_deadline is not null and current_date > v_deadline then
    raise exception 'deadline passed' using errcode = '22023';
  end if;

  insert into public.responses (event_id, guest_id, answers)
  values (p_event_id, v_guest_id, coalesce(p_answers, '[]'::jsonb))
  on conflict (event_id, guest_id)
    do update set answers = excluded.answers, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.invited_event(uuid, text) from public;
revoke all on function public.submit_response(uuid, text, jsonb) from public;
grant execute on function public.invited_event(uuid, text) to anon, authenticated;
grant execute on function public.submit_response(uuid, text, jsonb) to anon, authenticated;
