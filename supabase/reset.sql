-- =============================================================================
-- Meetly — DESTRUCTIVE reset. Read all of this before running any of it.
-- =============================================================================
--
-- This drops Meetly's own database objects so that migrations/0001_baseline.sql
-- can recreate them from scratch. Every event, every guest list and every saved
-- response in these tables is permanently deleted. There is no undo.
--
-- WHAT IT DROPS  (by name, deliberately narrow)
--   table    public.responses
--   table    public.events          <- cascades to their RLS policies
--   function public.invited_event           (all overloads)
--   function public.submit_response         (all overloads)
--   function public.stamp_guest_tokens      (all overloads)
--   function public.prune_orphan_responses  (all overloads)
--   triggers events_stamp_guests, events_prune_responses  <- go with the table
--
-- WHAT IT DOES NOT TOUCH
--   * Any other table in `public`. Objects are dropped by name, so anything that
--     is not Meetly's is left completely alone.
--   * The `auth` schema. Your user accounts survive a reset.
--   * Storage buckets, extensions, roles.
--
-- HOW TO RUN
--   0. Back up first — see STEP 0.
--   1. See exactly what would go — see STEP 1. It changes nothing.
--   2. Uncomment the one `set` line in STEP 2. Without it the script refuses to
--      run, so a stray paste cannot delete your data.
--   3. Run this whole file.
--   4. Run migrations/0001_baseline.sql to recreate everything.
--
-- The schema is NOT duplicated here on purpose. If it were, this file and the
-- baseline would drift apart and one of them would quietly become wrong.
-- =============================================================================


-- ============================== STEP 0: BACK UP ==============================
-- Run this on its own FIRST and save the result (the editor can export CSV).
-- If it errors because a table is missing, there is nothing to back up.
--
--   select jsonb_pretty(coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb))
--   from public.events e;
--
--   select jsonb_pretty(coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb))
--   from public.responses r;


-- ======================= STEP 1: DRY RUN (safe) ==============================
-- Lists the objects this script would drop. Changes nothing. Run it on its own.
--
--   select 'table' as kind, tablename as name from pg_tables
--    where schemaname = 'public' and tablename in ('events','responses')
--   union all
--   select 'function', p.oid::regprocedure::text
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('invited_event','submit_response','stamp_guest_tokens','prune_orphan_responses');


-- ===================== STEP 2: CONFIRMATION REQUIRED ========================
-- Uncomment exactly this line to authorise the deletion, then run the file.

-- set meetly.confirm_destructive_reset = 'yes';

do $$
begin
  if current_setting('meetly.confirm_destructive_reset', true) is distinct from 'yes' then
    raise exception
      'Refusing to run: this deletes all Meetly data. Uncomment the `set` line in STEP 2 first.';
  end if;
end $$;


-- ============================== STEP 3: DROP =================================

-- Functions are dropped by name across every overload, so a signature that
-- differs from the baseline's still goes. The names come from the system
-- catalog, not from any input.
do $$
declare
  target record;
begin
  for target in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('invited_event', 'submit_response', 'stamp_guest_tokens', 'prune_orphan_responses')
  loop
    raise notice 'dropping function %', target.signature;
    execute format('drop function if exists %s cascade', target.signature);
  end loop;
end $$;

-- responses first: it references events.
drop table if exists public.responses cascade;
drop table if exists public.events cascade;

do $$
begin
  raise notice 'Meetly objects dropped. Now run migrations/0001_baseline.sql.';
end $$;


-- ============================ STEP 4: RECREATE ===============================
-- Run supabase/migrations/0001_baseline.sql now.
--
-- Then verify — all four should come back as expected:
--
--   select tablename from pg_tables
--    where schemaname='public' and tablename in ('events','responses');
--
--   select p.oid::regprocedure::text from pg_proc p
--     join pg_namespace n on n.oid=p.pronamespace
--    where n.nspname='public'
--      and p.proname in ('invited_event','submit_response','stamp_guest_tokens','prune_orphan_responses');
--
--   select tablename, policyname, cmd from pg_policies
--    where schemaname='public' order by tablename, policyname;
--
--   select tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid
--    where not t.tgisinternal and c.relname='events';
