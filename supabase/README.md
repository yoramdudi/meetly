# Supabase

All data protection in Meetly lives in the database, not in the client. The browser
holds only the publishable key (`supabase-config.js`), which is safe to ship — it
grants nothing on its own. Row Level Security and the two invite functions are what
actually keep one organizer's events away from another's.

That makes these files the security-critical part of the project. Keeping them here
means a policy change shows up in review like any other code change.

## Files

| File | Purpose |
| --- | --- |
| `migrations/0001_baseline.sql` | Tables, guest-token trigger, RLS policies, invite RPCs |

## Before you apply anything

`0001_baseline.sql` was reconstructed from what the client code requires. It is **not
a dump of the live project**, and it has not been run against it. Applying it blindly
to a database that already holds events can break them.

Reconcile first:

1. **Database → Tables** — do `events` and `responses` already exist? Same columns?
2. **Authentication → Policies** — what is enabled today?
3. **Database → Functions** — do `invited_event` and `submit_response` exist?

Then adjust the file to match reality and apply the difference.

## The model in one paragraph

Organizers are authenticated users and reach only their own rows, enforced by
`owner_id = auth.uid()`. Invitees are anonymous and have **no table policies at
all** — they can act only through `invited_event` and `submit_response`, which are
`SECURITY DEFINER` and require a valid per-guest invite token. Tokens and guest ids
are minted by the `events_stamp_guests` trigger, never by the client, so a token is
never chosen by or exposed to another browser. `invited_event` returns guest *names*
only, so answering an invite does not hand over the organizer's contact list.

## Redirect URLs

Google sign-in returns to `location.origin + location.pathname`. Every host that
serves the app needs to be listed under **Authentication → URL Configuration →
Redirect URLs**, including any local dev origin.
