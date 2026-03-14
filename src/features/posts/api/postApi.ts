import { API_BASE_URL, parseJsonResponse } from '../../../shared/api/apiClient';
import { fetchWithAuth } from '../../auth/api/authApi';
import type { FeedPost } from '../../feed/api/feedApi';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export type CreatedPost = FeedPost;

type BackendPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type BackendPaginatedResponse<T> = {
  data: T[];
  pagination: BackendPagination;
};

type CreatePostResponse = {
  message: string;
  data: CreatedPost;
};

type UpdatePostResponse = {
  message: string;
  data: FeedPost;
};

type DeletePostResponse = {
  message: string;
};

type CreatePostPayload = {
  imageFile: File;
  rating: number;
  beerId?: string | null;
  description: string;
};

type UpdatePostPayload = {
  imageFile?: File | null;
  rating?: number;
  description?: string;
};

export type PostPagingParams = {
  skip?: number;
  limit?: number;
};

export type PostPageResult = {
  items: FeedPost[];
  total: number;
  nextSkip: number;
  hasMore: boolean;
};

function resolveBackendAssetUrl(path?: string | null): string {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }

  if (!path.startsWith('/')) {
    return path;
  }

  if (BACKEND_BASE_URL) {
    return `${BACKEND_BASE_URL.replace(/\/$/, '')}${path}`;
  }

  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    const apiUrl = new URL(API_BASE_URL);
    return `${apiUrl.origin}${path}`;
  }

  return path;
}

function normalizePost(post: FeedPost): FeedPost {
  return {
    ...post,
    image: resolveBackendAssetUrl(post.image),
    likeCount: Number.isFinite(post.likeCount) ? post.likeCount : 0,
    commentCount: Number.isFinite(post.commentCount) ? post.commentCount : 0,
  };
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

  const data = await parseJsonResponse<CreatePostResponse>(response);

  return {
    ...data,
    data: normalizePost(data.data),
  };
}

export async function getMyPosts(params: PostPagingParams = {}): Promise<PostPageResult> {
  const skip = Math.max(0, params.skip ?? 0);
  const limit = Math.max(1, params.limit ?? 6);
  const page = Math.floor(skip / limit) + 1;

  const response = await fetchWithAuth(`${API_BASE_URL}/posts/me?page=${page}&limit=${limit}`);
  const payload = await parseJsonResponse<BackendPaginatedResponse<FeedPost>>(response, 'Failed to load your posts');
  const items = Array.isArray(payload.data) ? payload.data.map(normalizePost) : [];
  const total = payload.pagination?.total ?? items.length;
  const nextSkip = skip + items.length;

  return {
    items,
    total,
    nextSkip,
    hasMore: nextSkip < total,
  };
}

export async function updatePost(postId: string, payload: UpdatePostPayload): Promise<UpdatePostResponse> {
  const formData = new FormData();

  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  }

  if (payload.rating !== undefined) {
    formData.append('rating', String(payload.rating));
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description.trim());
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    body: formData,
  });

  const data = await parseJsonResponse<UpdatePostResponse>(response, 'Failed to update post');

  return {
    ...data,
    data: normalizePost(data.data),
  };
}

export async function deletePost(postId: string): Promise<DeletePostResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });

  return parseJsonResponse<DeletePostResponse>(response, 'Failed to delete post');
}