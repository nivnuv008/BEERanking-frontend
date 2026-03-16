import { resolveBackendAssetUrl } from "../../../shared/api/apiClient";
import type { FeedPost } from "../types/post";

type NormalizePostOptions = {
  coerceLikedByCurrentUser?: boolean;
};

export function normalizePost(
  post: FeedPost,
  options: NormalizePostOptions = {},
): FeedPost {
  const normalizedPost: FeedPost = {
    ...post,
    image: resolveBackendAssetUrl(post.image),
    likeCount: Number.isFinite(post.likeCount) ? post.likeCount : 0,
    commentCount: Number.isFinite(post.commentCount) ? post.commentCount : 0,
  };

  if (options.coerceLikedByCurrentUser) {
    return {
      ...normalizedPost,
      likedByCurrentUser: Boolean(post.likedByCurrentUser),
    };
  }

  return normalizedPost;
}
