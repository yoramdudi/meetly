// Run with: npm test   (node:test + node:assert, no dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isoDate, daysFromNow, today, deadlinePassed, dateBadge, readableChoiceDate,
  meetingMinutes, durationLabel, calendarStamp, calendarRange, normalizePhone,
  guestContactValid, applyGuestEdit, guestsCarryTokens
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

// --- correcting a guest's contact details ------------------------------------
// The invariant these guard: an edit may change name/phone/email and nothing else.
// Rotating inviteToken would kill an invite link already sent; changing id would
// orphan the answer stored against that guest.

const GUESTS = () => [
  { id: 'g1', inviteToken: 'tok-1', name: 'דנה', phone: '972541111111', email: 'dana@example.com' },
  { id: 'g2', inviteToken: 'tok-2', name: 'יוסי', phone: '972542222222', email: '' }
];

test('applyGuestEdit preserves id and inviteToken', () => {
  const edited = applyGuestEdit(GUESTS(), 1, { name: 'יוסי כהן', phone: '972543333333', email: 'yossi@example.com' });
  assert.equal(edited[1].id, 'g2', 'id must survive - it keys the stored response');
  assert.equal(edited[1].inviteToken, 'tok-2', 'token must survive - it is in the link already sent');
});

test('applyGuestEdit replaces exactly the three editable fields', () => {
  const edited = applyGuestEdit(GUESTS(), 1, { name: 'יוסי כהן', phone: '972543333333', email: 'yossi@example.com' });
  assert.deepEqual(edited[1], {
    id: 'g2', inviteToken: 'tok-2', name: 'יוסי כהן', phone: '972543333333', email: 'yossi@example.com'
  });
});

test('applyGuestEdit leaves the other guests byte-identical', () => {
  const before = GUESTS();
  const edited = applyGuestEdit(before, 1, { name: 'x', phone: '972540000000', email: '' });
  assert.deepEqual(edited[0], GUESTS()[0]);
});

test('applyGuestEdit does not mutate the input array', () => {
  const before = GUESTS();
  applyGuestEdit(before, 0, { name: 'changed', phone: '', email: 'c@example.com' });
  assert.deepEqual(before, GUESTS(), 'the caller still holds the pre-edit state');
});

test('applyGuestEdit is a no-op for an out-of-range index', () => {
  assert.deepEqual(applyGuestEdit(GUESTS(), 7, { name: 'x', phone: 'y', email: 'z' }), GUESTS());
});

test('applyGuestEdit tolerates a missing guest list', () => {
  assert.deepEqual(applyGuestEdit(null, 0, { name: 'x', phone: '', email: '' }), []);
});

test('applyGuestEdit can clear one channel while keeping the other', () => {
  // Fixing a typo often means deleting a wrong e-mail and relying on the phone.
  const edited = applyGuestEdit(GUESTS(), 0, { name: 'דנה', phone: '972541111111', email: '' });
  assert.equal(edited[0].email, '');
  assert.equal(edited[0].phone, '972541111111');
  assert.equal(edited[0].inviteToken, 'tok-1');
});

test('guestsCarryTokens accepts a fully loaded list', () => {
  assert.equal(guestsCarryTokens(GUESTS()), true);
});

test('guestsCarryTokens rejects lists an edit would corrupt', () => {
  // invited_event returns names only, so this is what an invitee's copy looks like.
  assert.equal(guestsCarryTokens([{ name: 'דנה' }]), false);
  assert.equal(guestsCarryTokens([{ id: 'g1', name: 'דנה' }]), false, 'missing token');
  assert.equal(guestsCarryTokens([{ inviteToken: 't', name: 'דנה' }]), false, 'missing id');
  assert.equal(guestsCarryTokens([]), false);
  assert.equal(guestsCarryTokens(null), false);
  assert.equal(guestsCarryTokens(undefined), false);
});

test('guestContactValid requires a name and one channel', () => {
  assert.equal(guestContactValid({ name: 'דנה', phone: '972541111111', email: '' }), true);
  assert.equal(guestContactValid({ name: 'דנה', phone: '', email: 'd@example.com' }), true);
  assert.equal(guestContactValid({ name: 'דנה', phone: '', email: '' }), false, 'no way to reach them');
  assert.equal(guestContactValid({ name: '', phone: '972541111111', email: '' }), false, 'no name');
  assert.equal(guestContactValid({ name: '   ', phone: '972541111111', email: '' }), false, 'blank name');
  assert.equal(guestContactValid({}), false);
});
