import { API_BASE_URL, parseJsonResponse } from '../../../shared/api/apiClient';
import type { Beer } from '../../../shared/api/beerApi';
import { fetchWithAuth, setStoredUser } from '../../auth/api/authApi';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

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

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);

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

  const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    body: formData
  });

  const data = await parseJsonResponse<UpdateProfileResponse>(response);
  setStoredUser(data.user);
  return data.user;
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