import { getAuthToken, setStoredUser } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export type Beer = {
  _id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  description?: string;
};

export type UserProfile = {
  _id: string;
  username: string;
  email: string;
  profilePic?: string | null;
  favoriteBeers: Beer[];
};

type UserUpdatePayload = {
  username: string;
  favoriteBeerIds: string[];
  profilePhotoFile?: File | null;
};

type UpdateProfileResponse = {
  message: string;
  user: UserProfile;
};

type ErrorResponse = {
  error?: string;
  message?: string;
};

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();

  if (!token) {
    throw new Error('You need to sign in again');
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as ErrorResponse | null;
    throw new Error(errorData?.error || errorData?.message || 'Request failed');
  }

  return data as T;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: getAuthHeaders()
  });

  const user = await parseJsonResponse<UserProfile>(response);
  setStoredUser(user);
  return user;
}

export async function updateCurrentUserProfile(payload: UserUpdatePayload): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('username', payload.username.trim());
  formData.append('favoriteBeers', JSON.stringify(payload.favoriteBeerIds));

  if (payload.profilePhotoFile) {
    formData.append('profilePic', payload.profilePhotoFile);
  }

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: formData
  });

  const data = await parseJsonResponse<UpdateProfileResponse>(response);
  setStoredUser(data.user);
  return data.user;
}

export async function searchBeers(query: string): Promise<Beer[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/beers/search/ai?q=${encodeURIComponent(normalizedQuery)}`);
  const data = await parseJsonResponse<Beer[] | { data?: Beer[] }>(response);

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.data) ? data.data : [];
}

export function getProfileImageUrl(profilePic?: string | null): string | null {
  if (!profilePic) {
    return null;
  }

  if (/^https?:\/\//i.test(profilePic)) {
    return profilePic;
  }

  if (profilePic.startsWith('/')) {
    if (BACKEND_BASE_URL) {
      return `${BACKEND_BASE_URL.replace(/\/$/, '')}${profilePic}`;
    }

    if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
      const apiUrl = new URL(API_BASE_URL);
      return `${apiUrl.origin}${profilePic}`;
    }

    return profilePic;
  }

  return profilePic;
}