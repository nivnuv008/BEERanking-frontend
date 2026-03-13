import { useMemo, useState } from 'react';
import { getStoredUser } from '../../auth/api/authApi';
import { togglePostLike, type FeedPost } from '../api/feedApi';

// TODO: Remove this localStorage fallback after the backend returns likedByCurrentUser
// or a reliable likes payload on feed/post reads.
const FEED_LIKES_STORAGE_KEY = 'beeranking.feed.likes';

type StoredUser = {
  _id?: string;
};

export type LikeState = {
  liked: boolean;
  likeCount: number;
};

function readPersistedLikes(userId: string | null): Record<string, boolean> {
  if (!userId) {
    return {};
  }

  const rawValue = localStorage.getItem(FEED_LIKES_STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, Record<string, boolean>>;
    return parsed[userId] ?? {};
  } catch {
    return {};
  }
}

function writePersistedLikes(userId: string | null, likes: Record<string, boolean>): void {
  if (!userId) {
    return;
  }

  const rawValue = localStorage.getItem(FEED_LIKES_STORAGE_KEY);
  let parsed: Record<string, Record<string, boolean>> = {};

  if (rawValue) {
    try {
      parsed = JSON.parse(rawValue) as Record<string, Record<string, boolean>>;
    } catch {
      parsed = {};
    }
  }

  parsed[userId] = likes;
  localStorage.setItem(FEED_LIKES_STORAGE_KEY, JSON.stringify(parsed));
}

function resolvePostLikedFromPayload(post: FeedPost, currentUserId: string | null): boolean | null {
  if (!currentUserId || !Array.isArray(post.likes)) {
    return null;
  }

  return post.likes.some((likeEntry) => {
    if (typeof likeEntry === 'string') {
      return likeEntry === currentUserId;
    }

    return likeEntry?._id === currentUserId;
  });
}

function buildLikeState(post: FeedPost, currentUserId: string | null, persistedLikes: Record<string, boolean>): LikeState {
  const likedFromPayload = resolvePostLikedFromPayload(post, currentUserId);
  const liked = persistedLikes[post._id] ?? likedFromPayload ?? false;

  return {
    liked,
    likeCount: post.likeCount,
  };
}

export function usePostLikeState(posts: FeedPost[]) {
  const currentUserId = getStoredUser<StoredUser>()?._id ?? null;
  const persistedLikes = useMemo(() => readPersistedLikes(currentUserId), [currentUserId]);
  const [likeStateById, setLikeStateById] = useState<Record<string, LikeState>>(() => {
    const initialState: Record<string, LikeState> = {};

    posts.forEach((post) => {
      initialState[post._id] = buildLikeState(post, currentUserId, persistedLikes);
    });

    return initialState;
  });
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);

  const syncPosts = (nextPosts: FeedPost[], reset = false) => {
    const latestPersistedLikes = readPersistedLikes(currentUserId);

    setLikeStateById((current) => {
      const nextState = reset ? {} : { ...current };

      nextPosts.forEach((post) => {
        nextState[post._id] = current[post._id] ?? buildLikeState(post, currentUserId, latestPersistedLikes);
      });

      return nextState;
    });
  };

  const toggleLike = async (post: FeedPost) => {
    const persisted = readPersistedLikes(currentUserId);
    const currentLikeState = likeStateById[post._id] ?? buildLikeState(post, currentUserId, persisted);
    const optimisticLiked = !currentLikeState.liked;
    const optimisticLikeCount = Math.max(0, currentLikeState.likeCount + (optimisticLiked ? 1 : -1));

    writePersistedLikes(currentUserId, {
      ...persisted,
      [post._id]: optimisticLiked,
    });

    setLikeBusyId(post._id);
    setLikeStateById((current) => ({
      ...current,
      [post._id]: {
        liked: optimisticLiked,
        likeCount: optimisticLikeCount,
      },
    }));

    try {
      const response = await togglePostLike(post._id);
      writePersistedLikes(currentUserId, {
        ...readPersistedLikes(currentUserId),
        [post._id]: response.liked,
      });
      setLikeStateById((current) => ({
        ...current,
        [post._id]: {
          liked: response.liked,
          likeCount: response.likeCount,
        },
      }));
    } catch {
      writePersistedLikes(currentUserId, {
        ...readPersistedLikes(currentUserId),
        [post._id]: currentLikeState.liked,
      });
      setLikeStateById((current) => ({
        ...current,
        [post._id]: currentLikeState,
      }));
    } finally {
      setLikeBusyId(null);
    }
  };

  return {
    likeStateById,
    likeBusyId,
    syncPosts,
    toggleLike,
  };
}