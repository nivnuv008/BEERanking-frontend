import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Button from "react-bootstrap/Button";
import type { FeedPost } from "../types/post";
import { getProfileImageUrl } from "../../profile/api/profileApi";
import { togglePostLike } from "../api/feedApi";
import { formatDateTime, getInitials } from "../utils/postDisplay";

type PostCardProps = {
  post: FeedPost;
  commentDisabled?: boolean;
  onOpenComments?: (post: FeedPost) => void;
  footerActions?: ReactNode;
};

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="feed-card__action-icon"
    >
      <path
        d="M12 20.4 4.8 13.7a4.8 4.8 0 0 1 6.8-6.8L12 7.3l.4-.4a4.8 4.8 0 1 1 6.8 6.8L12 20.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="feed-card__action-icon"
    >
      <path
        d="M6 18.2 3.5 20V6.8A2.8 2.8 0 0 1 6.3 4h11.4a2.8 2.8 0 0 1 2.8 2.8v7.4a2.8 2.8 0 0 1-2.8 2.8H6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PostCard({
  post,
  commentDisabled = false,
  onOpenComments,
  footerActions,
}: PostCardProps) {
  const avatarUrl = getProfileImageUrl(post.user.profilePic);
  const [liked, setLiked] = useState(Boolean(post.likedByCurrentUser));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLikeBusy, setIsLikeBusy] = useState(false);

  useEffect(() => {
    setLiked(Boolean(post.likedByCurrentUser));
    setLikeCount(post.likeCount);
  }, [post._id, post.likedByCurrentUser, post.likeCount]);

  const handleToggleLike = async () => {
    if (isLikeBusy) {
      return;
    }

    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const optimisticLiked = !previousLiked;
    const optimisticLikeCount = Math.max(
      0,
      previousLikeCount + (optimisticLiked ? 1 : -1),
    );

    setIsLikeBusy(true);
    setLiked(optimisticLiked);
    setLikeCount(optimisticLikeCount);

    try {
      const response = await togglePostLike(post._id);
      setLiked(response.liked);
      setLikeCount(response.likeCount);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLikeBusy(false);
    }
  };

  return (
    <article className="feed-card">
      <div className="row g-0 align-items-stretch">
        <div className="col-lg-4">
          <div className="feed-card__media h-100">
            <img
              src={post.image}
              alt={`Post by ${post.user.username}`}
              className="feed-card__image"
            />
          </div>
        </div>

        <div className="col-lg-8">
          <div className="feed-card__body h-100 d-flex flex-column">
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="feed-card__avatar" aria-hidden="true">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" />
                  ) : (
                    getInitials(post.user.username)
                  )}
                </span>
                <div>
                  <strong className="feed-card__author-name">
                    {post.user.username}
                  </strong>
                  <div className="feed-card__timestamp">
                    {formatDateTime(post.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <section
              className="feed-card__beer-panel"
              aria-label="Beer details"
            >
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <span className="feed-card__beer-label">Beer</span>
                  <strong className="feed-card__beer-name">
                    {post.beer?.name ?? "Beer details pending"}
                  </strong>
                </div>
                <span className="feed-card__beer-score">
                  {post.rating.toFixed(1)} / 5
                </span>
              </div>

              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                <div className="col">
                  <div className="feed-card__detail-item h-100">
                    <span className="feed-card__detail-label">Brewery</span>
                    <strong>
                      {post.beer?.brewery ?? "Pending backend mapping"}
                    </strong>
                  </div>
                </div>
                <div className="col">
                  <div className="feed-card__detail-item h-100">
                    <span className="feed-card__detail-label">Style</span>
                    <strong>{post.beer?.style ?? "Unknown"}</strong>
                  </div>
                </div>
                <div className="col">
                  <div className="feed-card__detail-item h-100">
                    <span className="feed-card__detail-label">ABV</span>
                    <strong>
                      {post.beer ? `${post.beer.abv}%` : "Unknown"}
                    </strong>
                  </div>
                </div>
              </div>

              <p className="feed-card__description">{post.description}</p>
            </section>

            {onOpenComments || footerActions ? (
              <div className="feed-card__footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-auto pt-3">
                <div className="d-flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={liked ? "danger" : "outline-secondary"}
                    className={`feed-card__action-button rounded-pill px-4 fw-semibold${liked ? " feed-card__action--liked" : ""}`}
                    onClick={handleToggleLike}
                    disabled={isLikeBusy}
                    aria-pressed={liked}
                  >
                    <HeartIcon />
                    <span>
                      {liked ? "Liked" : "Like"} · {likeCount}
                    </span>
                  </Button>

                  {onOpenComments ? (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      className="feed-card__action-button rounded-pill px-4 fw-semibold"
                      onClick={() => onOpenComments(post)}
                      disabled={commentDisabled}
                    >
                      <CommentIcon />
                      <span>Comments · {post.commentCount}</span>
                    </Button>
                  ) : null}

                  {footerActions}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
