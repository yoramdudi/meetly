const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Pure date/duration/phone helpers live in lib.js so the test suite can exercise them
// under Node. Destructured here to keep the call sites below unqualified.
const {
  daysFromNow, deadlinePassed, dateBadge, readableChoiceDate,
  meetingMinutes, durationLabel, calendarLink, icsFile, normalizePhone,
  guestContactValid, applyGuestEdit, guestsCarryTokens, removeGuestAt, appendGuest
} = window.MeetlyLib;

// Every element in this file is built through the DOM rather than from an HTML
// string, so no markup is ever parsed and untrusted values cannot become elements.
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') Object.assign(node.style, value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  });
  node.append(...children.filter(Boolean));
  return node;
};
const clear = (node) => { node.textContent = ''; return node; };

const APP_VERSION = '1.3.0';
$('#appVersion').textContent = `גרסה ${APP_VERSION}`;
const modal = $('#eventModal');
const backdrop = $('#modalBackdrop');
const responseModal = $('#responseModal');
const detailsModal = $('#eventDetails');
const profileModal = $('#profileModal');
const modalIntro = (pill, heading, note) => el('div', { class: 'modal-intro' }, [
  el('span', { class: 'step-pill', text: pill }),
  el('h2', { text: heading }),
  note
]);

const authModal = el('section', { class: 'modal hidden', id: 'authModal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'הרשמה והתחברות' }, [
  modalIntro('הרשמה והתחברות', 'לנהל אירועים באופן בטוח', el('p', { id: 'authHint', text: 'התחברו או פתחו חשבון חדש.' })),
  el('button', { type: 'button', class: 'text-button', id: 'googleLogin', text: 'G התחברות עם Google',
    style: { width: '100%', border: '1px solid #ddd8f0', borderRadius: '9px', padding: '12px' } }),
  el('p', { text: 'או', style: { textAlign: 'center', color: '#8a8fa0', margin: '12px 0' } }),
  el('form', { id: 'authForm' }, [
    el('label', { id: 'authNameLabel', text: 'שם מלא' }, [el('input', { id: 'authName', autocomplete: 'name' })]),
    el('label', { text: 'דוא״ל' }, [el('input', { id: 'authEmail', type: 'email', autocomplete: 'email', required: true })]),
    el('label', { text: 'סיסמה' }, [el('input', { id: 'authPassword', type: 'password', autocomplete: 'current-password', minLength: 8, required: true })]),
    el('button', { type: 'submit', class: 'primary submit', id: 'authSubmit', text: 'התחברות' }),
    el('button', { type: 'button', class: 'text-button', id: 'authToggle', text: 'ליצירת חשבון חדש' })
  ])
]);
document.body.insertBefore(authModal, $('#toast'));

const inviteAccessModal = el('section', { class: 'modal hidden', id: 'inviteAccessModal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'הוזמנת לאירוע' }, [
  modalIntro('הוזמנת לאירוע', 'איך היית רוצה להמשיך?', el('p', { text: 'אפשר להשיב כאורח/ת או להירשם כדי לנהל אירועים בעתיד.' })),
  el('button', { type: 'button', class: 'primary submit', id: 'continueGuest', text: 'המשך כאורח/ת' }),
  el('button', { type: 'button', class: 'text-button', id: 'inviteSignup', text: 'התחברות / הרשמה', style: { width: '100%', marginTop: '10px' } })
]);
document.body.insertBefore(inviteAccessModal, $('#toast'));

const finalizeModal = el('section', { class: 'modal hidden', id: 'finalizeModal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'סגירת הבחירה' }, [
  el('button', { type: 'button', class: 'close', id: 'closeFinalize', 'aria-label': 'סגירה', text: '×' }),
  modalIntro('סגירת הבחירה', 'בחר/י את המועד הסופי', el('p', { text: 'לאחר האישור תישלח הודעת WhatsApp נפרדת לכל מוזמן, בקליק אחד לכל אחד.' })),
  el('div', { id: 'finalizeOptions', class: 'detail-list' }),
  el('button', { type: 'button', class: 'primary submit', id: 'confirmFinalize', text: 'סגירה ושליחת זימונים' })
]);
document.body.insertBefore(finalizeModal, $('#toast'));
const finalizeButton = document.createElement('button');
finalizeButton.type = 'button';
finalizeButton.id = 'openFinalize';
finalizeButton.className = 'primary submit hidden';
finalizeButton.textContent = 'סגירת בחירה ושליחת זימונים';
$('#eventDetails').append(finalizeButton);
// Opening the calendar is its own click so it cannot be swallowed by the pop-up blocker.
const calendarButton = document.createElement('button');
calendarButton.type = 'button';
calendarButton.id = 'addCalendar';
calendarButton.className = 'text-button hidden';
calendarButton.style.width = '100%';
calendarButton.style.marginTop = '10px';
calendarButton.textContent = 'הוספה ליומן Google';
$('#eventDetails').append(calendarButton);
// A downloadable file for Outlook/Apple, and for attaching to a message by hand —
// WhatsApp and mailto links cannot carry an attachment.
const icsButton = el('button', {
  type: 'button', id: 'downloadIcs', class: 'text-button hidden',
  text: '⤓ הורדת קובץ יומן (.ics)', style: { width: '100%', marginTop: '6px' }
});
$('#eventDetails').append(icsButton);
const api = '/.netlify/functions';
const invitedEventsKey = 'meetly-invited-events';
const profileKey = 'meetly-profile';
let activeEvent = null;
let activeInviteToken = null;
let profile = null;
let choices = [];
let authUser = null;
let signupMode = false;
let finalizeEvent = null;
let deferredInstallPrompt = null;

const allModals = () => [modal, responseModal, detailsModal, profileModal, authModal, inviteAccessModal, finalizeModal];
const FOCUSABLE = 'button:not([disabled]):not(.hidden), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let openModal = null;
let focusBeforeModal = null;

const show = (element) => {
  focusBeforeModal = document.activeElement;
  openModal = element;
  element.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  // Move focus into the dialog so keyboard and screen-reader users land inside it.
  const first = element.querySelector(FOCUSABLE);
  if (first) first.focus();
};

const hide = () => {
  allModals().forEach((element) => element.classList.add('hidden'));
  backdrop.classList.add('hidden');
  openModal = null;
  // Hand focus back to whatever opened the dialog.
  if (focusBeforeModal?.isConnected) focusBeforeModal.focus();
  focusBeforeModal = null;
};

