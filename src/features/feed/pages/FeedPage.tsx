import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../auth/api/authApi';
import { getFeedPosts, type FeedPost } from '../api/feedApi';
import PostCard from '../components/PostCard';
import { usePostLikeState } from '../hooks/usePostLikeState';
import '../styles/FeedPage.css';

const PAGE_SIZE = 4;

function mergePosts(currentPosts: FeedPost[], nextPosts: FeedPost[]): FeedPost[] {
  const existingIds = new Set(currentPosts.map((post) => post._id));
  const merged = [...currentPosts];

  nextPosts.forEach((post) => {
    if (!existingIds.has(post._id)) {
      merged.push(post);
    }
  });

  return merged;
}

function FeedPage() {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextSkip, setNextSkip] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const { likeStateById, likeBusyId, syncPosts, toggleLike } = usePostLikeState(posts);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const loadPosts = async (reset = false) => {
    const targetSkip = reset ? 0 : nextSkip;

    try {
      if (reset) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getFeedPosts({ skip: targetSkip, limit: PAGE_SIZE });

      setPosts((currentPosts) => (reset ? result.items : mergePosts(currentPosts, result.items)));
      syncPosts(result.items, reset);
      setNextSkip(result.nextSkip);
      setTotalPosts(result.total);
      setHasMore(result.hasMore);
      setError('');
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load feed';
      setError(message);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadPosts(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore || isInitialLoading || isLoadingMore || error) {
      return;
    }

    const root = document.querySelector('.app-shell__content');

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          void loadPosts(false);
        }
      },
      {
        root,
        rootMargin: '0px 0px 260px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [error, hasMore, isInitialLoading, isLoadingMore, nextSkip]);

  const handleRetry = () => {
    void loadPosts(true);
  };

  if (isInitialLoading) {
    return (
      <section className="feed-page" aria-label="Feed page">
        <div className="feed-page__backdrop" />
        <div className="feed-page__shell container-fluid position-relative p-3">
          <div className="feed-surface-card text-center">Loading the feed...</div>
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
            <p className="feed-page__eyebrow">Community feed</p>
            <h1 className="feed-page__headline">Every pour in one scroll.</h1>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill px-3 py-2 feed-pill">
            Loaded
            <strong className="ms-2">{posts.length}</strong>
          </span>
          <span className="badge rounded-pill px-3 py-2 feed-pill">
            Total
            <strong className="ms-2">{totalPosts}</strong>
          </span>
        </div>

        {error ? (
          <div className="feed-surface-card feed-surface-card--danger mb-3 d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3" role="alert">
            <span>{error}</span>
            <button type="button" className="btn feed-button-primary" onClick={handleRetry}>
              Retry feed
            </button>
          </div>
        ) : null}

        <div className="d-grid gap-3">
          {posts.map((post) => {
            const currentLikeState = likeStateById[post._id] ?? { liked: false, likeCount: post.likeCount };

            return (
              <PostCard
                key={post._id}
                post={post}
                liked={currentLikeState.liked}
                likeCount={currentLikeState.likeCount}
                likeDisabled={likeBusyId === post._id}
                onToggleLike={toggleLike}
                onOpenComments={(selectedPost) => navigate(`/posts/${selectedPost._id}/comments`, {
                  state: {
                    post: selectedPost,
                    returnTo: '/feed',
                    returnLabel: 'Back to feed',
                  },
                })}
              />
            );
          })}
        </div>

        {!posts.length && !error ? <div className="feed-surface-card text-center mt-3">No posts are available yet.</div> : null}

        <div className="d-flex justify-content-center pt-1">
          {isLoadingMore ? <div className="feed-surface-card text-center mt-3">Loading more posts...</div> : null}
        </div>

        <div ref={sentinelRef} className="feed-page__sentinel" aria-hidden="true" />
      </div>
    </section>
  );
}

export default FeedPage;