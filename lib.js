// Pure helpers shared by the browser app and the test suite.
//
// Nothing here touches the DOM, the network or localStorage, which is what makes it
// testable under plain Node. The browser loads this file before app.js and picks the
// helpers up off window.MeetlyLib; `npm test` requires it directly.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MeetlyLib = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const pad = (value) => String(value).padStart(2, '0');

  // ---------------------------------------------------------------- dates

  const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const daysFromNow = (days, now = new Date()) => {
    const date = new Date(now.getTime());
    date.setDate(date.getDate() + days);
    return isoDate(date);
  };

  const today = (now = new Date()) => isoDate(now);

  // The deadline is inclusive: the last day on which answering is still allowed.
  const deadlinePassed = (eventData, todayIso) => Boolean(eventData?.deadline)
    && (todayIso || today()) > String(eventData.deadline).slice(0, 10);

  // Month as a Hebrew abbreviation rather than the raw "07" that string slicing gave.
  const dateBadge = (value) => {
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return { day: String(value).slice(-2), month: '' };
    return {
      day: new Intl.DateTimeFormat('he-IL', { day: 'numeric' }).format(parsed),
      month: new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(parsed)
    };
  };

  const readableChoiceDate = (value) => {
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return { day: value, number: '', month: '' };
    return {
      day: new Intl.DateTimeFormat('he-IL', { weekday: 'short' }).format(parsed),
      number: new Intl.DateTimeFormat('he-IL', { day: 'numeric' }).format(parsed),
      month: new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(parsed)
    };
  };

  // ---------------------------------------------------------------- duration
  //
  // `duration` is stored as a plain minute count. Events created before that change
  // hold Hebrew labels ("45 דקות" / "שעה"), so both shapes are read here.

  const meetingMinutes = (duration) => {
    if (String(duration).includes('שעה')) return 60;
    const value = Number(String(duration).match(/\d+/)?.[0]);
    return Number.isFinite(value) && value > 0 ? value : 60;
  };

  const durationLabel = (duration) => {
    if (duration === undefined || duration === null || duration === '') return '';
    if (!/^\d+$/.test(String(duration).trim())) return String(duration); // legacy label
    const minutes = Number(duration);
    if (minutes === 60) return 'שעה';
    if (minutes % 60 === 0) return `${minutes / 60} שעות`;
    return `${minutes} דקות`;
  };

  // ---------------------------------------------------------------- calendar
  //
  // Stamps are built with UTC getters over Date.UTC purely as calendar arithmetic, so
  // the browser's own timezone (and any DST shift inside the meeting) cannot move the
  // wall-clock digits. Google is told how to read them via the ctz parameter.

  const calendarStamp = (date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
    + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00`;

  const calendarRange = (date, time, minutes) => {
    const [year, month, day] = String(date).split('-').map(Number);
    const [hour, minute] = String(time).split(':').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    return `${calendarStamp(start)}/${calendarStamp(end)}`;
  };

  const calendarLink = ({ title, date, time, minutes, details }) => {
    const query = new URLSearchParams({
      action: 'TEMPLATE',
      text: title || '',
      dates: calendarRange(date, time, minutes),
      details: details || '',
      // The stamps above are plain wall-clock digits; this is what fixes their meaning.
      ctz: 'Asia/Jerusalem'
    });
    return `https://calendar.google.com/calendar/render?${query.toString()}`;
  };

  // ---------------------------------------------------------------- .ics
  //
  // Times are emitted as RFC 5545 "floating" values — no TZID and no trailing Z — so
  // every calendar client shows the wall clock the organizer picked. For this app's
  // audience that is what is wanted, and it avoids shipping a VTIMEZONE block or a
  // bare Olson name that stricter parsers reject. The trade-off: a guest in another
  // timezone sees 10:00 rather than 10:00 Israel time converted to theirs.

  const icsEscape = (value) => String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

  const icsStamp = (date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
    + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

  const icsFile = ({ title, date, time, minutes, description, uid, now = new Date() }) => {
    const [start, end] = calendarRange(date, time, minutes).split('/');
    // CRLF is mandatory in RFC 5545; some clients reject bare newlines.
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Meetly//Meetly//HE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${icsEscape(uid)}`,
      `DTSTAMP:${icsStamp(now)}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsEscape(title)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n') + '\r\n';
  };

  // ---------------------------------------------------------------- phone
  //
  // WhatsApp needs a full international number with no punctuation. The old rule only
  // understood Israeli "0..." numbers and silently mangled anything else.

  const normalizePhone = (raw) => {
    const trimmed = String(raw || '').trim();
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';
    if (trimmed.startsWith('+')) return digits;          // already international
    if (digits.startsWith('00')) return digits.slice(2); // 00 is an exit prefix
    if (digits.startsWith('972')) return digits;
    if (digits.startsWith('0')) return `972${digits.slice(1)}`;
    return digits;                                        // assume a country code is present
  };

  // ---------------------------------------------------------------- guests

  // A guest needs a name plus at least one way to reach them.
  const guestContactValid = ({ name, phone, email }) => Boolean(String(name || '').trim())
    && Boolean(String(phone || '').trim() || String(email || '').trim());

  // Correcting a guest's contact details must never touch `id` or `inviteToken`:
  // the id keys that guest's stored response, and the token is embedded in every
  // invite link already sent. Only the three editable fields are replaced.
  const applyGuestEdit = (guests, index, patch) => (guests || []).map((guest, position) => (
    position === index
      ? { ...guest, name: patch.name, phone: patch.phone, email: patch.email }
      : guest
  ));

  // True when every guest carries the server-minted fields an edit must preserve.
  const guestsCarryTokens = (guests) => Array.isArray(guests)
    && guests.length > 0
    && guests.every((guest) => Boolean(guest?.id) && Boolean(guest?.inviteToken));

  // Drops one guest, leaving the rest — including their ids and tokens — untouched.
  // Any response already stored for the removed guest is deleted database-side by the
  // events_prune_responses trigger, so a stale answer cannot keep skewing the tallies.
  const removeGuestAt = (guests, index) => (guests || []).filter((guest, position) => position !== index);

  // Appends a guest with no id and no inviteToken on purpose: both are minted by the
  // events_stamp_guests trigger, so a client never chooses another guest's token.
  const appendGuest = (guests, patch) => [
    ...(guests || []),
    { name: patch.name, phone: patch.phone, email: patch.email }
  ];

  return {
    isoDate, daysFromNow, today, deadlinePassed, dateBadge, readableChoiceDate,
    meetingMinutes, durationLabel, calendarStamp, calendarRange, calendarLink,
    icsEscape, icsFile, normalizePhone,
    guestContactValid, applyGuestEdit, guestsCarryTokens, removeGuestAt, appendGuest
  };
}));
