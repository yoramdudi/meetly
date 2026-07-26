const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const APP_VERSION = '1.1.0';
$('#appVersion').textContent = `\u05d2\u05e8\u05e1\u05d4 ${APP_VERSION}`;
const modal = $('#eventModal');
const backdrop = $('#modalBackdrop');
const responseModal = $('#responseModal');
const detailsModal = $('#eventDetails');
const profileModal = $('#profileModal');
const authModal = document.createElement('section');
authModal.className = 'modal hidden';
authModal.id = 'authModal';
authModal.innerHTML = '<div class="modal-intro"><span class="step-pill">\u05d4\u05e8\u05e9\u05de\u05d4 \u05d5\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea</span><h2>\u05dc\u05e0\u05d4\u05dc \u05d0\u05d9\u05e8\u05d5\u05e2\u05d9\u05dd \u05d1\u05d0\u05d5\u05e4\u05df \u05d1\u05d8\u05d5\u05d7</h2><p id="authHint">\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5 \u05d0\u05d5 \u05e4\u05ea\u05d7\u05d5 \u05d7\u05e9\u05d1\u05d5\u05df \u05d7\u05d3\u05e9.</p></div><button class="text-button" id="googleLogin" type="button" style="width:100%;border:1px solid #ddd8f0;border-radius:9px;padding:12px">G \u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea \u05e2\u05dd Google</button><p style="text-align:center;color:#8a8fa0;margin:12px 0">\u05d0\u05d5</p><form id="authForm"><label id="authNameLabel">\u05e9\u05dd \u05de\u05dc\u05d0<input id="authName" autocomplete="name" /></label><label>\u05d3\u05d5\u05d0\u05f4\u05dc<input id="authEmail" type="email" autocomplete="email" required /></label><label>\u05e1\u05d9\u05e1\u05de\u05d4<input id="authPassword" type="password" autocomplete="current-password" minlength="8" required /></label><button class="primary submit" id="authSubmit" type="submit">\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea</button><button class="text-button" id="authToggle" type="button">\u05dc\u05d9\u05e6\u05d9\u05e8\u05ea \u05d7\u05e9\u05d1\u05d5\u05df \u05d7\u05d3\u05e9</button></form>';
document.body.insertBefore(authModal, $('#toast'));
const inviteAccessModal = document.createElement('section');
inviteAccessModal.className = 'modal hidden';
inviteAccessModal.id = 'inviteAccessModal';
inviteAccessModal.innerHTML = '<div class="modal-intro"><span class="step-pill">\u05d4\u05d5\u05d6\u05de\u05e0\u05ea \u05dc\u05d0\u05d9\u05e8\u05d5\u05e2</span><h2>\u05d0\u05d9\u05da \u05d4\u05d9\u05d9\u05ea \u05e8\u05d5\u05e6\u05d4 \u05dc\u05d4\u05de\u05e9\u05d9\u05da?</h2><p>\u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05e9\u05d9\u05d1 \u05db\u05d0\u05d5\u05e8\u05d7/\u05ea \u05d0\u05d5 \u05dc\u05d4\u05d9\u05e8\u05e9\u05dd \u05db\u05d3\u05d9 \u05dc\u05e0\u05d4\u05dc \u05d0\u05d9\u05e8\u05d5\u05e2\u05d9\u05dd \u05d1\u05e2\u05ea\u05d9\u05d3.</p></div><button class="primary submit" id="continueGuest" type="button">\u05d4\u05de\u05e9\u05da \u05db\u05d0\u05d5\u05e8\u05d7/\u05ea</button><button class="text-button" id="inviteSignup" type="button" style="width:100%;margin-top:10px">\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea / \u05d4\u05e8\u05e9\u05de\u05d4</button>';
document.body.insertBefore(inviteAccessModal, $('#toast'));
const finalizeModal = document.createElement('section');
finalizeModal.className = 'modal hidden';
finalizeModal.id = 'finalizeModal';
finalizeModal.innerHTML = '<button class="close" id="closeFinalize">\u00d7</button><div class="modal-intro"><span class="step-pill">\u05e1\u05d2\u05d9\u05e8\u05ea \u05d4\u05d1\u05d7\u05d9\u05e8\u05d4</span><h2>\u05d1\u05d7\u05e8/\u05d9 \u05d0\u05ea \u05d4\u05de\u05d5\u05e2\u05d3 \u05d4\u05e1\u05d5\u05e4\u05d9</h2><p>\u05dc\u05d0\u05d7\u05e8 \u05d4\u05d0\u05d9\u05e9\u05d5\u05e8 \u05ea\u05d9\u05e4\u05ea\u05d7 \u05d4\u05d5\u05d3\u05e2\u05ea WhatsApp \u05e0\u05e4\u05e8\u05d3\u05ea \u05dc\u05db\u05dc \u05de\u05d5\u05d6\u05de\u05df.</p></div><div id="finalizeOptions" class="detail-list"></div><button class="primary submit" id="confirmFinalize" type="button">\u05e1\u05d2\u05d9\u05e8\u05d4 \u05d5\u05e9\u05dc\u05d9\u05d7\u05ea \u05d6\u05d9\u05de\u05d5\u05e0\u05d9\u05dd</button>';
document.body.insertBefore(finalizeModal, $('#toast'));
const finalizeButton = document.createElement('button');
finalizeButton.type = 'button';
finalizeButton.id = 'openFinalize';
finalizeButton.className = 'primary submit hidden';
finalizeButton.textContent = '\u05e1\u05d2\u05d9\u05e8\u05ea \u05d1\u05d7\u05d9\u05e8\u05d4 \u05d5\u05e9\u05dc\u05d9\u05d7\u05ea \u05d6\u05d9\u05de\u05d5\u05e0\u05d9\u05dd';
$('#eventDetails').append(finalizeButton);
const api = '/.netlify/functions';
const ownedEventsKey = 'meetly-owned-events';
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

