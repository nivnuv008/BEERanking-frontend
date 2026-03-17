import { useEffect, useState } from "react";
import { Badge, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { getErrorMessage } from "../../../shared/utils/getErrorMessage";
import { useInfiniteScroll } from "../../../shared/hooks/useInfiniteScroll";
import { mergeById } from "../../../shared/utils/mergeById";
import type { FeedPost } from "../types/post";
import { getFeedPosts } from "../api/feedApi";
import PostCard from "../components/PostCard";
import "../styles/FeedPage.css";

const PAGE_SIZE = 4;

function FeedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextSkip, setNextSkip] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = async (reset = false) => {
    const targetSkip = reset ? 0 : nextSkip;

    try {
      if (reset) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getFeedPosts({ skip: targetSkip, limit: PAGE_SIZE });

      setPosts((currentPosts) =>
        reset ? result.items : mergeById(currentPosts, result.items),
      );
      setNextSkip(result.nextSkip);
      setTotalPosts(result.total);
      setHasMore(result.hasMore);
      setError("");
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, "Failed to load feed"));
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { sentinelRef } = useInfiniteScroll({
    enabled: hasMore && !isInitialLoading && !isLoadingMore && !error,
    onIntersect: () => loadPosts(false),
  });

  const handleRetry = () => {
    void loadPosts(true);
  };

  if (isInitialLoading) {
    return (
      <section className="feed-page" aria-label="Feed page">
        <div className="feed-page__backdrop" />
        <div className="feed-page__shell container-fluid position-relative p-3">
          <Card className="feed-surface-card border-0 text-center">
            <Card.Body className="d-flex align-items-center justify-content-center gap-3 py-3">
              <Spinner animation="border" role="status" size="sm" />
              <span>Loading the feed...</span>
            </Card.Body>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="feed-page" aria-label="Feed page">
      <div className="feed-page__backdrop" />
      <div className="feed-page__shell container-fluid position-relative p-3">
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-between gap-3 mb-3">
          <div>
            <h1 className="feed-page__headline">Every pour in one scroll.</h1>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3"></div>

        {error ? (
          <FeedbackToast
            show
            variant="danger"
            title="Feed unavailable"
            message={error}
            actionLabel="Retry feed"
            onAction={handleRetry}
            onClose={() => setError("")}
          />
        ) : null}

        <div className="d-grid gap-3">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onOpenComments={(selectedPost) =>
                navigate(`/posts/${selectedPost._id}/comments`, {
                  state: {
                    post: selectedPost,
                    returnTo: "/feed",
                    returnLabel: "Back to feed",
                  },
                })
              }
            />
          ))}
        </div>

        {!posts.length && !error ? (
          <Card className="feed-surface-card border-0 text-center mt-3">
            <Card.Body>No posts are available yet.</Card.Body>
          </Card>
        ) : null}

        <div className="d-flex justify-content-center pt-1">
          {isLoadingMore ? (
            <Card className="feed-surface-card border-0 text-center mt-3">
              <Card.Body className="d-flex align-items-center justify-content-center gap-3 py-3">
                <Spinner animation="border" role="status" size="sm" />
                <span>Loading more posts...</span>
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

export default FeedPage;
