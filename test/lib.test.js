// Run with: npm test   (node:test + node:assert, no dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isoDate, daysFromNow, today, deadlinePassed, dateBadge, readableChoiceDate,
  meetingMinutes, durationLabel, calendarStamp, calendarRange, normalizePhone
} = require('../lib.js');

test('durationLabel formats the stored minute count', () => {
  assert.equal(durationLabel('30'), '30 דקות');
  assert.equal(durationLabel('45'), '45 דקות');
  assert.equal(durationLabel('60'), 'שעה');
  assert.equal(durationLabel('90'), '90 דקות');
  assert.equal(durationLabel('120'), '2 שעות');
});

test('durationLabel passes through pre-migration Hebrew labels', () => {
  // Events created before duration became numeric still hold these strings.
  assert.equal(durationLabel('45 דקות'), '45 דקות');
  assert.equal(durationLabel('שעה'), 'שעה');
});

test('durationLabel is empty for missing values', () => {
  assert.equal(durationLabel(''), '');
  assert.equal(durationLabel(null), '');
  assert.equal(durationLabel(undefined), '');
});

test('meetingMinutes reads both the numeric and legacy shapes', () => {
  assert.equal(meetingMinutes('45'), 45);
  assert.equal(meetingMinutes('60'), 60);
  assert.equal(meetingMinutes('45 דקות'), 45);
  assert.equal(meetingMinutes('שעה'), 60);
  assert.equal(meetingMinutes('90 דקות'), 90);
  assert.equal(meetingMinutes('???'), 60, 'unparseable duration falls back to an hour');
});

test('calendarStamp emits literal wall-clock digits', () => {
  assert.equal(calendarStamp(new Date(Date.UTC(2026, 7, 3, 10, 0))), '20260803T100000');
});

test('calendarRange is unaffected by the local timezone', () => {
  // Whatever TZ the browser is in, a 10:00 pick must stay 10:00; ctz gives it meaning.
  assert.equal(calendarRange('2026-08-03', '10:00', 45), '20260803T100000/20260803T104500');
});

test('calendarRange survives a DST boundary inside the meeting', () => {
  // 2026-10-25 is an Israeli DST change. Date arithmetic in local time used to shift
  // the end of the meeting by an hour here.
  assert.equal(calendarRange('2026-10-25', '01:30', 60), '20261025T013000/20261025T023000');
});

test('calendarRange rolls the date over midnight', () => {
  assert.equal(calendarRange('2026-08-03', '23:30', 90), '20260803T233000/20260804T010000');
});

test('normalizePhone converts Israeli numbers to international form', () => {
  assert.equal(normalizePhone('0541234567'), '972541234567');
  assert.equal(normalizePhone('054-123-4567'), '972541234567');
  assert.equal(normalizePhone(' 054 123 4567 '), '972541234567');
  assert.equal(normalizePhone('972541234567'), '972541234567');
  assert.equal(normalizePhone('+972-54-1234567'), '972541234567');
});

test('normalizePhone keeps non-Israeli numbers intact', () => {
  // The old rule stripped the + and then mangled anything not starting with 0.
  assert.equal(normalizePhone('+1 415 555 0123'), '14155550123');
  assert.equal(normalizePhone('0044 20 7946 0958'), '442079460958');
});

test('normalizePhone yields an empty string for junk', () => {
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone(null), '');
  assert.equal(normalizePhone('abc'), '');
});

test('deadlinePassed treats the deadline day as still open', () => {
  assert.equal(deadlinePassed({ deadline: '2026-07-29' }, '2026-07-28'), false);
  assert.equal(deadlinePassed({ deadline: '2026-07-28' }, '2026-07-28'), false);
  assert.equal(deadlinePassed({ deadline: '2026-07-27' }, '2026-07-28'), true);
});

test('deadlinePassed is open when there is no deadline', () => {
  assert.equal(deadlinePassed({}, '2026-07-28'), false);
  assert.equal(deadlinePassed(null, '2026-07-28'), false);
});

test('deadlinePassed tolerates a timestamp-shaped deadline', () => {
  assert.equal(deadlinePassed({ deadline: '2026-07-27T00:00:00Z' }, '2026-07-28'), true);
});

test('isoDate zero-pads month and day', () => {
  assert.equal(isoDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('daysFromNow offsets from a supplied date', () => {
  assert.equal(daysFromNow(2, new Date(2026, 6, 28)), '2026-07-30');
  assert.equal(daysFromNow(3, new Date(2026, 6, 30)), '2026-08-02', 'crosses a month boundary');
});

test('today formats the supplied date', () => {
  assert.equal(today(new Date(2026, 6, 28)), '2026-07-28');
});

test('dateBadge renders a Hebrew month abbreviation, not a number', () => {
  const badge = dateBadge('2026-07-22');
  assert.equal(badge.day, '22');
  assert.notEqual(badge.month, '07');
  assert.ok(badge.month.length > 0);
});

test('dateBadge degrades gracefully on an unparseable date', () => {
  assert.deepEqual(dateBadge('not-a-date'), { day: 'te', month: '' });
});

test('readableChoiceDate returns weekday, day and month', () => {
  const readable = readableChoiceDate('2026-07-22');
  assert.equal(readable.number, '22');
  assert.ok(readable.day.length > 0);
  assert.ok(readable.month.length > 0);
});

test('readableChoiceDate falls back to the raw value', () => {
  assert.deepEqual(readableChoiceDate('nope'), { day: 'nope', number: '', month: '' });
});