const show = (element) => { element.classList.remove('hidden'); backdrop.classList.remove('hidden'); };
const hide = () => { modal.classList.add('hidden'); responseModal.classList.add('hidden'); detailsModal.classList.add('hidden'); profileModal.classList.add('hidden'); authModal.classList.add('hidden'); inviteAccessModal.classList.add('hidden'); finalizeModal.classList.add('hidden'); backdrop.classList.add('hidden'); };
const toast = (message) => {
  const element = $('#toast');
  element.textContent = message;
  element.classList.remove('hidden');
  setTimeout(() => element.classList.add('hidden'), 3800);
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
    ? '\u05d1-iPhone: \u05dc\u05d7\u05e6\u05d5 \u05e2\u05dc \u05db\u05e4\u05ea\u05d5\u05e8 \u05e9\u05d9\u05ea\u05d5\u05e3 \u2190 \u201c\u05d4\u05d5\u05e1\u05e4\u05d4 \u05dc\u05de\u05e1\u05da \u05d4\u05d1\u05d9\u05ea\u201d.'
    : '\u05d1\u05d3\u05e4\u05d3\u05e4\u05df \u05d6\u05d4 \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05d5\u05e1\u05d9\u05e3 \u05dc\u05de\u05e1\u05da \u05d4\u05d1\u05d9\u05ea \u05de\u05ea\u05e4\u05e8\u05d9\u05d8 \u05d4\u05d3\u05e4\u05d3\u05e4\u05df.');
};
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));

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
  if (path === '/events' && method === 'GET') return MeetlyData.events();
  if (path === '/events' && method === 'POST') return (await MeetlyData.createEvent(JSON.parse(options.body)))[0];
  if (path.startsWith('/events?id=') && method === 'GET') { const id = new URLSearchParams(path.split('?')[1]).get('id'); const event = await MeetlyData.event(id); if (event) event.responses = await MeetlyData.responses(id); return event; }
  if (path.startsWith('/events?id=') && method === 'DELETE') { const id = new URLSearchParams(path.split('?')[1]).get('id'); return MeetlyData.deleteEvent(id); }
  if (path.startsWith('/events?id=') && method === 'PATCH') { const id = new URLSearchParams(path.split('?')[1]).get('id'); const body = JSON.parse(options.body); return (await MeetlyData.updateEvent(id, { final_selection: { index: body.selectedOptionIndex }, finalized_at: new Date().toISOString() }))[0]; }
  if (path === '/responses' && method === 'POST') { const body = JSON.parse(options.body); return MeetlyData.submitResponse(body.eventId, body.inviteToken, body.answers); }
  return netlifyRequest(path, options);
};

const savedIds = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const rememberId = (key, id) => {
  const ids = savedIds(key);
  if (!ids.includes(id)) localStorage.setItem(key, JSON.stringify([id, ...ids]));
};

const addEventToList = (event, target = '#ownedEvents', role = 'owner') => {
  const card = document.createElement('article');
  card.className = `event-card ${role === 'owner' ? 'featured' : ''}`;
  card.dataset.eventId = event.id;
  card.dataset.role = role;
  card.tabIndex = 0;
  if (target === '#ownedEvents') $('#emptyEvents')?.remove();
  const [dateValue, time] = event.options[0] || ['', ''];
  card.innerHTML = '<div class="card-top"><span class="status amber"></span><button type="button" class="delete-event" aria-label="Delete event">&times;</button></div><div class="date-badge"><b></b><span></span></div><h3></h3><p></p><div class="card-footer"><span></span></div>';
  card.querySelector('.status').textContent = role === 'owner' ? '\u05d0\u05ea/\u05d4 \u05d4\u05de\u05d0\u05e8\u05d2\u05df/\u05ea' : '\u05d4\u05d5\u05d6\u05de\u05e0\u05ea';
  if (role !== 'owner') card.querySelector('.delete-event').remove();
  card.querySelector('.date-badge b').textContent = dateValue.slice(-2);
  card.querySelector('.date-badge span').textContent = dateValue.slice(5, 7);
  card.querySelector('h3').textContent = event.title;
  card.querySelector('p').textContent = `${time} \u00b7 ${event.options.length} \u05d0\u05e4\u05e9\u05e8\u05d5\u05d9\u05d5\u05ea`;
  card.querySelector('.card-footer span').textContent = `${event.guests.length} \u05de\u05d5\u05d6\u05de\u05e0\u05d9\u05dd`;
  $(target).prepend(card);
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
      empty.textContent = '\u05e2\u05d3\u05d9\u05d9\u05df \u05d0\u05d9\u05df \u05d0\u05d9\u05e8\u05d5\u05e2\u05d9\u05dd \u05e9\u05d9\u05e6\u05e8\u05ea. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05ea\u05d7\u05d9\u05dc \u05d1\u05d9\u05e6\u05d9\u05e8\u05ea \u05d0\u05d9\u05e8\u05d5\u05e2 \u05d7\u05d3\u05e9.';
      $('#ownedEvents').append(empty);
    }
  } catch {
    toast('\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05d8\u05e2\u05d5\u05df \u05d0\u05ea \u05d4\u05d0\u05d9\u05e8\u05d5\u05e2\u05d9\u05dd.');
  }
};

