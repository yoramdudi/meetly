// Data adapter for the GitHub Pages version of Meetly.
// It uses only the publishable Supabase key; access is enforced by RLS.
window.MeetlyData = (() => {
  const { url, publishableKey } = window.MEETLY_SUPABASE;
  const headers = { apikey: publishableKey, 'content-type': 'application/json' };
  const pendingInviteKey = 'meetly-pending-invite';
  const sessionKey = 'meetly-supabase-session';
  const readSession = () => { try { return JSON.parse(localStorage.getItem(sessionKey) || 'null'); } catch { return null; } };
  const writeSession = (data) => localStorage.setItem(sessionKey, JSON.stringify(data));
  const clearSession = () => localStorage.removeItem(sessionKey);

  // Access tokens expire after about an hour. Without this the app kept sending the
  // dead token and every call failed with a generic "could not load" message, even
  // though a usable refresh token was sitting in storage the whole time.
  let refreshing = null;
  const refreshSession = () => {
    if (refreshing) return refreshing;
    const current = readSession();
    if (!current?.refresh_token) return Promise.resolve(null);
    refreshing = fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers, body: JSON.stringify({ refresh_token: current.refresh_token })
    }).then(async (response) => {
      if (!response.ok) throw new Error('refresh failed');
      const data = await response.json();
      writeSession({ ...current, ...data });
      return data;
    }).catch(() => {
      // The refresh token is gone or revoked: the session is genuinely over.
      clearSession();
      adapter.onSessionExpired?.();
      return null;
    }).finally(() => { refreshing = null; });
    return refreshing;
  };

  const request = async (path, options = {}, allowRetry = true) => {
    const session = readSession();
    const response = await fetch(`${url}${path}`, { ...options, headers: { ...headers, ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}), ...(options.headers || {}) } });
    if (response.status === 401 && allowRetry && session?.refresh_token && !path.startsWith('/auth/v1/token')) {
      const refreshed = await refreshSession();
      if (refreshed) return request(path, options, false);
    }
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Request failed');
    return response.status === 204 ? null : response.json();
  };

  // Postgres columns are snake_case; the UI reads camelCase. Mapping in one place
  // keeps the rest of the app from silently reading undefined fields.
  const mapEvent = (row) => {
    if (!row) return row;
    const options = row.options || [];
    const selection = row.final_selection ?? row.finalSelection ?? null;
    const index = selection?.index;
    return {
      ...row,
      id: row.id,
      title: row.title,
      options,
      guests: row.guests || [],
      organizer: row.organizer || {},
      duration: row.duration,
      deadline: row.deadline,
      ownerId: row.owner_id ?? row.ownerId ?? null,
      finalizedAt: row.finalized_at ?? row.finalizedAt ?? null,
      // `option` is derived from the stored index so the two can never drift apart.
      finalSelection: Number.isInteger(index) && options[index]
        ? { index, option: options[index] }
        : null,
      // Only invited_event returns this: the answers this specific guest already saved.
      myAnswers: row.my_answers ?? row.myAnswers ?? null,
      responses: (row.responses || []).map(mapResponse)
    };
  };
  const mapResponse = (row) => row && ({ ...row, guestId: row.guest_id ?? row.guestId ?? null, eventId: row.event_id ?? row.eventId ?? null, answers: row.answers || [] });
  const firstRow = (rows) => (Array.isArray(rows) ? rows[0] : rows);

  const adapter = {
    // Assigned by app.js so an expired session reopens the login screen instead of
    // surfacing as an unexplained failure.
    onSessionExpired: null,
    signUp: (email, password, name) => request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data: { name } }) }),
    signIn: async (email, password) => { const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }); writeSession(data); return data.user; },
    signOut: async () => {
      const session = readSession();
      // Best effort: revoke server-side, but clear locally even if the call fails.
      if (session?.access_token) {
        await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: { ...headers, authorization: `Bearer ${session.access_token}` } }).catch(() => {});
      }
      clearSession();
    },
    signInWithGoogle: () => {
      // The invite token lives in the fragment, and the implicit OAuth flow returns its
      // own payload in that same fragment — so the deep-link has to be parked here and
      // put back afterwards. Cleared on a plain sign-in too, so an abandoned invite
      // login cannot leak into it.
      const invite = MeetlyLib.parseInviteFragment(location.hash) ? location.hash : '';
      if (invite) sessionStorage.setItem(pendingInviteKey, invite);
      else sessionStorage.removeItem(pendingInviteKey);
      const returnTo = `${location.origin}${location.pathname}`;
      location.href = `${url}/auth/v1/authorize?provider=google&flow_type=implicit&redirect_to=${encodeURIComponent(returnTo)}`;
    },
    finishGoogleLogin: async () => {
      const params = new URLSearchParams(location.hash.slice(1));
      const access_token = params.get('access_token');
      if (!access_token) return null;
      const refresh_token = params.get('refresh_token');
      const user = await request('/auth/v1/user', { headers: { authorization: `Bearer ${access_token}` } });
      writeSession({ access_token, refresh_token, user });
      const pendingInvite = sessionStorage.getItem(pendingInviteKey);
      sessionStorage.removeItem(pendingInviteKey);
      // Restore the invite fragment, or just drop the OAuth token payload out of the
      // address bar. Either way the access token must not be left sitting in the URL.
      history.replaceState(null, '', `${location.pathname}${location.search}${pendingInvite || ''}`);
      return user;
    },
    currentUser: () => readSession()?.user || null,
    events: () => request('/rest/v1/events?select=*&order=created_at.desc').then((rows) => (rows || []).map(mapEvent)),
    event: (id) => request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}&select=*`).then((rows) => mapEvent(firstRow(rows))),
    responses: (eventId) => request(`/rest/v1/responses?event_id=eq.${encodeURIComponent(eventId)}&select=*`).then((rows) => (rows || []).map(mapResponse)),
    createEvent: (event) => request('/rest/v1/events', { method: 'POST', headers: { prefer: 'return=representation' }, body: JSON.stringify({ title:event.title, options:event.options, guests:event.guests, organizer:event.organizer, duration:event.duration, deadline:event.deadline }) }).then((rows) => mapEvent(firstRow(rows))),
    updateEvent: (id, event) => request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { prefer: 'return=representation' }, body: JSON.stringify(event) }).then((rows) => mapEvent(firstRow(rows))),
    deleteEvent: (id) => request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
    // Invitees are anonymous, so RLS blocks a plain select — the event must come
    // back through the token-checking RPC instead.
    invitedEvent: (eventId, inviteToken) => request('/rest/v1/rpc/invited_event', { method: 'POST', body: JSON.stringify({ p_event_id: eventId, p_invite_token: inviteToken }) }).then((rows) => mapEvent(firstRow(rows))),
    submitResponse: (eventId, inviteToken, answers) => request('/rest/v1/rpc/submit_response', { method: 'POST', body: JSON.stringify({ p_event_id: eventId, p_invite_token: inviteToken, p_answers: answers }) })
  };
  return adapter;
})();
