# Meetly

Hebrew-first meeting scheduling. An organizer creates an event with a few candidate
times, each guest gets a private link over WhatsApp or e-mail, and the organizer picks
the final slot once the answers are in.

No build step and no framework — plain HTML, CSS and JavaScript, served as static files
from GitHub Pages, with Supabase behind it for data and authentication.

## Layout

| Path | Role |
| --- | --- |
| `index.html` | Whole app shell: every screen is a modal in here |
| `app.js` | UI wiring — DOM, events, screen flow |
| `lib.js` | Pure date / duration / phone helpers, shared with the tests |
| `supabase-client.js` | Data adapter: REST calls, session handling, field mapping |
| `supabase-config.js` | Project URL and publishable key (safe to ship — see below) |
| `styles.css` | All styling, in cascade order by section |
| `service-worker.js` | Offline shell cache |
| `supabase/` | Schema, RLS policies and invite RPCs — read its README first |
| `test/` | Unit tests for `lib.js` |

## Running it locally

Any static file server works; the app needs no build.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Two notes:

- Service workers and installability need `localhost` or HTTPS — `file://` will not do.
- Google sign-in returns to `location.origin + location.pathname`, so add your local
  origin under **Authentication → URL Configuration → Redirect URLs** in Supabase, or
  that flow will fail.

Paths throughout are relative, so the app also works from a sub-path such as
`https://<user>.github.io/meetly/`.

## Tests and lint

```bash
npm test
```

Runs on a clean checkout with no `npm install` — the suite uses only `node:test` and
`node:assert`. Linting does need the dev dependency:

```bash
npm install && npm run lint
```

`npm run check` does both. CI runs the same two steps on push and pull request.

## Security model, briefly

The publishable Supabase key in `supabase-config.js` is meant to be public; it grants
nothing by itself. Access control lives entirely in the database:

- Organizers are authenticated users and reach only their own rows (`owner_id = auth.uid()`).
- Invitees are anonymous and have **no table policies**. They act only through two
  `SECURITY DEFINER` functions that require a valid per-guest invite token.
- Invite tokens and guest ids are minted by a database trigger, never by the client.

`supabase/README.md` has the details and an important warning: the migration in that
folder was reconstructed from what the client needs and has **not** been run against
the live project. Reconcile before applying.

## Conventions worth knowing

- **No markup strings.** Elements are built with the `el()` helper in `app.js`. Event
  data comes from other users, so nothing is ever interpolated into HTML. A lint rule
  enforces this.
- **`duration` is a minute count.** Older rows hold Hebrew labels (`"45 דקות"`);
  `durationLabel()` and `meetingMinutes()` both read either shape.
- **Calendar times are wall-clock digits** plus `ctz=Asia/Jerusalem`. Stamps are built
  with UTC arithmetic so the browser's timezone cannot shift them.
- **One send per click.** Invites are never dispatched in a loop — pop-up blockers kill
  everything after the first window. The guest list has a send button per guest.
- **Calendar goes out as a link, not a file.** `api.whatsapp.com/send?text=` and
  `mailto:` carry text only, so the confirmed-booking message embeds a Google Calendar
  link. The `.ics` download exists for Outlook/Apple and for attaching by hand; its
  times are RFC 5545 floating values, so a guest abroad sees the organizer's wall
  clock rather than a conversion.
