const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_REDIRECT_PATH = import.meta.env.VITE_AUTH_REDIRECT_PATH || '/';

async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Authentication request failed');
  }

  return data;
}

export function signUp(payload) {
  return postJson('/auth/signup', payload);
}

export function signIn(payload) {
  return postJson('/auth/signin', payload);
}

export function signUpWithGoogle(googleToken) {
  return postJson('/auth/signup/google', { googleToken });
}

export function signInWithGoogle(googleToken) {
  return postJson('/auth/signin/google', { googleToken });
}

export function persistAuthSession(authResponse) {
  if (!authResponse) {
    return;
  }

  const { token, refreshToken, user } = authResponse;

  if (token) {
    localStorage.setItem('token', token);
  }

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function getAuthRedirectPath() {
  return AUTH_REDIRECT_PATH;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}
