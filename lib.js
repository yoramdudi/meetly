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

  return {
    isoDate, daysFromNow, today, deadlinePassed, dateBadge, readableChoiceDate,
    meetingMinutes, durationLabel, calendarStamp, calendarRange, normalizePhone
  };
}));
