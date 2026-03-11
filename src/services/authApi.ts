const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_REDIRECT_PATH = import.meta.env.VITE_AUTH_REDIRECT_PATH || '/profile';
const SIGN_IN_PATH = '/';

let refreshRequest: Promise<string> | null = null;

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

type RefreshResponse = {
  token?: string;
  refreshToken?: string;
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

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function getAuthRedirectPath() {
  return AUTH_REDIRECT_PATH;
}

function setStoredTokens(token: string, refreshToken: string): void {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
}

function withAuthorizationHeader(token: string, headers?: HeadersInit): Headers {
  const normalizedHeaders = new Headers(headers);
  normalizedHeaders.set('Authorization', `Bearer ${token}`);
  return normalizedHeaders;
}

export async function refreshAuthToken(): Promise<string> {
  const storedRefreshToken = getRefreshToken();

  if (!storedRefreshToken) {
    return handleInvalidAuthSession();
  }

  if (!refreshRequest) {
    refreshRequest = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const payload = data as RefreshResponse | ErrorResponse | null;

      if (!response.ok) {
        const message = payload?.error || payload?.message || 'You need to sign in again';
        return handleInvalidAuthSession(message);
      }

      const token = payload?.token;
      const refreshToken = payload?.refreshToken;

      if (!token || !refreshToken) {
        return handleInvalidAuthSession('Authentication refresh failed');
      }

      setStoredTokens(token, refreshToken);
      return token;
    })().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

export async function fetchWithAuth(input: string, init: RequestInit = {}): Promise<Response> {
  const executeRequest = async (token: string) => {
    const headers = withAuthorizationHeader(token, init.headers);
    return fetch(input, {
      ...init,
      headers
    });
  };

  const currentToken = getAuthToken();
  const token = currentToken || (await refreshAuthToken());

  let response = await executeRequest(token);

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAuthToken();
  response = await executeRequest(refreshedToken);

  if (response.status === 401) {
    return handleInvalidAuthSession('You need to sign in again');
  }

  return response;
}

export function handleInvalidAuthSession(message = 'You need to sign in again'): never {
  logout();

  if (typeof window !== 'undefined' && window.location.pathname !== SIGN_IN_PATH) {
    window.location.replace(SIGN_IN_PATH);
  }

  throw new Error(message);
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}
