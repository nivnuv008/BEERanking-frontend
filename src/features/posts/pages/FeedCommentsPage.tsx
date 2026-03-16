import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { getProfileImageUrl } from "../../profile/api/profileApi";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { useInfiniteScroll } from "../../../shared/hooks/useInfiniteScroll";
import { mergeById } from "../../../shared/utils/mergeById";
import type { FeedComment, FeedPost } from "../types/post";
import {
  createPostComment,
  getFeedPostById,
  getPostComments,
} from "../api/feedApi";
import PostCard from "../components/PostCard";
import "../styles/FeedPage.css";
import { formatDateTime, getInitials } from "../utils/postDisplay";

const PAGE_SIZE = 20;

type FeedCommentsLocationState = {
  post?: FeedPost;
  returnTo?: string;
  returnLabel?: string;
};
function FeedCommentsPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  const locationState = location.state as FeedCommentsLocationState | null;
  const locationPost = locationState?.post ?? null;
  const returnTo = locationState?.returnTo ?? "/feed";
  const returnLabel = locationState?.returnLabel ?? "Back to feed";
  const [post, setPost] = useState<FeedPost | null>(locationPost);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [nextSkip, setNextSkip] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!postId) {
      navigate("/feed", { replace: true });
      return;
    }

    const loadScreen = async () => {
      try {
        setIsLoading(true);
        const [resolvedPost, initialComments] = await Promise.all([
          locationPost ?? getFeedPostById(postId),
          getPostComments(postId, { skip: 0, limit: PAGE_SIZE }),
        ]);

        if (!resolvedPost) {
          navigate("/feed", { replace: true });
          return;
        }

        setPost(resolvedPost);
        setComments(initialComments.items);
        setNextSkip(initialComments.nextSkip);
        setTotalComments(initialComments.total);
        setHasMore(initialComments.hasMore);
        setError("");
      } catch (loadError: unknown) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load comments screen";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, postId]);

  const loadMoreComments = async () => {
    if (!postId || isLoading || isLoadingMore || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getPostComments(postId, {
        skip: nextSkip,
        limit: PAGE_SIZE,
      });

      setComments((currentComments) =>
        mergeById(currentComments, result.items),
      );
      setNextSkip(result.nextSkip);
      setTotalComments(result.total);
      setHasMore(result.hasMore);
      setError("");
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load more comments";
      setError(message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const { sentinelRef } = useInfiniteScroll({
    enabled: !isLoading && !isLoadingMore && hasMore && !error,
    onIntersect: loadMoreComments,
  });

  if (isLoading) {
    return (
      <section className="feed-comments-page" aria-label="Post comments page">
        <div className="feed-comments-page__backdrop" />
        <div className="feed-comments-page__shell container-fluid position-relative p-3">
          <Card className="feed-surface-card text-center border-0">
            <Card.Body className="d-flex flex-column align-items-center gap-3">
              <Spinner animation="border" role="status" />
              <span>Loading comments...</span>
            </Card.Body>
          </Card>
        </div>
      </section>
    );
  }

  const handleAddComment = async () => {
    if (!postId) {
      setError("Post id is missing");
      return;
    }

    const normalizedText = commentText.trim();

    if (!normalizedText) {
      setError("Comment text is required");
      setCommentMessage("");
      return;
    }

    try {
      setIsSubmittingComment(true);
      const createdComment = await createPostComment(postId, normalizedText);
      setComments((current) => [createdComment, ...current]);
      setNextSkip((current) => current + 1);
      setTotalComments((current) => current + 1);
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              commentCount: currentPost.commentCount + 1,
            }
          : currentPost,
      );
      setCommentText("");
      setCommentMessage("Comment added.");
      setError("");
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to add comment";
      setError(message);
      setCommentMessage("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <section className="feed-comments-page" aria-label="Post comments page">
      <div className="feed-comments-page__backdrop" />
      <div className="feed-comments-page__shell container-fluid position-relative p-3">
        <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h1 className="feed-comments-page__headline">
              Conversation around the pour.
            </h1>
          </div>

          <Button
            type="button"
            variant="outline-secondary"
            className="rounded-pill px-4 fw-semibold"
            onClick={() => navigate(returnTo)}
          >
            {returnLabel}
          </Button>
        </div>

        {error ? (
          <FeedbackToast
            show
            variant="danger"
            title="Comments unavailable"
            message={error}
            onClose={() => setError("")}
          />
        ) : null}

        {commentMessage ? (
          <FeedbackToast
            show
            title="Comment added"
            message={commentMessage}
            onClose={() => setCommentMessage("")}
          />
        ) : null}

        {post ? <PostCard post={post} /> : null}

        <Card
          className="feed-surface-card mb-3 border-0"
          aria-label="Add comment"
        >
          <Card.Body>
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
              <div>
                <p className="feed-comments-page__eyebrow mb-1">Add comment</p>
                <h2 className="feed-comments-page__composer-title">
                  Join the thread.
                </h2>
              </div>
              <span className="small text-body-secondary">
                Newest comments appear first
              </span>
            </div>

            <Form.Control
              as="textarea"
              className="feed-textarea"
              rows={3}
              maxLength={5000}
              placeholder="What did you think about this beer?"
              value={commentText}
              onChange={(event) => {
                setCommentText(event.target.value);
                setCommentMessage("");
                setError("");
              }}
              disabled={isSubmittingComment}
            />

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
              <span className="small text-body-secondary">
                {commentText.trim().length}/5000
              </span>
              <Button
                type="button"
                variant="warning"
                className="fw-semibold text-white border-0 rounded-pill px-4"
                onClick={() => void handleAddComment()}
                disabled={isSubmittingComment}
              >
                {isSubmittingComment ? "Adding..." : "Add comment"}
              </Button>
            </div>
          </Card.Body>
        </Card>

        <div className="d-grid gap-3">
          {comments.length ? (
            comments.map((comment) => {
              const avatarUrl = getProfileImageUrl(comment.user.profilePic);

              return (
                <Card key={comment._id} className="feed-comment-card border-0">
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="feed-comment-card__avatar"
                        aria-hidden="true"
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" />
                        ) : (
                          getInitials(comment.user.username)
                        )}
                      </span>
                      <div>
                        <strong className="feed-comment-card__author-name">
                          {comment.user.username}
                        </strong>
                        <div className="feed-comment-card__timestamp">
                          {formatDateTime(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                    <p className="feed-comment-card__text">{comment.text}</p>
                  </Card.Body>
                </Card>
              );
            })
          ) : (
            <div className="feed-empty-state">
              No comments yet. Be the first to add one.
            </div>
          )}

          {!isLoading && !error && comments.length > 0 ? (
            <div className="small text-body-secondary text-end">
              Loaded {comments.length} of {totalComments} comments
            </div>
          ) : null}
        </div>

        <div className="d-flex justify-content-center pt-1">
          {isLoadingMore ? (
            <Card className="feed-surface-card border-0 text-center mt-3">
              <Card.Body className="d-flex align-items-center justify-content-center gap-3 py-3">
                <Spinner animation="border" role="status" size="sm" />
                <span>Loading more comments...</span>
              </Card.Body>
            </Card>
          ) : null}
        </div>

        <div
          ref={sentinelRef}
          className="feed-page__sentinel"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

export default FeedCommentsPage;
