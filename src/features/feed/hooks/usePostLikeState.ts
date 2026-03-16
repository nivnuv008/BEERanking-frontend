import { useState } from 'react';
import { togglePostLike, type FeedPost } from '../api/feedApi';

export type LikeState = {
  liked: boolean;
  likeCount: number;
};

function buildLikeState(post: FeedPost): LikeState {
  return {
    liked: Boolean(post.likedByCurrentUser),
    likeCount: post.likeCount,
  };
}

export function usePostLikeState(posts: FeedPost[]) {
  const [likeStateById, setLikeStateById] = useState<Record<string, LikeState>>(() => {
    const initialState: Record<string, LikeState> = {};

    posts.forEach((post) => {
      initialState[post._id] = buildLikeState(post);
    });

    return initialState;
  });
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);

  const syncPosts = (nextPosts: FeedPost[], reset = false) => {
    setLikeStateById((current) => {
      const nextState = reset ? {} : { ...current };

      nextPosts.forEach((post) => {
        nextState[post._id] = reset ? buildLikeState(post) : (current[post._id] ?? buildLikeState(post));
      });

      return nextState;
    });
  };

  const toggleLike = async (post: FeedPost) => {
    const currentLikeState = likeStateById[post._id] ?? buildLikeState(post);
    const optimisticLiked = !currentLikeState.liked;
    const optimisticLikeCount = Math.max(0, currentLikeState.likeCount + (optimisticLiked ? 1 : -1));

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
      setLikeStateById((current) => ({
        ...current,
        [post._id]: {
          liked: response.liked,
          likeCount: response.likeCount,
        },
      }));
    } catch {
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