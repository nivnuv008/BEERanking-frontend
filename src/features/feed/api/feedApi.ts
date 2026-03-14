import { API_BASE_URL, parseJsonResponse } from '../../../shared/api/apiClient';
import { fetchWithAuth, getAuthToken, getStoredUser, type StoredUser } from '../../auth/api/authApi';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export type FeedUser = {
  _id: string;
  username: string;
  profilePic?: string | null;
};

export type FeedBeer = {
  _id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
};

export type FeedPost = {
  _id: string;
  image: string;
  rating: number;
  description: string;
  createdAt: string;
  updatedAt?: string;
  user: FeedUser;
  beer?: FeedBeer | null;
  likes?: Array<string | { _id?: string | null }>;
  likeCount: number;
  commentCount: number;
};

export type FeedComment = {
  _id: string;
  text: string;
  createdAt: string;
  user: FeedUser;
};

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

export type FeedPageResult = {
  items: FeedPost[];
  total: number;
  nextSkip: number;
  hasMore: boolean;
};

export type FeedCommentsResult = {
  items: FeedComment[];
  total: number;
  source: 'api' | 'mock';
};

export type FeedPagingParams = {
  skip?: number;
  limit?: number;
};

// TODO: Remove the frontend liked-state fallback after the backend feed endpoints
// return either +likes or likedByCurrentUser for authenticated post reads.
async function fetchFeedResource(input: string): Promise<Response> {
  return getAuthToken() ? fetchWithAuth(input) : fetch(input);
}

const mockCommentsByPostId: Record<string, FeedComment[]> = {
  'mock-post-1': [
    { _id: 'comment-1', text: 'That finish sounds sharp in the best way.', createdAt: '2026-03-12T20:48:00.000Z', user: { _id: 'user-c-1', username: 'lagerline' } },
    { _id: 'comment-2', text: 'Need the brewery name pinned. I am hunting this one down.', createdAt: '2026-03-12T20:44:00.000Z', user: { _id: 'user-c-2', username: 'barstool' } },
    { _id: 'comment-3', text: 'Photo alone sold me.', createdAt: '2026-03-12T20:40:00.000Z', user: { _id: 'user-c-3', username: 'maltdraft' } },
    { _id: 'comment-4', text: 'Five is aggressive but I respect it.', createdAt: '2026-03-12T20:36:00.000Z', user: { _id: 'user-c-4', username: 'yeastfile' } },
  ],
  'mock-post-2': [
    { _id: 'comment-5', text: 'Espresso edge on a porter usually works for me.', createdAt: '2026-03-12T18:22:00.000Z', user: { _id: 'user-c-5', username: 'nighttap' } },
    { _id: 'comment-6', text: 'Would like to know if it drinks sweet or dry.', createdAt: '2026-03-12T18:19:00.000Z', user: { _id: 'user-c-6', username: 'foamfile' } },
  ],
  'mock-post-5': [
    { _id: 'comment-7', text: 'A dry pils is hard to beat.', createdAt: '2026-03-10T19:24:00.000Z', user: { _id: 'user-c-7', username: 'crispmode' } },
    { _id: 'comment-8', text: 'This is the exact kind of note I want in the feed.', createdAt: '2026-03-10T19:19:00.000Z', user: { _id: 'user-c-8', username: 'tapreview' } },
    { _id: 'comment-9', text: 'Looks like a beer I would order twice.', createdAt: '2026-03-10T19:13:00.000Z', user: { _id: 'user-c-9', username: 'grainlight' } },
  ],
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

function normalizeFeedPost(post: FeedPost): FeedPost {
  return {
    ...post,
    image: resolveBackendAssetUrl(post.image),
    likeCount: Number.isFinite(post.likeCount) ? post.likeCount : 0,
    commentCount: Number.isFinite(post.commentCount) ? post.commentCount : 0,
  };
}

function getMockComments(postId: string): FeedCommentsResult {
  const explicitComments = mockCommentsByPostId[postId];

  if (explicitComments) {
    return {
      items: explicitComments,
      total: explicitComments.length,
      source: 'mock',
    };
  }

  const fallback = [
    {
      _id: `${postId}-fallback-comment-1`,
      text: 'Comments are still mocked in the frontend until the backend flow is finalized.',
      createdAt: '2026-03-13T09:00:00.000Z',
      user: { _id: 'mock-comment-user-1', username: 'systemtap' },
    },
    {
      _id: `${postId}-fallback-comment-2`,
      text: 'The screen is ready, so later we only need to swap the data source.',
      createdAt: '2026-03-13T08:55:00.000Z',
      user: { _id: 'mock-comment-user-2', username: 'qafoam' },
    },
  ];

  return {
    items: fallback,
    total: fallback.length,
    source: 'mock',
  };
}

export function createLocalComment(postId: string, text: string): FeedComment {
  const user = getStoredUser<StoredUser>();
  const createdComment: FeedComment = {
    _id: `${postId}-local-comment-${Date.now()}`,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    user: {
      _id: user?._id ?? 'local-user',
      username: user?.username?.trim() || 'You',
      profilePic: user?.profilePic ?? null,
    },
  };

  const existingComments = mockCommentsByPostId[postId] ?? [];
  mockCommentsByPostId[postId] = [createdComment, ...existingComments];
  return createdComment;
}

export async function getFeedPosts(params: FeedPagingParams = {}): Promise<FeedPageResult> {
  const skip = Math.max(0, params.skip ?? 0);
  const limit = Math.max(1, params.limit ?? 6);
  const page = Math.floor(skip / limit) + 1;

  const response = await fetchFeedResource(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`);
  const payload = await parseJsonResponse<BackendPaginatedResponse<FeedPost>>(response, 'Failed to load feed');
  const items = Array.isArray(payload.data) ? payload.data.map(normalizeFeedPost) : [];
  const total = payload.pagination?.total ?? items.length;
  const nextSkip = skip + items.length;

  return {
    items,
    total,
    nextSkip,
    hasMore: nextSkip < total,
  };
}

export async function getFeedPostById(postId: string): Promise<FeedPost | null> {
  const response = await fetchFeedResource(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}`);
  const payload = await parseJsonResponse<FeedPost>(response, 'Failed to load post');
  return normalizeFeedPost(payload);
}

export async function togglePostLike(postId: string): Promise<ToggleLikeResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  return parseJsonResponse<ToggleLikeResponse>(response, 'Failed to update like');
}

export async function getPostComments(postId: string): Promise<FeedCommentsResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/comments?page=1&limit=20`);
    const payload = await parseJsonResponse<BackendPaginatedResponse<FeedComment>>(response, 'Failed to load comments');

    if (Array.isArray(payload.data) && payload.data.length > 0) {
      return {
        items: payload.data,
        total: payload.pagination?.total ?? payload.data.length,
        source: 'api',
      };
    }
  } catch {
    return getMockComments(postId);
  }

  return getMockComments(postId);
}