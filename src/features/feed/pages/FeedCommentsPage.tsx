import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAuthToken } from '../../auth/api/authApi';
import { getProfileImageUrl } from '../../profile/api/profileApi';
import { createLocalComment, getFeedPostById, getPostComments, type FeedComment, type FeedPost } from '../api/feedApi';
import PostCard from '../components/PostCard';
import { usePostLikeState } from '../hooks/usePostLikeState';
import '../styles/FeedPage.css';

type FeedCommentsLocationState = {
  post?: FeedPost;
  returnTo?: string;
  returnLabel?: string;
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

function FeedCommentsPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  const locationState = location.state as FeedCommentsLocationState | null;
  const locationPost = locationState?.post ?? null;
  const returnTo = locationState?.returnTo ?? '/feed';
  const returnLabel = locationState?.returnLabel ?? 'Back to feed';
  const [post, setPost] = useState<FeedPost | null>(locationPost);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [error, setError] = useState('');
  const { likeStateById, likeBusyId, syncPosts, toggleLike } = usePostLikeState(post ? [post] : []);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!postId) {
      navigate('/feed', { replace: true });
      return;
    }

    const loadScreen = async () => {
      try {
        setIsLoading(true);
        const [resolvedPost, resolvedComments] = await Promise.all([
          locationPost ?? getFeedPostById(postId),
          getPostComments(postId),
        ]);

        if (!resolvedPost) {
          navigate('/feed', { replace: true });
          return;
        }

        setPost(resolvedPost);
        syncPosts(resolvedPost ? [resolvedPost] : [], true);
        setComments(resolvedComments.items);
        setError('');
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load comments screen';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadScreen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, postId]);

  if (isLoading) {
    return (
      <section className="feed-comments-page" aria-label="Post comments page">
        <div className="feed-comments-page__backdrop" />
        <div className="feed-comments-page__shell container-fluid position-relative p-3">
          <div className="feed-surface-card text-center">Loading comments...</div>
        </div>
      </section>
    );
  }

  const handleAddComment = () => {
    if (!postId) {
      setError('Post id is missing');
      return;
    }

    const normalizedText = commentText.trim();

    if (!normalizedText) {
      setError('Comment text is required');
      setCommentMessage('');
      return;
    }

    const createdComment = createLocalComment(postId, normalizedText);
    setComments((current) => [createdComment, ...current]);
    setCommentText('');
    setCommentMessage('Comment added locally until backend comments are ready.');
    setError('');
  };

  return (
    <section className="feed-comments-page" aria-label="Post comments page">
      <div className="feed-comments-page__backdrop" />
      <div className="feed-comments-page__shell container-fluid position-relative p-3">
        <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 mb-3">
          <div>
            <p className="feed-comments-page__eyebrow">Post comments</p>
            <h1 className="feed-comments-page__headline">Conversation around the pour.</h1>
            <p className="feed-comments-page__subhead mb-0">Comments stay on a dedicated screen so the feed remains a clean scroll.</p>
          </div>

          <button type="button" className="btn feed-button-secondary" onClick={() => navigate(returnTo)}>
            {returnLabel}
          </button>
        </div>

        {error ? <div className="feed-surface-card feed-surface-card--danger mb-3" role="alert">{error}</div> : null}

        {post ? (
          <PostCard
            post={post}
            liked={likeStateById[post._id]?.liked ?? false}
            likeCount={likeStateById[post._id]?.likeCount ?? post.likeCount}
            likeDisabled={likeBusyId === post._id}
            onToggleLike={toggleLike}
          />
        ) : null}

        <section className="feed-surface-card mb-3" aria-label="Add comment">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
            <div>
              <p className="feed-comments-page__eyebrow mb-1">Add comment</p>
              <h2 className="feed-comments-page__composer-title">Join the thread.</h2>
            </div>
            <span className="small text-body-secondary">Stored locally for now</span>
          </div>

          <textarea
            className="form-control feed-textarea"
            rows={3}
            maxLength={5000}
            placeholder="What did you think about this beer?"
            value={commentText}
            onChange={(event) => {
              setCommentText(event.target.value);
              setCommentMessage('');
            }}
          />

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
            <span className="small text-body-secondary">{commentText.trim().length}/5000</span>
            <button type="button" className="btn feed-button-primary" onClick={handleAddComment}>
              Add comment
            </button>
          </div>

          {commentMessage ? <p className="small text-body-secondary mt-3 mb-0">{commentMessage}</p> : null}
        </section>

        <div className="d-grid gap-3">
          {comments.length ? comments.map((comment) => {
            const avatarUrl = getProfileImageUrl(comment.user.profilePic);

            return (
              <article key={comment._id} className="feed-comment-card p-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="feed-comment-card__avatar" aria-hidden="true">
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : getInitials(comment.user.username)}
                  </span>
                  <div>
                    <strong className="feed-comment-card__author-name">{comment.user.username}</strong>
                    <div className="feed-comment-card__timestamp">{formatDateTime(comment.createdAt)}</div>
                  </div>
                </div>
                <p className="feed-comment-card__text">{comment.text}</p>
              </article>
            );
          }) : <div className="feed-empty-state">No comments yet. The screen is ready for the real backend comments flow.</div>}
        </div>
      </div>
    </section>
  );
}

export default FeedCommentsPage;