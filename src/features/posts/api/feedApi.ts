import { API_BASE_URL, parseJsonResponse } from "../../../shared/api/apiClient";
import type { FeedComment, FeedPost } from "../types/post";
import { fetchWithAuth, getAuthToken } from "../../auth/api/authApi";
export type { FeedBeer, FeedComment, FeedPost, FeedUser } from "../types/post";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

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

type ToggleLikeResponse = {
  message: string;
  liked: boolean;
  likeCount: number;
};

type CreateCommentResponse = {
  message: string;
  data: FeedComment;
};

export type FeedPageResult = {
  items: FeedPost[];
  total: number;
  nextSkip: number;
  hasMore: boolean;
};

export type FeedCommentsResult = {
  items: FeedComment[];
  total: number;
  nextSkip: number;
  hasMore: boolean;
};

export type FeedPagingParams = {
  skip?: number;
  limit?: number;
};

async function fetchFeedResource(input: string): Promise<Response> {
  return getAuthToken() ? fetchWithAuth(input) : fetch(input);
}

function resolveBackendAssetUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  if (!path.startsWith("/")) {
    return path;
  }

  if (BACKEND_BASE_URL) {
    return `${BACKEND_BASE_URL.replace(/\/$/, "")}${path}`;
  }

  if (
    API_BASE_URL.startsWith("http://") ||
    API_BASE_URL.startsWith("https://")
  ) {
    const apiUrl = new URL(API_BASE_URL);
    return `${apiUrl.origin}${path}`;
  }

  return path;
}

function normalizeFeedPost(post: FeedPost): FeedPost {
  return {
    ...post,
    image: resolveBackendAssetUrl(post.image),
    likeCount: Number.isFinite(post.likeCount) ? post.likeCount : 0,
    commentCount: Number.isFinite(post.commentCount) ? post.commentCount : 0,
    likedByCurrentUser: Boolean(post.likedByCurrentUser),
  };
}

export async function getFeedPosts(
  params: FeedPagingParams = {},
): Promise<FeedPageResult> {
  const skip = Math.max(0, params.skip ?? 0);
  const limit = Math.max(1, params.limit ?? 6);
  const page = Math.floor(skip / limit) + 1;

  const response = await fetchFeedResource(
    `${API_BASE_URL}/posts?page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<BackendPaginatedResponse<FeedPost>>(
    response,
    "Failed to load feed",
  );
  const items = Array.isArray(payload.data)
    ? payload.data.map(normalizeFeedPost)
    : [];
  const total = payload.pagination?.total ?? items.length;
  const nextSkip = skip + items.length;

  return {
    items,
    total,
    nextSkip,
    hasMore: nextSkip < total,
  };
}

export async function getFeedPostById(
  postId: string,
): Promise<FeedPost | null> {
  const response = await fetchFeedResource(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}`,
  );
  const payload = await parseJsonResponse<FeedPost>(
    response,
    "Failed to load post",
  );
  return normalizeFeedPost(payload);
}

export async function togglePostLike(
  postId: string,
): Promise<ToggleLikeResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}/like`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  return parseJsonResponse<ToggleLikeResponse>(
    response,
    "Failed to update like",
  );
}

export async function getPostComments(
  postId: string,
  params: FeedPagingParams = {},
): Promise<FeedCommentsResult> {
  const skip = Math.max(0, params.skip ?? 0);
  const limit = Math.max(1, params.limit ?? 20);
  const page = Math.floor(skip / limit) + 1;

  const response = await fetch(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}/comments?page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<
    BackendPaginatedResponse<FeedComment>
  >(response, "Failed to load comments");
  const items = Array.isArray(payload.data) ? payload.data : [];
  const total = payload.pagination?.total ?? items.length;
  const nextSkip = skip + items.length;

  return {
    items,
    total,
    nextSkip,
    hasMore: nextSkip < total,
  };
}

export async function createPostComment(
  postId: string,
  text: string,
): Promise<FeedComment> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
      }),
    },
  );

  const payload = await parseJsonResponse<CreateCommentResponse>(
    response,
    "Failed to add comment",
  );
  return payload.data;
}
