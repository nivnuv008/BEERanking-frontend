import { API_BASE_URL, parseJsonResponse } from '../../../shared/api/apiClient';
import { fetchWithAuth } from '../../auth/api/authApi';

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