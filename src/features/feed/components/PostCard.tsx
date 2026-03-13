import { getProfileImageUrl } from '../../profile/api/profileApi';
import type { FeedPost } from '../api/feedApi';

type PostCardProps = {
  post: FeedPost;
  liked: boolean;
  likeCount: number;
  likeDisabled?: boolean;
  commentDisabled?: boolean;
  onToggleLike?: (post: FeedPost) => void;
  onOpenComments?: (post: FeedPost) => void;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getInitials(username: string): string {
  return username
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="feed-card__action-icon">
      <path d="M12 20.4 4.8 13.7a4.8 4.8 0 0 1 6.8-6.8L12 7.3l.4-.4a4.8 4.8 0 1 1 6.8 6.8L12 20.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="feed-card__action-icon">
      <path d="M6 18.2 3.5 20V6.8A2.8 2.8 0 0 1 6.3 4h11.4a2.8 2.8 0 0 1 2.8 2.8v7.4a2.8 2.8 0 0 1-2.8 2.8H6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PostCard({ post, liked, likeCount, likeDisabled = false, commentDisabled = false, onToggleLike, onOpenComments }: PostCardProps) {
  const avatarUrl = getProfileImageUrl(post.user.profilePic);

  return (
    <article className="feed-card">
      <div className="row g-0 align-items-stretch">
        <div className="col-lg-4">
          <div className="feed-card__media h-100">
            <img src={post.image} alt={`Post by ${post.user.username}`} className="feed-card__image" />
          </div>
        </div>

        <div className="col-lg-8">
          <div className="feed-card__body h-100 d-flex flex-column">
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="feed-card__avatar" aria-hidden="true">
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : getInitials(post.user.username)}
                </span>
                <div>
                  <strong className="feed-card__author-name">{post.user.username}</strong>
                  <div className="feed-card__timestamp">{formatDateTime(post.createdAt)}</div>
                </div>
              </div>
            </div>

            <section className="feed-card__beer-panel" aria-label="Beer details">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <span className="feed-card__beer-label">Beer</span>
                  <strong className="feed-card__beer-name">{post.beer?.name ?? 'Beer details pending'}</strong>
                </div>
                <span className="feed-card__beer-score">{post.rating.toFixed(1)} / 5</span>
              </div>

              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                <div className="col">
                  <div className="feed-card__detail-item h-100">
                    <span className="feed-card__detail-label">Brewery</span>
                    <strong>{post.beer?.brewery ?? 'Pending backend mapping'}</strong>
                  </div>
                </div>
                <div className="col">
                  <div className="feed-card__detail-item h-100">
                    <span className="feed-card__detail-label">Style</span>
                    <strong>{post.beer?.style ?? 'Unknown'}</strong>
                  </div>
                </div>
                <div className="col">
                  <div className="feed-card__detail-item h-100">
                    <span className="feed-card__detail-label">ABV</span>
                    <strong>{post.beer ? `${post.beer.abv}%` : 'Unknown'}</strong>
                  </div>
                </div>
              </div>

              <p className="feed-card__description">{post.description}</p>
            </section>

            {(onToggleLike || onOpenComments) ? (
              <div className="feed-card__footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-auto pt-3">
                <div className="d-flex flex-wrap gap-3">
                  {onToggleLike ? (
                    <button
                      type="button"
                      className={`btn feed-button-secondary${liked ? ' feed-card__action--liked' : ''}`}
                      onClick={() => onToggleLike(post)}
                      disabled={likeDisabled}
                      aria-pressed={liked}
                    >
                      <HeartIcon />
                      <span>{liked ? 'Liked' : 'Like'} · {likeCount}</span>
                    </button>
                  ) : null}

                  {onOpenComments ? (
                    <button type="button" className="btn feed-button-secondary" onClick={() => onOpenComments(post)} disabled={commentDisabled}>
                      <CommentIcon />
                      <span>Comments · {post.commentCount}</span>
                    </button>
                  ) : null}
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