// Escape closes, and Tab is trapped inside the open dialog rather than wandering
// into the page behind it.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if ($('.sidebar').classList.contains('mobile-open')) { $('.sidebar').classList.remove('mobile-open'); backdrop.classList.add('hidden'); return; }
    if (openModal) { event.preventDefault(); hide(); }
    return;
  }
  if (event.key !== 'Tab' || !openModal) return;
  const focusable = [...openModal.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

let toastTimer = null;
const toast = (message) => {
  const element = $('#toast');
  element.textContent = message;
  element.classList.remove('hidden');
  // Clear the pending timer, otherwise a second toast is cut short by the first.
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.classList.add('hidden'); toastTimer = null; }, 3800);
};

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
$('#installApp').onclick = async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  toast(isIos
    ? 'ב-iPhone: לחצו על כפתור שיתוף ← “הוספה למסך הבית”.'
    : 'בדפדפן זה אפשר להוסיף למסך הבית מתפריט הדפדפן.');
};
// Registered relative to the document so the app works under a sub-path deploy (e.g. /meetly/).
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));

const netlifyRequest = async (path, options) => {
  const response = await fetch(`${api}${path}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};
const apiRequest = async (path, options = {}) => {
  if (!window.MeetlyData) return netlifyRequest(path, options);
  const method = options.method || 'GET';
  const query = new URLSearchParams(path.split('?')[1] || '');
  const id = query.get('id');
  if (path === '/events' && method === 'GET') return MeetlyData.events();
  if (path === '/events' && method === 'POST') return MeetlyData.createEvent(JSON.parse(options.body));
  if (path.startsWith('/events?') && method === 'GET') {
    // An invite token means the caller is an anonymous guest: RLS blocks a plain
    // select, so the event has to come back through the token-checking RPC.
    const invite = query.get('invite');
    if (invite) return MeetlyData.invitedEvent(id, invite);
    const event = await MeetlyData.event(id);
    if (event) event.responses = await MeetlyData.responses(id);
    return event;
  }
  if (path.startsWith('/events?') && method === 'DELETE') return MeetlyData.deleteEvent(id);
  if (path.startsWith('/events?') && method === 'PATCH') {
    const body = JSON.parse(options.body);
    // Two organizer edits share this route: correcting guest contact details, and
    // locking the final slot. For the latter only the index is stored; the client
    // derives the option from it (see mapEvent).
    const patch = body.guests
      ? { guests: body.guests }
      : { final_selection: { index: body.selectedOptionIndex }, finalized_at: new Date().toISOString() };
    const updated = await MeetlyData.updateEvent(id, patch);
    if (updated) updated.responses = await MeetlyData.responses(id);
    return updated;
  }
  if (path === '/responses' && method === 'POST') { const body = JSON.parse(options.body); return MeetlyData.submitResponse(body.eventId, body.inviteToken, body.answers); }
  return netlifyRequest(path, options);
};

const addEventToList = (event, target = '#ownedEvents', role = 'owner') => {
  const isOwnerCard = role === 'owner';
  if (target === '#ownedEvents') $('#emptyEvents')?.remove();
  const [dateValue, time] = event.options[0] || ['', ''];
  const badge = dateBadge(dateValue);
  const card = el('article', {
    class: `event-card ${isOwnerCard ? 'featured' : ''}`,
    tabIndex: 0,
    dataset: { eventId: event.id, role }
  }, [
    el('div', { class: 'card-top' }, [
      el('span', { class: 'status amber', text: isOwnerCard ? 'את/ה המארגן/ת' : 'הוזמנת' }),
      isOwnerCard && el('button', { type: 'button', class: 'delete-event', 'aria-label': 'מחיקת אירוע', text: '×' })
    ]),
    el('div', { class: 'date-badge' }, [
      el('b', { text: badge.day }),
      el('span', { text: badge.month })
    ]),
    el('h3', { text: event.title }),
    el('p', { text: `${time} · ${event.options.length} אפשרויות` }),
    el('div', { class: 'card-footer' }, [el('span', { text: `${event.guests.length} מוזמנים` })])
  ]);
  $(target).prepend(card);
  return card;
};

const loadEvents = async () => {
  try {
    const events = await apiRequest('/events');
    $$('#ownedEvents .event-card').forEach((card) => card.remove());
    events.reverse().forEach((event) => addEventToList(event));
    if (!events.length && !$('#emptyEvents')) {
      const empty = document.createElement('p');
      empty.className = 'empty-events';
      empty.id = 'emptyEvents';
      empty.textContent = 'עדיין אין אירועים שיצרת. אפשר להתחיל ביצירת אירוע חדש.';
      $('#ownedEvents').append(empty);
    }
  } catch {
    toast('לא הצלחנו לטעון את האירועים.');
  }
};

$('#showAllEvents').onclick = async () => {
  if (!authUser) { show(authModal); return; }
  await loadEvents();
  $('#ownedEvents').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const defaultDeadline = () => daysFromNow(3);

// The form ships with no dates baked into the markup; every default is derived here
// so the app never opens on a date that has already passed.
const resetEventFormDates = () => {
  $('#deadline').value = defaultDeadline();
  $$('#timeList .time-row [type=date]').forEach((input) => { input.value = daysFromNow(2); });
};

const eventForm = $('#eventForm');
const wizardSteps = [];
const wizardStepGroups = [
  [$('#eventName').closest('label'), $('#duration').closest('.form-row')],
  [$('.time-options')],
  [$('.guest-options')]
];
let wizardStepIndex = 0;

wizardStepGroups.forEach((group, index) => {
  const step = document.createElement('div');
  step.className = 'wizard-step';
  group.forEach((element) => step.append(element));
  wizardSteps[index] = step;
  eventForm.append(step);
});

const wizardActions = document.createElement('div');
wizardActions.className = 'wizard-actions';
const wizardBack = document.createElement('button');
wizardBack.type = 'button';
wizardBack.className = 'text-button';
wizardBack.textContent = '→ חזרה';
const wizardNext = document.createElement('button');
wizardNext.type = 'button';
wizardNext.className = 'primary';
wizardNext.textContent = 'המשך ←';
const wizardSubmit = eventForm.querySelector('[type=submit]');
wizardActions.append(wizardBack, wizardNext, wizardSubmit);
eventForm.append(wizardActions);

const showWizardStep = (index) => {
  wizardStepIndex = index;
  wizardSteps.forEach((step, stepIndex) => { step.style.display = stepIndex === index ? 'grid' : 'none'; });
  wizardBack.classList.toggle('hidden', index === 0);
  wizardNext.classList.toggle('hidden', index === wizardSteps.length - 1);
  wizardSubmit.classList.toggle('hidden', index !== wizardSteps.length - 1);
  $('.step-pill').textContent = `שלב ${index + 1} מתוך 3`;
};

wizardNext.onclick = () => {
  if (wizardStepIndex === 0 && !$('#eventName').reportValidity()) return;
  showWizardStep(wizardStepIndex + 1);
};
wizardBack.onclick = () => showWizardStep(wizardStepIndex - 1);
showWizardStep(0);

$('#createButton').onclick = () => {
  if (!authUser) {
    show(authModal);
    return;
  }
  if (!profile) {
    show(profileModal);
    return;
  }
  resetEventFormDates();
  showWizardStep(0);
  show(modal);
};
$('#profileButton').onclick = () => authUser ? show(profileModal) : show(authModal);

// Signing out clears every local trace of the account. The invite tokens go too:
// they are credentials, and leaving them behind on a shared device after an
// explicit sign-out is worse than making the guest reopen their invite link.
const logoutButton = el('button', { type: 'button', class: 'text-button hidden', id: 'logout', text: 'התנתקות', style: { width: '100%', marginTop: '10px' } });
profileModal.append(logoutButton);
logoutButton.onclick = async () => {
  logoutButton.disabled = true;
  try { await window.MeetlyData?.signOut(); } catch { /* clear locally regardless */ }
  [profileKey, invitedEventsKey].forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem('meetly-pending-invite');
  location.replace(location.pathname);
};

const applyTodayLabel = () => {
  $('#todayLabel').textContent = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
};

const applyProfile = () => {
  const accountName = authUser?.name || '';
  logoutButton.classList.toggle('hidden', !authUser);
  $('#profileName').textContent = accountName || 'הגדרת פרופיל';
  $('#profilePhone').textContent = profile?.phone || 'לחצו להוספת טלפון';
  $('#profileAvatar').textContent = accountName.slice(0, 1) || 'י';
  $('#profileNameInput').value = accountName;
  $('#profilePhoneInput').value = profile?.phone || '';
  const greeting = $('#greeting');
  greeting.textContent = accountName ? `בוקר טוב, ${accountName} ` : 'ברוכים הבאים ';
  const sparkle = document.createElement('span');
  sparkle.textContent = '✦';
  greeting.append(sparkle);
};

$('#profileForm').onsubmit = (event) => {
  event.preventDefault();
  profile = { name: $('#profileNameInput').value.trim(), phone: $('#profilePhoneInput').value.trim() };
  localStorage.setItem(profileKey, JSON.stringify(profile));
  applyProfile();
  hide();
};
$('#closeModal').onclick = hide;
$('#closeResponse').onclick = hide;
$('#closeDetails').onclick = hide;
$('#closeFinalize').onclick = hide;
backdrop.onclick = () => { $('.sidebar').classList.remove('mobile-open'); hide(); };
$('#mobileMenu').onclick = () => {
  $('.sidebar').classList.add('mobile-open');
  backdrop.classList.remove('hidden');
};
$$('.nav-link').forEach((link) => {
  link.onclick = (event) => {
    event.preventDefault();
    const target = link.getAttribute('href');
    $('.sidebar').classList.remove('mobile-open');
    backdrop.classList.add('hidden');
    if (target === '#new') { $('#createButton').click(); return; }
    if (target === '#contacts') {
      $('#createButton').click();
      if (authUser && profile?.phone) showWizardStep(2);
      return;
    }
    $('#ownedEvents').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
});

$('#addTime').onclick = () => {
  const last = [...$$('#timeList .time-row')].pop();
  $('#timeList').append(el('div', { class: 'time-row' }, [
    el('input', { type: 'date', 'aria-label': 'תאריך', value: last?.querySelector('[type=date]')?.value || daysFromNow(2) }),
    el('input', { type: 'time', 'aria-label': 'שעה', value: '11:00' }),
    el('button', { type: 'button', class: 'remove-time', 'aria-label': 'הסרת זמן', text: '×' })
  ]));
};

$('#timeList').onclick = (event) => {
  if (event.target.classList.contains('remove-time') && $$('#timeList .time-row').length > 1) event.target.parentElement.remove();
};

const addGuestRow = () => {
  $('#guestList').append(el('div', { class: 'time-row guest-row' }, [
    el('input', { class: 'guest-name', placeholder: 'שם מלא', 'aria-label': 'שם המוזמן' }),
    el('input', { class: 'guest-phone', type: 'tel', inputMode: 'tel', placeholder: 'מספר טלפון', 'aria-label': 'מספר טלפון' }),
    el('input', { class: 'guest-email', type: 'email', placeholder: 'כתובת אימייל', 'aria-label': 'כתובת אימייל' }),
    el('button', { type: 'button', class: 'remove-time remove-guest', 'aria-label': 'הסרת מוזמן', text: '×' })
  ]));
};

$('#addGuest').onclick = addGuestRow;
$('#guestList').onclick = (event) => {
  if (event.target.classList.contains('remove-guest') && $$('.guest-row').length > 1) event.target.parentElement.remove();
};

const addSelectedContact = (contact) => {
  const name = Array.isArray(contact.name) ? contact.name.find(Boolean) : contact.name;
  const phone = Array.isArray(contact.tel) ? contact.tel.find(Boolean) : contact.tel;
  if (!name && !phone) return;
  const existing = [...$$('.guest-row')].find((row) => !row.querySelector('.guest-name').value && !row.querySelector('.guest-phone').value && !row.querySelector('.guest-email').value);
  const row = existing || (addGuestRow(), $$('#guestList .guest-row')[$$('#guestList .guest-row').length - 1]);
  row.querySelector('.guest-name').value = name || '';
  row.querySelector('.guest-phone').value = phone || '';
};

if (navigator.contacts?.select) {
  const contactButton = document.createElement('button');
  contactButton.type = 'button';
  contactButton.id = 'pickContacts';
  contactButton.textContent = '◎ בחירה מאנשי קשר בטלפון';
  $('#addGuest').before(contactButton);
  contactButton.onclick = async () => {
    try {
      const properties = await navigator.contacts.getProperties();
      const fields = ['name', 'tel'].filter((field) => properties.includes(field));
      if (!fields.includes('tel')) {
        toast('הדפדפן לא מאפשר שיתוף מספרי טלפון.');
        return;
      }
      const contacts = await navigator.contacts.select(fields, { multiple: true });
      contacts.forEach(addSelectedContact);
      if (contacts.length) toast(`נוספו ${contacts.length} אנשי קשר.`);
    } catch (error) {
      if (error?.name !== 'AbortError') toast('לא הצלחנו לבחור אנשי קשר.');
    }
  };
}

// location.pathname, not just the origin: the app may be served from a sub-path.
const inviteUrlFor = (eventData, guest) => `${location.origin}${location.pathname}?event=${encodeURIComponent(eventData.id)}&invite=${encodeURIComponent(guest.inviteToken)}#respond`;
// Without a token the link cannot be answered, so refuse to send a dead invite.
const hasInviteToken = (guest) => {
  if (guest.inviteToken) return true;
  toast('חסר קוד הזמנה למוזמן הזה. רענן/י את הדף ונסה/י שוב.');
  return false;
};
const sendAvailabilityInvite = (eventData, guest) => {
  if (!guest.phone || !hasInviteToken(guest)) return;
  const otherParticipants = Math.max(eventData.guests.length - 1, 0);
  const message = `הוזמנת לתיאום פגישה על-ידי ${eventData.organizer.name}\nטלפון: ${eventData.organizer.phone}\n\nביחד עם עוד ${otherParticipants} משתתפים\nבנושא: ${eventData.title}\n\nאנא הקש/י לבחירת זמן מתאים:\n${inviteUrlFor(eventData, guest)}`;
  window.open(`https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
};
const sendEmailInvite = (eventData, guest) => {
  if (!guest.email || !hasInviteToken(guest)) return;
  const subject = `הזמנה לתיאום פגישה: ${eventData.title}`;
  const body = `שלום ${guest.name},\n\nהוזמנת לתיאום פגישה על-ידי ${eventData.organizer.name}.\nנושא: ${eventData.title}\n\nלבחירת זמן מתאים:\n${inviteUrlFor(eventData, guest)}`;
  // An anchor click hands off to the mail client without navigating this document away.
  const link = document.createElement('a');
  link.href = `mailto:${guest.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.body.append(link);
  link.click();
  link.remove();
};
const sendReminder = (eventData, guest) => {
  if (!guest.phone || !hasInviteToken(guest)) return;
  const message = `תזכורת קטנה 🙏\nעדיין נשמרה הבחירה שלך לתיאום הפגישה בנושא: ${eventData.title}\n\nאנא הקש/י לבחירת זמן מתאים:\n${inviteUrlFor(eventData, guest)}`;
  window.open(`https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
};
// Shared by the calendar button, the .ics download and the final invite messages, so
// all three describe the same meeting.
const calendarFieldsFor = (eventData) => {
  const [date, time] = eventData.finalSelection.option;
  const guests = eventData.guests.map((guest) => guest.name).join(', ');
  return {
    title: eventData.title,
    date,
    time,
    minutes: meetingMinutes(eventData.duration),
    details: `מארגן/ת: ${eventData.organizer.name}\nטלפון: ${eventData.organizer.phone}\nמשתתפים: ${guests}`
  };
};

const finalMessageFor = (eventData) => {
  const [date, time] = eventData.finalSelection.option;
  const fields = calendarFieldsFor(eventData);
  // WhatsApp and mailto: carry text only — a file cannot be attached from a link — so
  // the guest gets a one-tap calendar link instead.
  return `פגישה נקבעה!\n\nנושא: ${eventData.title}\nמועד: ${date} בשעה ${time}\nמשך: ${durationLabel(eventData.duration)}\nמארגן/ת: ${eventData.organizer.name}\nטלפון: ${eventData.organizer.phone}\n\nלהוספה ליומן:\n${calendarLink(fields)}`;
};

const sendFinalInvite = (eventData, guest) => {
  if (!guest.phone) return;
  window.open(`https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(finalMessageFor(eventData))}`, '_blank', 'noopener');
};

const sendFinalEmail = (eventData, guest) => {
  if (!guest.email) return;
  const subject = `פגישה נקבעה: ${eventData.title}`;
  const link = document.createElement('a');
  link.href = `mailto:${guest.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`שלום ${guest.name},\n\n${finalMessageFor(eventData)}`)}`;
  document.body.append(link);
  link.click();
  link.remove();
};

const addToCalendar = (eventData) => {
  window.open(calendarLink(calendarFieldsFor(eventData)), '_blank', 'noopener');
};

// A real file, for Outlook/Apple users and for attaching to a message by hand.
const downloadIcs = (eventData) => {
  const fields = calendarFieldsFor(eventData);
  const text = icsFile({
    ...fields,
    description: fields.details,
    // Deterministic, so re-downloading updates the entry instead of duplicating it.
    uid: `meetly-${eventData.id}-${eventData.finalSelection.index}@meetly`
  });
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(eventData.title || 'meetly').replace(/[\\/:*?"<>|]/g, '-')}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

$('#eventForm').onsubmit = async (event) => {
  event.preventDefault();
  const title = $('#eventName').value.trim();
  const organizer = { ...profile, name: authUser?.name || profile?.name || '' };
  const guests = [...$$('.guest-row')].map((row) => ({
    name: row.querySelector('.guest-name').value.trim(),
    phone: normalizePhone(row.querySelector('.guest-phone').value),
    email: row.querySelector('.guest-email').value.trim()
  })).filter((guest) => guest.name || guest.phone || guest.email);
  const options = [...$$('#timeList .time-row')].map((row) => [
    row.querySelector('[type=date]').value,
    row.querySelector('[type=time]').value
  ]);

  if (!title || !organizer.name || !organizer.phone || guests.some((guest) => !guest.name || (!guest.phone && !guest.email))) {
    toast('יש למלא שם וטלפון או אימייל לכל מוזמן.');
    return;
  }

  const submitButton = $('#eventForm [type=submit]');
  submitButton.disabled = true;
  try {
    const createdEvent = await apiRequest('/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, options, guests, organizer, duration: $('#duration').value, deadline: $('#deadline').value })
    });
    addEventToList(createdEvent);
    hide();
    // Sending in a loop would trip the pop-up blocker after the first window, so the
    // guest list is opened instead and each invite goes out on its own click.
    openEventDetails(createdEvent, true);
    toast(`האירוע נשמר. שלחו הזמנה לכל אחד מ-${createdEvent.guests.length} המוזמנים מהרשימה.`);
  } catch {
    toast('לא הצלחנו לשמור את האירוע. נסה/י שוב.');
  } finally {
    submitButton.disabled = false;
  }
};

// The date, time and duration all come from the organizer's event record, so
// interpolating them into markup would let an organizer run script in every
// invitee's browser. Built as elements instead.
const updateAnswerCount = () => {
  $('#answerCount').textContent = `${$$('#choiceList .selected').length}/${choices.length}`;
};

const renderChoices = (savedAnswers = null) => {
  const list = clear($('#choiceList'));
  choices.forEach(([date, time], index) => {
    const readable = readableChoiceDate(date);

    // A returning guest sees the answers they already saved, not a blank form.
    const saved = savedAnswers?.[index]?.answer || null;
    list.append(el('div', { class: 'choice' }, [
      el('div', { class: 'choice-date' }, [
        el('span', { text: readable.day }),
        el('b', { text: readable.number }),
        el('span', { text: readable.month })
      ]),
      el('div', { class: 'choice-main' }, [
        el('b', { text: time }),
        el('span', { text: `משך הפגישה: ${durationLabel(activeEvent?.duration)}` }),
        el('div', { class: 'toggle' }, [
          el('button', { type: 'button', class: `yes${saved === 'yes' ? ' selected' : ''}`, text: '✓ מתאים לי', dataset: { answer: 'yes' } }),
          el('button', { type: 'button', class: `no${saved === 'no' ? ' selected' : ''}`, text: 'לא מתאים', dataset: { answer: 'no' } })
        ])
      ])
    ]));
  });
  updateAnswerCount();
};

const setResponseHeader = (eventData) => {
  $('.response-header h2').textContent = eventData.title || '';
  const info = $$('.meeting-info span');
  if (info[0]) info[0].textContent = `◷ ${durationLabel(eventData.duration)}`;
  if (info[1]) info[1].textContent = `♙ מאת ${eventData.organizer?.name || ''}`;
};
// Options are passed in rather than read from a shared global, so opening an
// organizer's details view can no longer leave stale state behind for a response.
const openResponse = (options, savedAnswers = null) => {
  choices = options || [];
  const closed = deadlinePassed(activeEvent);
  renderChoices(savedAnswers);
  const save = $('#saveResponse');
  save.disabled = closed;
  save.textContent = closed ? 'מועד ההשבה חלף' : 'שמירת הבחירות';
  if (closed) toast('המועד להשבה חלף. לא ניתן לעדכן את הבחירות.');
  show(responseModal);
};

const setDetailsTab = (name) => {
  $$('.detail-tab').forEach((tab) => {
    const active = tab.dataset.detailsTab === name;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $$('[data-details-panel]').forEach((panel) => { panel.hidden = panel.dataset.detailsPanel !== name; });
};

$('.detail-tabs').onclick = (event) => {
  const tab = event.target.closest('.detail-tab:not(.hidden)');
  if (tab) setDetailsTab(tab.dataset.detailsTab);
};

const openFinalize = (eventData) => {
  finalizeEvent = eventData;
  detailsModal.classList.add('hidden');
  const responses = eventData.responses || [];
  const list = clear($('#finalizeOptions'));
  eventData.options.forEach((option, index) => {
    const available = responses.filter((response) => response.answers[index]?.answer === 'yes').length;
    list.append(el('label', {}, [
      el('input', {
        type: 'radio', name: 'final-option', value: String(index),
        checked: eventData.finalSelection?.index === index || (!eventData.finalSelection && index === 0)
      }),
      el('div', { text: `${option[0]} · ${option[1]} — ${available} יכולים/ות` })
    ]));
  });
  show(finalizeModal);
};

finalizeButton.onclick = () => { if (activeEvent) openFinalize(activeEvent); };
calendarButton.onclick = () => { if (activeEvent?.finalSelection) addToCalendar(activeEvent); };
icsButton.onclick = () => { if (activeEvent?.finalSelection) downloadIcs(activeEvent); };
$('#confirmFinalize').onclick = async () => {
  const selected = $('#finalizeOptions input:checked');
  if (!finalizeEvent || !selected) return;
  const button = $('#confirmFinalize');
  button.disabled = true;
  try {
    const finalized = await apiRequest(`/events?id=${encodeURIComponent(finalizeEvent.id)}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ selectedOptionIndex: Number(selected.value) })
    });
    if (!finalized?.finalSelection) throw new Error('המועד לא נשמר. נסה/י שוב.');
    hide();
    // Same pop-up-blocker constraint as event creation: one send per user click.
    openEventDetails(finalized, true);
    toast('המועד נסגר. שלחו זימון לכל מוזמן מהרשימה, ואפשר להוסיף את הפגישה ליומן.');
  } catch (error) {
    toast(error.message || 'לא הצלחנו לסגור את הבחירה.');
  } finally { button.disabled = false; }
};