$('#showAllEvents').onclick = async () => {
  if (!authUser) { show(authModal); return; }
  await loadEvents();
  $('#ownedEvents').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const defaultDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
wizardBack.textContent = '\u2192 \u05d7\u05d6\u05e8\u05d4';
const wizardNext = document.createElement('button');
wizardNext.type = 'button';
wizardNext.className = 'primary';
wizardNext.textContent = '\u05d4\u05de\u05e9\u05da \u2190';
const wizardSubmit = eventForm.querySelector('[type=submit]');
wizardActions.append(wizardBack, wizardNext, wizardSubmit);
eventForm.append(wizardActions);

const showWizardStep = (index) => {
  wizardStepIndex = index;
  wizardSteps.forEach((step, stepIndex) => { step.style.display = stepIndex === index ? 'grid' : 'none'; });
  wizardBack.classList.toggle('hidden', index === 0);
  wizardNext.classList.toggle('hidden', index === wizardSteps.length - 1);
  wizardSubmit.classList.toggle('hidden', index !== wizardSteps.length - 1);
  $('.step-pill').textContent = `\u05e9\u05dc\u05d1 ${index + 1} \u05de\u05ea\u05d5\u05da 3`;
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
  $('#deadline').value = defaultDeadline();
  showWizardStep(0);
  show(modal);
};
$('#profileButton').onclick = () => authUser ? show(profileModal) : show(authModal);

const applyProfile = () => {
  const accountName = authUser?.name || '';
  $('#profileName').textContent = accountName || '\u05d4\u05d2\u05d3\u05e8\u05ea \u05e4\u05e8\u05d5\u05e4\u05d9\u05dc';
  $('#profilePhone').textContent = profile?.phone || '\u05dc\u05d7\u05e6\u05d5 \u05dc\u05d4\u05d5\u05e1\u05e4\u05ea \u05d8\u05dc\u05e4\u05d5\u05df';
  $('#profileAvatar').textContent = accountName.slice(0, 1) || '\u05d9';
  $('#profileNameInput').value = accountName;
  $('#profilePhoneInput').value = profile?.phone || '';
  const greeting = $('#greeting');
  greeting.textContent = accountName ? `\u05d1\u05d5\u05e7\u05e8 \u05d8\u05d5\u05d1, ${accountName} ` : '\u05d1\u05e8\u05d5\u05db\u05d9\u05dd \u05d4\u05d1\u05d0\u05d9\u05dd ';
  const sparkle = document.createElement('span');
  sparkle.textContent = '\u2726';
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
  const row = document.createElement('div');
  row.className = 'time-row';
  row.innerHTML = '<input type="date" value="2026-07-23"><input type="time" value="11:00"><button type="button" class="remove-time">&times;</button>';
  $('#timeList').append(row);
};

$('#timeList').onclick = (event) => {
  if (event.target.classList.contains('remove-time') && $$('#timeList .time-row').length > 1) event.target.parentElement.remove();
};

const addGuestRow = () => {
  const row = document.createElement('div');
  row.className = 'time-row guest-row';
  row.innerHTML = '<input class="guest-name" placeholder="\u05e9\u05dd \u05de\u05dc\u05d0" aria-label="Guest name"><input class="guest-phone" type="tel" inputmode="tel" placeholder="\u05de\u05e1\u05e4\u05e8 \u05d8\u05dc\u05e4\u05d5\u05df" aria-label="Phone number"><input class="guest-email" type="email" placeholder="\u05db\u05ea\u05d5\u05d1\u05ea \u05d0\u05d9\u05de\u05d9\u05d9\u05dc" aria-label="Email address"><button type="button" class="remove-time remove-guest">&times;</button>';
  $('#guestList').append(row);
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
  contactButton.textContent = '\u25ce \u05d1\u05d7\u05d9\u05e8\u05d4 \u05de\u05d0\u05e0\u05e9\u05d9 \u05e7\u05e9\u05e8 \u05d1\u05d8\u05dc\u05e4\u05d5\u05df';
  $('#addGuest').before(contactButton);
  contactButton.onclick = async () => {
    try {
      const properties = await navigator.contacts.getProperties();
      const fields = ['name', 'tel'].filter((field) => properties.includes(field));
      if (!fields.includes('tel')) {
        toast('\u05d4\u05d3\u05e4\u05d3\u05e4\u05df \u05dc\u05d0 \u05de\u05d0\u05e4\u05e9\u05e8 \u05e9\u05d9\u05ea\u05d5\u05e3 \u05de\u05e1\u05e4\u05e8\u05d9 \u05d8\u05dc\u05e4\u05d5\u05df.');
        return;
      }
      const contacts = await navigator.contacts.select(fields, { multiple: true });
      contacts.forEach(addSelectedContact);
      if (contacts.length) toast(`\u05e0\u05d5\u05e1\u05e4\u05d5 ${contacts.length} \u05d0\u05e0\u05e9\u05d9 \u05e7\u05e9\u05e8.`);
    } catch (error) {
      if (error?.name !== 'AbortError') toast('\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05d1\u05d7\u05d5\u05e8 \u05d0\u05e0\u05e9\u05d9 \u05e7\u05e9\u05e8.');
    }
  };
}

const inviteUrlFor = (eventData, guest) => `${location.origin}/?event=${encodeURIComponent(eventData.id)}&invite=${encodeURIComponent(guest.inviteToken)}#respond`;
const sendAvailabilityInvite = (eventData, guest) => {
  if (!guest.phone) return;
  const otherParticipants = Math.max(eventData.guests.length - 1, 0);
  const message = `\u05d4\u05d5\u05d6\u05de\u05e0\u05ea \u05dc\u05ea\u05d9\u05d0\u05d5\u05dd \u05e4\u05d2\u05d9\u05e9\u05d4 \u05e2\u05dc-\u05d9\u05d3\u05d9 ${eventData.organizer.name}\n\u05d8\u05dc\u05e4\u05d5\u05df: ${eventData.organizer.phone}\n\n\u05d1\u05d9\u05d7\u05d3 \u05e2\u05dd \u05e2\u05d5\u05d3 ${otherParticipants} \u05de\u05e9\u05ea\u05ea\u05e4\u05d9\u05dd\n\u05d1\u05e0\u05d5\u05e9\u05d0: ${eventData.title}\n\n\u05d0\u05e0\u05d0 \u05d4\u05e7\u05e9/\u05d9 \u05dc\u05d1\u05d7\u05d9\u05e8\u05ea \u05d6\u05de\u05df \u05de\u05ea\u05d0\u05d9\u05dd:\n${inviteUrlFor(eventData, guest)}`;
  window.open(`https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
};
const sendEmailInvite = (eventData, guest) => {
  if (!guest.email) return;
  const subject = `\u05d4\u05d6\u05de\u05e0\u05d4 \u05dc\u05ea\u05d9\u05d0\u05d5\u05dd \u05e4\u05d2\u05d9\u05e9\u05d4: ${eventData.title}`;
  const body = `\u05e9\u05dc\u05d5\u05dd ${guest.name},\n\n\u05d4\u05d5\u05d6\u05de\u05e0\u05ea \u05dc\u05ea\u05d9\u05d0\u05d5\u05dd \u05e4\u05d2\u05d9\u05e9\u05d4 \u05e2\u05dc-\u05d9\u05d3\u05d9 ${eventData.organizer.name}.\n\u05e0\u05d5\u05e9\u05d0: ${eventData.title}\n\n\u05dc\u05d1\u05d7\u05d9\u05e8\u05ea \u05d6\u05de\u05df \u05de\u05ea\u05d0\u05d9\u05dd:\n${inviteUrlFor(eventData, guest)}`;
  location.href = `mailto:${encodeURIComponent(guest.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
const sendReminder = (eventData, guest) => {
  const message = `\u05ea\u05d6\u05db\u05d5\u05e8\u05ea \u05e7\u05d8\u05e0\u05d4 \ud83d\ude4f\n\u05e2\u05d3\u05d9\u05d9\u05df \u05e0\u05e9\u05de\u05e8\u05d4 \u05d4\u05d1\u05d7\u05d9\u05e8\u05d4 \u05e9\u05dc\u05da \u05dc\u05ea\u05d9\u05d0\u05d5\u05dd \u05d4\u05e4\u05d2\u05d9\u05e9\u05d4 \u05d1\u05e0\u05d5\u05e9\u05d0: ${eventData.title}\n\n\u05d0\u05e0\u05d0 \u05d4\u05e7\u05e9/\u05d9 \u05dc\u05d1\u05d7\u05d9\u05e8\u05ea \u05d6\u05de\u05df \u05de\u05ea\u05d0\u05d9\u05dd:\n${inviteUrlFor(eventData, guest)}`;
  window.open(`https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
};
const sendFinalInvite = (eventData, guest) => {
  if (!guest.phone) return;
  const [date, time] = eventData.finalSelection.option;
  const message = `\u05e4\u05d2\u05d9\u05e9\u05d4 \u05e0\u05e7\u05d1\u05e2\u05d4!\n\n\u05e0\u05d5\u05e9\u05d0: ${eventData.title}\n\u05de\u05d5\u05e2\u05d3: ${date} \u05d1\u05e9\u05e2\u05d4 ${time}\n\u05de\u05e9\u05da: ${eventData.duration}\n\u05de\u05d0\u05e8\u05d2\u05df/\u05ea: ${eventData.organizer.name}\n\u05d8\u05dc\u05e4\u05d5\u05df: ${eventData.organizer.phone}`;
  window.open(`https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
};
const meetingMinutes = (duration) => {
  if (String(duration).includes('\u05e9\u05e2\u05d4')) return 60;
  const value = Number(String(duration).match(/\d+/)?.[0]);
  return Number.isFinite(value) && value > 0 ? value : 60;
};
const calendarStamp = (date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`;
const addToCalendar = (eventData) => {
  const [date, time] = eventData.finalSelection.option;
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + meetingMinutes(eventData.duration) * 60 * 1000);
  const guests = eventData.guests.map((guest) => guest.name).join(', ');
  const query = new URLSearchParams({
    action: 'TEMPLATE', text: eventData.title,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    details: `\u05de\u05d0\u05e8\u05d2\u05df/\u05ea: ${eventData.organizer.name}\n\u05d8\u05dc\u05e4\u05d5\u05df: ${eventData.organizer.phone}\n\u05de\u05e9\u05ea\u05ea\u05e4\u05d9\u05dd: ${guests}`,
    ctz: 'Asia/Jerusalem'
  });
  window.open(`https://calendar.google.com/calendar/render?${query.toString()}`, '_blank', 'noopener');
};

$('#eventForm').onsubmit = async (event) => {
  event.preventDefault();
  const title = $('#eventName').value.trim();
  const organizer = { ...profile, name: authUser?.name || profile?.name || '' };
  const guests = [...$$('.guest-row')].map((row) => ({
    name: row.querySelector('.guest-name').value.trim(),
    phone: row.querySelector('.guest-phone').value.trim().replace(/\D/g, '').replace(/^0/, '972'),
    email: row.querySelector('.guest-email').value.trim()
  })).filter((guest) => guest.name || guest.phone || guest.email);
  const options = [...$$('#timeList .time-row')].map((row) => [
    row.querySelector('[type=date]').value,
    row.querySelector('[type=time]').value
  ]);

  if (!title || !organizer.name || !organizer.phone || guests.some((guest) => !guest.name || (!guest.phone && !guest.email))) {
    toast('\u05d9\u05e9 \u05dc\u05de\u05dc\u05d0 \u05e9\u05dd \u05d5\u05d8\u05dc\u05e4\u05d5\u05df \u05d0\u05d5 \u05d0\u05d9\u05de\u05d9\u05d9\u05dc \u05dc\u05db\u05dc \u05de\u05d5\u05d6\u05de\u05df.');
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
    rememberId(ownedEventsKey, createdEvent.id);
    addEventToList(createdEvent);
    hide();
    createdEvent.guests.forEach((guest) => {
      if (guest.phone) sendAvailabilityInvite(createdEvent, guest);
      if (guest.email) sendEmailInvite(createdEvent, guest);
    });
    toast(`\u05d4\u05d0\u05d9\u05e8\u05d5\u05e2 \u05e0\u05e9\u05de\u05e8. \u05e0\u05e4\u05ea\u05d7\u05d4 \u05d4\u05d6\u05de\u05e0\u05d4 \u05e0\u05e4\u05e8\u05d3\u05ea \u05dc\u05db\u05dc ${createdEvent.guests.length} \u05de\u05d5\u05d6\u05de\u05e0\u05d9\u05dd.`);
  } catch {
    toast('\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05e9\u05de\u05d5\u05e8 \u05d0\u05ea \u05d4\u05d0\u05d9\u05e8\u05d5\u05e2. \u05e0\u05e1\u05d4/\u05d9 \u05e9\u05d5\u05d1.');
  } finally {
    submitButton.disabled = false;
  }
};

const renderChoices = () => {
  $('#choiceList').innerHTML = choices.map(([date, time]) => {
    const parsed = new Date(`${date}T12:00:00`);
    const readable = Number.isNaN(parsed.getTime()) ? { day: date, number: '', month: '' } : {
      day: new Intl.DateTimeFormat('he-IL', { weekday: 'short' }).format(parsed),
      number: new Intl.DateTimeFormat('he-IL', { day: 'numeric' }).format(parsed),
      month: new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(parsed)
    };
    return `<div class="choice"><div class="choice-date"><span>${readable.day}</span><b>${readable.number}</b><span>${readable.month}</span></div><div class="choice-main"><b>${time}</b><span>משך הפגישה: ${activeEvent?.duration || ''}</span><div class="toggle"><button class="yes" data-answer="yes">✓ מתאים לי</button><button class="no" data-answer="no">לא מתאים</button></div></div></div>`;
  }).join('');
  $('#answerCount').textContent = `0/${choices.length}`;
};

const setResponseHeader = (eventData) => {
  $('.response-header h2').textContent = eventData.title || '';
  const info = $$('.meeting-info span');
  if (info[0]) info[0].textContent = `\u25f7 ${eventData.duration || ''}`;
  if (info[1]) info[1].textContent = `\u2659 \u05de\u05d0\u05ea ${eventData.organizer?.name || ''}`;
};
const openResponse = () => { renderChoices(); show(responseModal); };
$('#openEvent')?.addEventListener('click', openResponse);

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
  $('#finalizeOptions').innerHTML = '';
  eventData.options.forEach((option, index) => {
    const available = responses.filter((response) => response.answers[index]?.answer === 'yes').length;
    const label = document.createElement('label');
    label.innerHTML = '<div></div>';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'final-option'; input.value = String(index);
    input.checked = eventData.finalSelection?.index === index || (!eventData.finalSelection && index === 0);
    label.querySelector('div').textContent = `${option[0]} \u00b7 ${option[1]} \u2014 ${available} \u05d9\u05db\u05d5\u05dc\u05d9\u05dd/\u05d5\u05ea`;
    label.prepend(input);
    $('#finalizeOptions').append(label);
  });
  show(finalizeModal);
};

finalizeButton.onclick = () => { if (activeEvent) openFinalize(activeEvent); };
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
    finalized.guests.forEach((guest) => {
      if (guest.phone) sendFinalInvite(finalized, guest);
      if (guest.email) sendEmailInvite(finalized, guest);
    });
    addToCalendar(finalized);
    hide();
    openEventDetails(finalized, true);
    toast('\u05d4\u05d1\u05d7\u05d9\u05e8\u05d4 \u05e0\u05e1\u05d2\u05e8\u05d4. \u05e0\u05e4\u05ea\u05d7 \u05d6\u05d9\u05de\u05d5\u05df \u05e0\u05e4\u05e8\u05d3 \u05dc\u05db\u05dc \u05de\u05d5\u05d6\u05de\u05df.');
  } catch (error) {
    toast(error.message || '\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05e1\u05d2\u05d5\u05e8 \u05d0\u05ea \u05d4\u05d1\u05d7\u05d9\u05e8\u05d4.');
  } finally { button.disabled = false; }
};

$('#detailGuests').onclick = (event) => {
  const button = event.target.closest('[data-send]');
  if (!button || !activeEvent) return;
  const guest = activeEvent.guests.find((item) => item.id === button.dataset.guestId);
  if (!guest) return;
  if (button.dataset.send === 'email') { sendEmailInvite(activeEvent, guest); return; }
  button.dataset.action === 'reminder' ? sendReminder(activeEvent, guest) : sendAvailabilityInvite(activeEvent, guest);
};

const openEventDetails = (eventData, ownerView = Boolean(authUser && eventData.ownerId === authUser.id)) => {
  activeEvent = eventData.id ? eventData : null;
  choices = eventData.options;
  $('#detailTitle').textContent = eventData.title;
  $('#detailDuration').innerHTML = '';
  const durationItem = document.createElement('div');
  durationItem.textContent = eventData.duration || '\u05e4\u05e8\u05d8\u05d9 \u05d4\u05de\u05e9\u05da \u05dc\u05d0 \u05d6\u05de\u05d9\u05e0\u05d9\u05dd';
  $('#detailDuration').append(durationItem);
  $('#detailOptions').innerHTML = '';
  eventData.options.forEach(([date, time]) => {
    const item = document.createElement('div');
    item.textContent = `${date} · ${time}`;
    $('#detailOptions').append(item);
  });
  $('#detailGuests').innerHTML = '';
  const guests = eventData.guests || [];
  const responses = eventData.responses || [];
  const isOwner = ownerView;
  $('#detailGuestsTab').classList.toggle('hidden', !isOwner);
  $('#detailStatsTab').classList.toggle('hidden', !isOwner);
  $('#openResponseFromDetails').classList.toggle('hidden', Boolean(isOwner));
  finalizeButton.classList.toggle('hidden', !isOwner);
  finalizeButton.textContent = isOwner && eventData.finalSelection
    ? '\u05e2\u05d3\u05db\u05d5\u05df \u05d4\u05de\u05d5\u05e2\u05d3 \u05d5\u05e9\u05dc\u05d9\u05d7\u05d4 \u05de\u05d7\u05d3\u05e9'
    : '\u05e1\u05d2\u05d9\u05e8\u05ea \u05d1\u05d7\u05d9\u05e8\u05d4 \u05d5\u05e9\u05dc\u05d9\u05d7\u05ea \u05d6\u05d9\u05de\u05d5\u05e0\u05d9\u05dd';
  setDetailsTab('details');
  if (isOwner) {
    const responded = responses.length;
    const stats = $('#detailStats');
    stats.innerHTML = '';
    const summary = document.createElement('div');
    summary.textContent = `\u05d4\u05e9\u05d9\u05d1\u05d5: ${responded}/${guests.length} · \u05de\u05de\u05ea\u05d9\u05e0\u05d9\u05dd: ${guests.length - responded}`;
    stats.append(summary);
    if (eventData.finalSelection?.option) {
      const finalItem = document.createElement('div');
      finalItem.textContent = `\u05de\u05d5\u05e2\u05d3 \u05e0\u05d1\u05d7\u05e8: ${eventData.finalSelection.option[0]} \u00b7 ${eventData.finalSelection.option[1]}`;
      stats.append(finalItem);
    }
    eventData.options.forEach((option, index) => {
      const available = responses.filter((response) => response.answers[index]?.answer === 'yes').length;
      const item = document.createElement('div');
      item.textContent = `${option[0]} · ${option[1]} — ${available} \u05d9\u05db\u05d5\u05dc\u05d9\u05dd/\u05d5\u05ea`;
      stats.append(item);
    });
  }
  if (!guests.length) $('#detailGuests').textContent = '\u05d0\u05d9\u05df \u05e4\u05e8\u05d8\u05d9 \u05de\u05d5\u05d6\u05de\u05e0\u05d9\u05dd';
  guests.forEach((guest) => {
    const item = document.createElement('div');
    const response = responses.find((savedResponse) => savedResponse.guestId === guest.id);
    item.textContent = `${guest.name} · ${response ? '\u05d4\u05e9\u05d9\u05d1/\u05d4' : '\u05d8\u05e8\u05dd \u05d4\u05e9\u05d9\u05d1/\u05d4'}`;
    if (guest.phone) item.append(document.createElement('br'), `\u05d8\u05dc\u05e4\u05d5\u05df: ${guest.phone}`);
    if (guest.email) item.append(document.createElement('br'), `\u05d0\u05d9\u05de\u05d9\u05d9\u05dc: ${guest.email}`);
    if (isOwner) {
      if (guest.phone) {
        const phoneButton = document.createElement('button');
        phoneButton.type = 'button'; phoneButton.className = 'text-button'; phoneButton.dataset.guestId = guest.id;
        phoneButton.dataset.send = 'phone'; phoneButton.dataset.action = response ? 'resend' : 'reminder';
        phoneButton.textContent = response ? '\u05e9\u05dc\u05d7 \u05e9\u05d5\u05d1 \u05dc\u05d8\u05dc\u05e4\u05d5\u05df' : '\u05e9\u05dc\u05d7 \u05ea\u05d6\u05db\u05d5\u05e8\u05ea \u05dc\u05d8\u05dc\u05e4\u05d5\u05df';
        item.append(' ', phoneButton);
      }
      if (guest.email) {
        const emailButton = document.createElement('button');
        emailButton.type = 'button'; emailButton.className = 'text-button'; emailButton.dataset.guestId = guest.id;
        emailButton.dataset.send = 'email'; emailButton.textContent = '\u05e9\u05dc\u05d7 \u05e9\u05d5\u05d1 \u05d1\u05d0\u05d9\u05de\u05d9\u05d9\u05dc';
        item.append(' ', emailButton);
      }
    }
    $('#detailGuests').append(item);
  });
  show(detailsModal);
};

const openSavedEvent = async (eventId) => {
  try {
    openEventDetails(await apiRequest(`/events?id=${encodeURIComponent(eventId)}`), true);
  } catch {
    toast('\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05d8\u05e2\u05d5\u05df \u05d0\u05ea \u05d4\u05d0\u05d9\u05e8\u05d5\u05e2.');
  }
};

$('#ownedEvents').onclick = (event) => {
  const card = event.target.closest('.event-card');
  if (!card) return;
  if (event.target.classList.contains('delete-event')) {
    event.stopPropagation();
    if (!card.dataset.eventId) {
      toast('\u05e0\u05d9\u05ea\u05df \u05dc\u05de\u05d7\u05d5\u05e7 \u05e8\u05e7 \u05d0\u05d9\u05e8\u05d5\u05e2\u05d9\u05dd \u05e9\u05e0\u05e9\u05de\u05e8\u05d5.');
      return;
    }
    if (!window.confirm('\u05dc\u05de\u05d7\u05d5\u05e7 \u05d0\u05ea \u05d4\u05d0\u05d9\u05e8\u05d5\u05e2?')) return;
    apiRequest(`/events?id=${encodeURIComponent(card.dataset.eventId)}`, { method: 'DELETE' })
      .then(() => { card.remove(); localStorage.setItem(ownedEventsKey, JSON.stringify(savedIds(ownedEventsKey).filter((id) => id !== card.dataset.eventId))); toast('\u05d4\u05d0\u05d9\u05e8\u05d5\u05e2 \u05e0\u05de\u05d7\u05e7.'); })
      .catch(() => toast('\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05de\u05d7\u05d5\u05e7 \u05d0\u05ea \u05d4\u05d0\u05d9\u05e8\u05d5\u05e2.'));
    return;
  }
  if (card.dataset.eventId) {
    openSavedEvent(card.dataset.eventId);
    return;
  }
  openEventDetails({ title: card.querySelector('h3').textContent, options: choices, guests: [] }, true);
};

$('#ownedEvents').onkeydown = (event) => {
  if (event.key === 'Enter' && event.target.classList.contains('event-card')) event.target.click();
};
$('#invitedGrid').onclick = $('#ownedEvents').onclick;
$('#invitedGrid').onkeydown = $('#ownedEvents').onkeydown;
$('#openResponseFromDetails').onclick = () => {
  $('.response-header h2').textContent = $('#detailTitle').textContent;
  detailsModal.classList.add('hidden');
  openResponse();
};
$('#choiceList').onclick = (event) => {
  if (!event.target.dataset.answer) return;
  const group = event.target.parentElement;
  group.querySelectorAll('button').forEach((button) => button.classList.remove('selected'));
  event.target.classList.add('selected');
  $('#answerCount').textContent = `${$$('#choiceList .selected').length}/${choices.length}`;
};

$('#saveResponse').onclick = async () => {
  const answers = [...$$('#choiceList .toggle')].map((toggle, index) => ({ option: choices[index], answer: toggle.querySelector('.selected')?.dataset.answer || null }));
  if (activeEvent) {
    try {
      await apiRequest('/responses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: activeEvent.id, inviteToken: activeInviteToken, answers }) });
    } catch {
      toast('\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05e9\u05de\u05d5\u05e8 \u05d0\u05ea \u05d4\u05d1\u05d7\u05d9\u05e8\u05d4.');
      return;
    }
  }
  hide();
  toast('\u05d4\u05d1\u05d7\u05d9\u05e8\u05d4 \u05e0\u05e9\u05de\u05e8\u05d4.');
};

const loadInvitation = async () => {
  const eventId = new URLSearchParams(location.search).get('event');
  activeInviteToken = new URLSearchParams(location.search).get('invite');
  if (!eventId || !activeInviteToken || location.hash !== '#respond') return false;
  try {
    activeEvent = await apiRequest(`/events?id=${encodeURIComponent(eventId)}&invite=${encodeURIComponent(activeInviteToken)}`);
    const saved = JSON.parse(localStorage.getItem(invitedEventsKey) || '[]');
    if (!saved.some((item) => item.id === activeEvent.id && item.invite === activeInviteToken)) localStorage.setItem(invitedEventsKey, JSON.stringify([{ id: activeEvent.id, invite: activeInviteToken }, ...saved]));
    choices = activeEvent.options;
    setResponseHeader(activeEvent);
    openResponse();
    return true;
  } catch {
    toast('\u05d4\u05d4\u05d6\u05de\u05e0\u05d4 \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0\u05d4.');
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
  const events = await Promise.all(invitations.map((item) => apiRequest(`/events?id=${encodeURIComponent(item.id)}&invite=${encodeURIComponent(item.invite)}`).catch(() => null)));
  events.filter(Boolean).reverse().forEach((event) => addEventToList(event, '#invitedGrid', 'invitee'));
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
  $('#authSubmit').textContent = signupMode ? '\u05d9\u05e6\u05d9\u05e8\u05ea \u05d7\u05e9\u05d1\u05d5\u05df' : '\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea';
  $('#authToggle').textContent = signupMode ? '\u05db\u05d1\u05e8 \u05d9\u05e9 \u05dc\u05d9 \u05d7\u05e9\u05d1\u05d5\u05df' : '\u05dc\u05d9\u05e6\u05d9\u05e8\u05ea \u05d7\u05e9\u05d1\u05d5\u05df \u05d7\u05d3\u05e9';
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
      toast('\u05e0\u05e9\u05dc\u05d7 \u05d0\u05d9\u05de\u05d5\u05ea \u05dc\u05d3\u05d5\u05d0\u05f4\u05dc. \u05dc\u05d7\u05e6\u05d5 \u05e2\u05dc \u05d4\u05e7\u05d9\u05e9\u05d5\u05e8 \u05d5\u05d0\u05d6 \u05d4\u05ea\u05d7\u05d1\u05e8\u05d5.');
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
    toast(error.message || '\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05d4\u05ea\u05d7\u05d1\u05e8.');
  } finally { submit.disabled = false; }
};

const init = async () => {
  renderAuthMode();
  applyProfile();
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
      toast(error.message || '\u05d4\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea \u05e2\u05dd Google \u05e0\u05db\u05e9\u05dc\u05d4.');
    }
  }
  if (!authUser) { authUser = window.MeetlyData?.currentUser() || null; if (!authUser) { try { authUser = (await apiRequest('/auth')).user; } catch { authUser = null; } } }
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
