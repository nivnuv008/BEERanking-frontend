import { fetchWithAuth } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type CreatedPost = {
  _id: string;
  image: string;
  rating: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

type CreatePostResponse = {
  message: string;
  data: CreatedPost;
};

type CreatePostPayload = {
  imageFile: File;
  rating: number;
  beerId?: string | null;
  description: string;
};

type ErrorResponse = {
  error?: string;
  message?: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as ErrorResponse | null;
    const message = errorData?.error || errorData?.message || 'Request failed';

    throw new Error(message);
  }

  return data as T;
}

export async function createPost(payload: CreatePostPayload): Promise<CreatePostResponse> {
  const formData = new FormData();
  formData.append('image', payload.imageFile);
  formData.append('rating', String(payload.rating));

  if (payload.beerId) {
    formData.append('beer', payload.beerId);
  }

  formData.append('description', payload.description.trim());

  const response = await fetchWithAuth(`${API_BASE_URL}/posts`, {
    method: 'POST',
    body: formData
  });

  return parseJsonResponse<CreatePostResponse>(response);
}