const markSent = (button) => {
  if (button.dataset.sent) return;
  button.dataset.sent = '1';
  button.textContent = `✓ ${button.textContent}`;
};

// Guest rows are rendered from activeEvent so a contact correction can redraw just this
// list, without reloading the event or reopening the modal.
let detailsIsOwner = false;
let editingGuestIndex = null;

const guestDisplayRow = (guest, guestIndex, response, isFinalized) => {
  const item = el('div', { text: `${guest.name} · ${response ? 'השיב/ה' : 'טרם השיב/ה'}` });
  if (guest.phone) item.append(el('br'), `טלפון: ${guest.phone}`);
  if (guest.email) item.append(el('br'), `אימייל: ${guest.email}`);
  if (!detailsIsOwner) return item;
  // Index rather than guest.id: ids are assigned server-side and may be absent.
  const ref = { guestIndex: String(guestIndex) };
  if (guest.phone) {
    item.append(' ', el('button', {
      type: 'button', class: 'text-button',
      dataset: { ...ref, send: 'phone', action: isFinalized ? 'final' : (response ? 'resend' : 'reminder') },
      text: isFinalized ? 'שליחת הזימון בוואטסאפ' : (response ? 'שלח שוב לטלפון' : 'שלח תזכורת לטלפון')
    }));
  }
  if (guest.email) {
    item.append(' ', el('button', {
      type: 'button', class: 'text-button', dataset: { ...ref, send: 'email' },
      text: isFinalized ? 'שליחת הזימון באימייל' : 'שליחה באימייל'
    }));
  }
  item.append(' ', el('button', {
    type: 'button', class: 'text-button', dataset: { ...ref, guestEdit: '1' }, text: '✎ תיקון פרטים'
  }));
  item.append(' ', el('button', {
    type: 'button', class: 'text-button guest-remove', dataset: { ...ref, guestRemove: '1' }, text: '✕ הסרה'
  }));
  return item;
};

