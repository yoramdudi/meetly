// Data adapter for the GitHub Pages version of Meetly.
// It uses only the publishable Supabase key; access is enforced by RLS.
window.MeetlyData = (() => {
  const { url, publishableKey } = window.MEETLY_SUPABASE;
  const headers = { apikey: publishableKey, 'content-type': 'application/json' };
  const request = async (path, options = {}) => {
    const session = JSON.parse(localStorage.getItem('meetly-supabase-session') || 'null');
    const response = await fetch(`${url}${path}`, { ...options, headers: { ...headers, ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}), ...(options.headers || {}) } });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Request failed');
    return response.status === 204 ? null : response.json();
  };
  return {
    signUp: (email, password, name) => request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data: { name } }) }),
    signIn: async (email, password) => { const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('meetly-supabase-session', JSON.stringify(data)); return data.user; },
    signOut: () => localStorage.removeItem('meetly-supabase-session'),
    signInWithGoogle: () => { location.href = `${url}/auth/v1/authorize?provider=google&flow_type=implicit&redirect_to=${encodeURIComponent('https://yoramdudi.github.io/meetly/')}`; },
    finishGoogleLogin: async () => {
      const params = new URLSearchParams(location.hash.slice(1));
      const access_token = params.get('access_token');
      if (!access_token) return null;
      const refresh_token = params.get('refresh_token');
      const user = await request('/auth/v1/user', { headers: { authorization: `Bearer ${access_token}` } });
      localStorage.setItem('meetly-supabase-session', JSON.stringify({ access_token, refresh_token, user }));
      history.replaceState(null, '', location.pathname + location.search);
      return user;
    },
    currentUser: () => JSON.parse(localStorage.getItem('meetly-supabase-session') || 'null')?.user || null,
    events: () => request('/rest/v1/events?select=*&order=created_at.desc'),
    event: (id) => request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}&select=*`).then((rows) => rows[0]),
    responses: (eventId) => request(`/rest/v1/responses?event_id=eq.${encodeURIComponent(eventId)}&select=*`),
    createEvent: (event) => request('/rest/v1/events', { method: 'POST', headers: { prefer: 'return=representation' }, body: JSON.stringify({ title:event.title, options:event.options, guests:event.guests, organizer:event.organizer, duration:event.duration, deadline:event.deadline }) }),
    updateEvent: (id, event) => request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { prefer: 'return=representation' }, body: JSON.stringify(event) }),
    deleteEvent: (id) => request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
    invitedEvent: (eventId, inviteToken) => request('/rest/v1/rpc/invited_event', { method: 'POST', body: JSON.stringify({ p_event_id: eventId, p_invite_token: inviteToken }) }),
    submitResponse: (eventId, inviteToken, answers) => request('/rest/v1/rpc/submit_response', { method: 'POST', body: JSON.stringify({ p_event_id: eventId, p_invite_token: inviteToken, p_answers: answers }) })
  };
})();
