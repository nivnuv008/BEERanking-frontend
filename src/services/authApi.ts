const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_REDIRECT_PATH = import.meta.env.VITE_AUTH_REDIRECT_PATH || '/profile';

type AuthUser = Record<string, unknown>;

type AuthResponse = {
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
};

type SignUpPayload = {
  username: string;
  email: string;
  password: string;
};

type SignInPayload = {
  username: string;
  password: string;
};

type ErrorResponse = {
  error?: string;
  message?: string;
};

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as ErrorResponse | null;
    throw new Error(errorData?.error || errorData?.message || 'Authentication request failed');
  }

  return data as T;
}

export function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/signup', payload);
}

export function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/signin', payload);
}

export function signUpWithGoogle(googleToken: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/signup/google', { googleToken });
}

export function signInWithGoogle(googleToken: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/signin/google', { googleToken });
}

export function persistAuthSession(authResponse: AuthResponse | null | undefined): void {
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

export function getStoredUser<T = AuthUser>(): T | null {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null | undefined): void {
  if (!user) {
    localStorage.removeItem('user');
    return;
  }

  localStorage.setItem('user', JSON.stringify(user));
}

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function getAuthRedirectPath() {
  return AUTH_REDIRECT_PATH;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}