// index -1 is the "add a guest" form; anything else edits that position.
const guestEditRow = (guest, guestIndex) => {
  const isNew = guestIndex < 0;
  return el('div', { class: 'guest-edit', dataset: { guestForm: String(guestIndex) } }, [
    el('span', { class: 'guest-edit-title', text: isNew ? 'הוספת מוזמן' : 'תיקון פרטי מוזמן' }),
    el('input', { class: 'guest-edit-name', value: guest.name || '', placeholder: 'שם מלא', 'aria-label': 'שם המוזמן' }),
    el('input', { class: 'guest-edit-phone', type: 'tel', inputMode: 'tel', value: guest.phone || '', placeholder: 'מספר טלפון', 'aria-label': 'מספר טלפון' }),
    el('input', { class: 'guest-edit-email', type: 'email', value: guest.email || '', placeholder: 'כתובת אימייל', 'aria-label': 'כתובת אימייל' }),
    el('div', { class: 'guest-edit-actions' }, [
      el('button', { type: 'button', class: 'text-button', dataset: { guestSave: String(guestIndex) }, text: isNew ? 'הוספה' : 'שמירה' }),
      el('button', { type: 'button', class: 'text-button', dataset: { guestCancel: '1' }, text: 'ביטול' })
    ]),
    el('p', {
      class: 'guest-edit-note',
      text: isNew
        ? 'המוזמן החדש יקבל קוד הזמנה משלו. אחרי ההוספה יש לשלוח לו/ה את ההזמנה.'
        : 'קוד ההזמנה נשמר, כך שתשובות שכבר התקבלו לא נאבדות. אחרי תיקון יש לשלוח את ההזמנה שוב.'
    })
  ]);
};

