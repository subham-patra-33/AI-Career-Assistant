// Lightweight client-side auth helpers.
// NOTE: this only controls what the UI *shows*. The real security boundary
// is the backend — every protected route/API call must also verify the
// JWT server-side. Hiding a button in the UI never stops a direct API call.

export function isAuthed() {
  return !!localStorage.getItem('token');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
}
