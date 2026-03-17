import {
  API_BASE_URL,
  BackendPaginatedResponse,
  PageResult,
  PagingParams,
  parseJsonResponse,
  toPageRequest,
  toPageResult,
} from "../../../shared/api/apiClient";
import type { FeedPost } from "../types/post";
import { fetchWithAuth } from "../../auth/api/authApi";
import { normalizePost } from "./postsApiShared";

export type CreatedPost = FeedPost;

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

export type PostPagingParams = PagingParams;

export type PostPageResult = PageResult<FeedPost>;

export async function createPost(
  payload: CreatePostPayload,
): Promise<CreatePostResponse> {
  const formData = new FormData();
  formData.append("image", payload.imageFile);
  formData.append("rating", String(payload.rating));

  if (payload.beerId) {
    formData.append("beer", payload.beerId);
  }

  formData.append("description", payload.description.trim());

  const response = await fetchWithAuth(`${API_BASE_URL}/posts`, {
    method: "POST",
    body: formData,
  });

  const data = await parseJsonResponse<CreatePostResponse>(response);

  return {
    ...data,
    data: normalizePost(data.data),
  };
}

export async function getMyPosts(
  params: PostPagingParams = {},
): Promise<PostPageResult> {
  const { skip, limit, page } = toPageRequest(params, 6);

  const response = await fetchWithAuth(
    `${API_BASE_URL}/posts/me?page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<BackendPaginatedResponse<FeedPost>>(
    response,
    "Failed to load your posts",
  );

  return toPageResult(payload, skip, normalizePost);
}

export async function updatePost(
  postId: string,
  payload: UpdatePostPayload,
): Promise<UpdatePostResponse> {
  const formData = new FormData();

  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  if (payload.rating !== undefined) {
    formData.append("rating", String(payload.rating));
  }

  if (payload.description !== undefined) {
    formData.append("description", payload.description.trim());
  }

  const response = await fetchWithAuth(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}`,
    {
      method: "PATCH",
      body: formData,
    },
  );

  const data = await parseJsonResponse<UpdatePostResponse>(
    response,
    "Failed to update post",
  );

  return {
    ...data,
    data: normalizePost(data.data),
  };
}

export async function deletePost(postId: string): Promise<DeletePostResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}`,
    {
      method: "DELETE",
    },
  );

  return parseJsonResponse<DeletePostResponse>(
    response,
    "Failed to delete post",
  );
}