const renderGuestList = () => {
  const container = clear($('#detailGuests'));
  const guests = activeEvent?.guests || [];
  const responses = activeEvent?.responses || [];
  const isFinalized = Boolean(activeEvent?.finalSelection);
  if (!guests.length && editingGuestIndex !== -1) container.append(el('div', { text: 'אין מוזמנים באירוע הזה' }));
  guests.forEach((guest, guestIndex) => {
    container.append(editingGuestIndex === guestIndex
      ? guestEditRow(guest, guestIndex)
      : guestDisplayRow(guest, guestIndex, responses.find((saved) => saved.guestId === guest.id), isFinalized));
  });
  if (!detailsIsOwner) return;
  container.append(editingGuestIndex === -1
    ? guestEditRow({}, -1)
    : el('button', { type: 'button', class: 'text-button', dataset: { guestAdd: '1' }, text: '＋ הוספת מוזמן' }));
};

const saveGuestEdit = async (guestIndex) => {
  const form = $(`[data-guest-form="${guestIndex}"]`);
  if (!activeEvent || !form) return;
  const name = form.querySelector('.guest-edit-name').value.trim();
  const phone = normalizePhone(form.querySelector('.guest-edit-phone').value);
  const email = form.querySelector('.guest-edit-email').value.trim();
  if (!guestContactValid({ name, phone, email })) {
    toast('יש למלא שם, ולפחות טלפון או אימייל.');
    return;
  }
  // Whatever the change, the guests already on the row must come back with their id and
  // inviteToken intact — the id keys their stored response, the token is in the link
  // already sent. If they did not load, refuse rather than send a request that rotates
  // them. An event with no guests yet has nothing to preserve.
  if (activeEvent.guests.length && !guestsCarryTokens(activeEvent.guests)) {
    toast('פרטי המוזמנים לא נטענו במלואם. רענן/י את הדף לפני עריכה.');
    return;
  }
  const isNew = guestIndex < 0;
  const saveButton = form.querySelector('[data-guest-save]');
  saveButton.disabled = true;
  const guests = isNew
    ? appendGuest(activeEvent.guests, { name, phone, email })
    : applyGuestEdit(activeEvent.guests, guestIndex, { name, phone, email });
  try {
    await patchGuests(guests);
    toast(isNew
      ? `${name} נוסף/ה לאירוע. שלחו לו/ה את ההזמנה מהרשימה.`
      : 'הפרטים עודכנו. שלחו את ההזמנה שוב לפרטים החדשים.');
  } catch (error) {
    toast(error.message || (isNew ? 'לא הצלחנו להוסיף את המוזמן.' : 'לא הצלחנו לעדכן את פרטי המוזמן.'));
    saveButton.disabled = false;
  }
};

