import {
  API_BASE_URL,
  BackendPaginatedResponse,
  PageResult,
  PagingParams,
  parseJsonResponse,
  toPageRequest,
  toPageResult,
} from "../../../shared/api/apiClient";
import type { FeedComment, FeedPost } from "../types/post";
import { fetchWithAuth, getAuthToken } from "../../auth/api/authApi";
import { normalizePost } from "./postsApiShared";
export type { FeedBeer, FeedComment, FeedPost, FeedUser } from "../types/post";

type ToggleLikeResponse = {
  message: string;
  liked: boolean;
  likeCount: number;
};

type CreateCommentResponse = {
  message: string;
  data: FeedComment;
};

export type FeedPageResult = PageResult<FeedPost>;

export type FeedCommentsResult = PageResult<FeedComment>;

export type FeedPagingParams = PagingParams;

async function fetchFeedResource(input: string): Promise<Response> {
  return getAuthToken() ? fetchWithAuth(input) : fetch(input);
}

export async function getFeedPosts(
  params: FeedPagingParams = {},
): Promise<FeedPageResult> {
  const { skip, limit, page } = toPageRequest(params, 6);

  const response = await fetchFeedResource(
    `${API_BASE_URL}/posts?page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<BackendPaginatedResponse<FeedPost>>(
    response,
    "Failed to load feed",
  );

  return toPageResult(payload, skip, (post) =>
    normalizePost(post, { coerceLikedByCurrentUser: true }),
  );
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
  return normalizePost(payload, { coerceLikedByCurrentUser: true });
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
  const { skip, limit, page } = toPageRequest(params, 20);

  const response = await fetch(
    `${API_BASE_URL}/posts/${encodeURIComponent(postId)}/comments?page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<
    BackendPaginatedResponse<FeedComment>
  >(response, "Failed to load comments");

  return toPageResult(payload, skip);
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