// One write path for every guest-list change, so the redraw can never be forgotten.
const patchGuests = async (guests) => {
  const updated = await apiRequest(`/events?id=${encodeURIComponent(activeEvent.id)}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ guests })
  });
  if (!updated) throw new Error('השינוי לא נשמר. נסה/י שוב.');
  activeEvent = updated;
  editingGuestIndex = null;
  renderGuestList();
  renderDetailStats();
  syncEventCardCount();
  return updated;
};

const removeGuest = async (guestIndex) => {
  const guest = activeEvent?.guests?.[guestIndex];
  if (!guest) return;
  if (!guestsCarryTokens(activeEvent.guests)) {
    toast('פרטי המוזמנים לא נטענו במלואם. רענן/י את הדף לפני הסרה.');
    return;
  }
  // Say out loud that a stored answer goes with them — the database prunes it, and a
  // silent deletion is not something to spring on the organizer.
  const answered = (activeEvent.responses || []).some((response) => response.guestId === guest.id);
  const question = answered
    ? `להסיר את ${guest.name} מהאירוע? גם התשובה שנשמרה עבורו/ה תימחק, וקישור ההזמנה שלו/ה יפסיק לעבוד.`
    : `להסיר את ${guest.name} מהאירוע? קישור ההזמנה שלו/ה יפסיק לעבוד.`;
  if (!window.confirm(question)) return;
  try {
    await patchGuests(removeGuestAt(activeEvent.guests, guestIndex));
    toast(`${guest.name} הוסר/ה מהאירוע.`);
  } catch (error) {
    toast(error.message || 'לא הצלחנו להסיר את המוזמן.');
  }
};

$('#detailGuests').onclick = (event) => {
  if (!activeEvent) return;

  const editButton = event.target.closest('[data-guest-edit]');
  if (editButton) { editingGuestIndex = Number(editButton.dataset.guestIndex); renderGuestList(); return; }
  if (event.target.closest('[data-guest-add]')) { editingGuestIndex = -1; renderGuestList(); return; }
  if (event.target.closest('[data-guest-cancel]')) { editingGuestIndex = null; renderGuestList(); return; }
  const saveButton = event.target.closest('[data-guest-save]');
  if (saveButton) { saveGuestEdit(Number(saveButton.dataset.guestSave)); return; }
  const removeButton = event.target.closest('[data-guest-remove]');
  if (removeButton) { removeGuest(Number(removeButton.dataset.guestIndex)); return; }

  const button = event.target.closest('[data-send]');
  if (!button) return;
  const guest = activeEvent.guests[Number(button.dataset.guestIndex)];
  if (!guest) return;
  // Once a slot is locked, both channels carry the confirmed booking rather than a
  // request for availability.
  if (button.dataset.send === 'email') {
    if (activeEvent.finalSelection) sendFinalEmail(activeEvent, guest);
    else sendEmailInvite(activeEvent, guest);
  } else if (button.dataset.action === 'final') sendFinalInvite(activeEvent, guest);
  else if (button.dataset.action === 'reminder') sendReminder(activeEvent, guest);
  else sendAvailabilityInvite(activeEvent, guest);
  markSent(button);
};

// Rendered from activeEvent so adding or removing a guest can redraw the tallies
// without reloading the event.
const renderDetailStats = () => {
  const guests = activeEvent?.guests || [];
  const responses = activeEvent?.responses || [];
  const options = activeEvent?.options || [];
  const stats = clear($('#detailStats'));
  stats.append(el('div', { text: `השיבו: ${responses.length}/${guests.length} · ממתינים: ${Math.max(guests.length - responses.length, 0)}` }));
  if (activeEvent?.finalSelection?.option) {
    stats.append(el('div', { text: `מועד נבחר: ${activeEvent.finalSelection.option[0]} · ${activeEvent.finalSelection.option[1]}` }));
  }
  options.forEach((option, index) => {
    const available = responses.filter((response) => response.answers[index]?.answer === 'yes').length;
    stats.append(el('div', { text: `${option[0]} · ${option[1]} — ${available} יכולים/ות` }));
  });
};

// The card in the grid shows a guest count, so it goes stale the moment one is
// added or removed.
const syncEventCardCount = () => {
  if (!activeEvent) return;
  const card = [...$$('.event-card')].find((candidate) => candidate.dataset.eventId === activeEvent.id);
  const footer = card?.querySelector('.card-footer span');
  if (footer) footer.textContent = `${activeEvent.guests.length} מוזמנים`;
};

const openEventDetails = (eventData, ownerView = Boolean(authUser && eventData.ownerId === authUser.id)) => {
  activeEvent = eventData.id ? eventData : null;
  $('#detailTitle').textContent = eventData.title;
  clear($('#detailDuration')).append(el('div', { text: durationLabel(eventData.duration) || 'פרטי המשך לא זמינים' }));
  const optionList = clear($('#detailOptions'));
  eventData.options.forEach(([date, time]) => optionList.append(el('div', { text: `${date} · ${time}` })));
  clear($('#detailGuests'));
  const isOwner = ownerView;
  $('#detailGuestsTab').classList.toggle('hidden', !isOwner);
  $('#detailStatsTab').classList.toggle('hidden', !isOwner);
  $('#openResponseFromDetails').classList.toggle('hidden', Boolean(isOwner));
  finalizeButton.classList.toggle('hidden', !isOwner);
  calendarButton.classList.toggle('hidden', !eventData.finalSelection);
  icsButton.classList.toggle('hidden', !eventData.finalSelection);
  finalizeButton.textContent = isOwner && eventData.finalSelection
    ? 'עדכון המועד ושליחה מחדש'
    : 'סגירת בחירה ושליחת זימונים';
  // For organizers, lead with the guest list—the primary next action after opening an existing event.
  setDetailsTab(isOwner ? 'guests' : 'details');
  detailsIsOwner = isOwner;
  editingGuestIndex = null;
  if (isOwner) renderDetailStats();
  renderGuestList();
  show(detailsModal);
};

// An invitee must re-fetch through their token (RLS blocks a plain select) and must
// never be handed the organizer view.
const openSavedEvent = async (eventId, role = 'owner', inviteToken = null) => {
  try {
    const path = inviteToken
      ? `/events?id=${encodeURIComponent(eventId)}&invite=${encodeURIComponent(inviteToken)}`
      : `/events?id=${encodeURIComponent(eventId)}`;
    const eventData = await apiRequest(path);
    if (!eventData) throw new Error('not found');
    // Keep the token around so saving a response posts against the right invite.
    if (inviteToken) activeInviteToken = inviteToken;
    openEventDetails(eventData, role === 'owner');
  } catch {
    toast('לא הצלחנו לטעון את האירוע.');
  }
};

const onCardClick = (event) => {
  const card = event.target.closest('.event-card');
  if (!card) return;
  if (event.target.classList.contains('delete-event')) {
    event.stopPropagation();
    if (!card.dataset.eventId) {
      toast('ניתן למחוק רק אירועים שנשמרו.');
      return;
    }
    if (!window.confirm('למחוק את האירוע?')) return;
    apiRequest(`/events?id=${encodeURIComponent(card.dataset.eventId)}`, { method: 'DELETE' })
      .then(() => { card.remove(); toast('האירוע נמחק.'); })
      .catch(() => toast('לא הצלחנו למחוק את האירוע.'));
    return;
  }
  if (!card.dataset.eventId) {
    // Every card is built from a saved event, so this should not happen. Say so
    // rather than rendering whatever options happened to be in memory.
    toast('לא הצלחנו לזהות את האירוע. רענן/י את הדף.');
    return;
  }
  openSavedEvent(card.dataset.eventId, card.dataset.role, card.dataset.inviteToken || null);
};

const onCardKeydown = (event) => {
  if (event.key === 'Enter' && event.target.classList.contains('event-card')) event.target.click();
};
$('#ownedEvents').onclick = onCardClick;
$('#ownedEvents').onkeydown = onCardKeydown;
$('#invitedGrid').onclick = onCardClick;
$('#invitedGrid').onkeydown = onCardKeydown;
$('#openResponseFromDetails').onclick = () => {
  if (!activeEvent) return;
  setResponseHeader(activeEvent);
  detailsModal.classList.add('hidden');
  openResponse(activeEvent.options, activeEvent.myAnswers);
};
$('#choiceList').onclick = (event) => {
  if (!event.target.dataset.answer) return;
  const group = event.target.parentElement;
  group.querySelectorAll('button').forEach((button) => button.classList.remove('selected'));
  event.target.classList.add('selected');
  updateAnswerCount();
};

$('#saveResponse').onclick = async () => {
  const answers = [...$$('#choiceList .toggle')].map((toggle, index) => ({ option: choices[index], answer: toggle.querySelector('.selected')?.dataset.answer || null }));
  if (!answers.some((entry) => entry.answer)) {
    toast('בחר/י לפחות אפשרות אחת לפני השמירה.');
    return;
  }
  if (deadlinePassed(activeEvent)) {
    toast('המועד להשבה חלף. לא ניתן לעדכן את הבחירות.');
    return;
  }
  if (activeEvent) {
    try {
      await apiRequest('/responses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: activeEvent.id, inviteToken: activeInviteToken, answers }) });
    } catch {
      toast('לא הצלחנו לשמור את הבחירה.');
      return;
    }
  }
  hide();
  toast('הבחירה נשמרה.');
};

const loadInvitation = async () => {
  const eventId = new URLSearchParams(location.search).get('event');
  activeInviteToken = new URLSearchParams(location.search).get('invite');
  if (!eventId || !activeInviteToken || location.hash !== '#respond') return false;
  try {
    activeEvent = await apiRequest(`/events?id=${encodeURIComponent(eventId)}&invite=${encodeURIComponent(activeInviteToken)}`);
    if (!activeEvent) throw new Error('not found');
    const saved = JSON.parse(localStorage.getItem(invitedEventsKey) || '[]');
    if (!saved.some((item) => item.id === activeEvent.id && item.invite === activeInviteToken)) localStorage.setItem(invitedEventsKey, JSON.stringify([{ id: activeEvent.id, invite: activeInviteToken }, ...saved]));
    setResponseHeader(activeEvent);
    openResponse(activeEvent.options, activeEvent.myAnswers);
    return true;
  } catch {
    toast('ההזמנה לא נמצאה.');
    return false;
  }
};

const isInvitationLink = () => {
  const query = new URLSearchParams(location.search);
  return Boolean(query.get('event') && query.get('invite') && location.hash === '#respond');
};

$('#continueGuest').onclick = async () => {
  hide();
  await loadInvitation();
};
$('#inviteSignup').onclick = () => {
  inviteAccessModal.classList.add('hidden');
  show(authModal);
};

const loadInvitedEvents = async () => {
  const invitations = JSON.parse(localStorage.getItem(invitedEventsKey) || '[]').filter((item) => item?.id && item?.invite);
  if (!invitations.length) return;
  const events = await Promise.all(invitations.map((item) => apiRequest(`/events?id=${encodeURIComponent(item.id)}&invite=${encodeURIComponent(item.invite)}`)
    .then((event) => (event ? { event, invite: item.invite } : null))
    .catch(() => null)));
  // The token rides on the card so re-opening the event goes back through the RPC.
  events.filter(Boolean).reverse().forEach(({ event, invite }) => {
    addEventToList(event, '#invitedGrid', 'invitee').dataset.inviteToken = invite;
  });
  if (events.some(Boolean)) {
    $('#invitedHeading').classList.remove('hidden');
    $('#invitedGrid').classList.remove('hidden');
  }
};

try { profile = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch { profile = null; }

const renderAuthMode = () => {
  $('#authNameLabel').classList.toggle('hidden', !signupMode);
  $('#authName').required = signupMode;
  $('#authPassword').autocomplete = signupMode ? 'new-password' : 'current-password';
  $('#authSubmit').textContent = signupMode ? 'יצירת חשבון' : 'התחברות';
  $('#authToggle').textContent = signupMode ? 'כבר יש לי חשבון' : 'ליצירת חשבון חדש';
};

$('#authToggle').onclick = () => { signupMode = !signupMode; renderAuthMode(); };
$('#googleLogin').onclick = () => {
  if (window.MeetlyData?.signInWithGoogle) { MeetlyData.signInWithGoogle(); return; }
  toast('התחברות Google אינה זמינה כרגע.');
};
$('#authForm').onsubmit = async (event) => {
  event.preventDefault();
  const submit = $('#authSubmit');
  submit.disabled = true;
  try {
    if (window.MeetlyData) {
      if (signupMode) {
        await MeetlyData.signUp($('#authEmail').value.trim(), $('#authPassword').value, $('#authName').value.trim());
        toast('נשלח אימות לדוא״ל. לאחר האישור התחברו כאן.');
        signupMode = false; renderAuthMode(); return;
      }
      authUser = await MeetlyData.signIn($('#authEmail').value.trim(), $('#authPassword').value);
      if (!profile && authUser?.user_metadata?.name) profile = { name: authUser.user_metadata.name, phone: '' };
      applyProfile(); hide(); if (!profile?.phone) show(profileModal); loadEvents(); return;
    }
    const result = await apiRequest('/auth', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: signupMode ? 'signup' : 'login', email: $('#authEmail').value.trim(), password: $('#authPassword').value, name: $('#authName').value.trim() })
    });
    if (result.confirmationRequired) {
      toast('נשלח אימות לדוא״ל. לחצו על הקישור ואז התחברו.');
      signupMode = false;
      renderAuthMode();
      return;
    }
    authUser = result.user;
    if (!profile && authUser?.name) profile = { name: authUser.name, phone: '' };
    applyProfile();
    hide();
    if (isInvitationLink()) {
      await loadInvitation();
      return;
    }
    if (!profile?.phone) show(profileModal);
    loadEvents();
  } catch (error) {
    toast(error.message || 'לא הצלחנו להתחבר.');
  } finally { submit.disabled = false; }
};

const init = async () => {
  applyTodayLabel();
  resetEventFormDates();
  renderAuthMode();
  applyProfile();
  if (window.MeetlyData) {
    // A refresh that cannot be recovered means the session is over: say so and ask
    // for a fresh login instead of letting every later call fail opaquely.
    MeetlyData.onSessionExpired = () => {
      authUser = null;
      applyProfile();
      hide();
      show(authModal);
      toast('פג תוקף ההתחברות. יש להתחבר מחדש.');
    };
  }
  if (window.MeetlyData?.finishGoogleLogin) {
    try { authUser = await MeetlyData.finishGoogleLogin(); } catch { authUser = null; }
  }
  const oauthParams = new URLSearchParams(location.hash.slice(1));
  if (oauthParams.get('access_token')) {
    try {
      authUser = (await apiRequest('/auth', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'oauth-callback', accessToken: oauthParams.get('access_token') })
      })).user;
      const pendingInvite = sessionStorage.getItem('meetly-pending-invite');
      sessionStorage.removeItem('meetly-pending-invite');
      history.replaceState(null, '', pendingInvite ? `${location.pathname}${pendingInvite}#respond` : `${location.pathname}${location.search}`);
    } catch (error) {
      toast(error.message || 'ההתחברות עם Google נכשלה.');
    }
  }
  if (!authUser) {
    authUser = window.MeetlyData?.currentUser() || null;
    // Only probe the Netlify session endpoint when there is no Supabase adapter to ask.
    if (!authUser && !window.MeetlyData) { try { authUser = (await apiRequest('/auth')).user; } catch { authUser = null; } }
  }
  applyProfile();
  if (isInvitationLink()) {
    if (authUser) await loadInvitation();
    else show(inviteAccessModal);
    return;
  }
  loadInvitedEvents();
  if (!authUser) { show(authModal); return; }
  if (!profile?.phone) { profile = { name: profile?.name || authUser.name || '', phone: '' }; show(profileModal); }
  loadEvents();
};

init();
