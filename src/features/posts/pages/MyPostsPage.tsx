import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Badge, Button, Card, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../../auth/api/authApi";
import CameraCapture, {
  type CameraCaptureHandle,
} from "../../../shared/components/CameraCapture";
import PostCard from "../components/PostCard";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { mergeById } from "../../../shared/utils/mergeById";
import type { FeedPost } from "../types/post";
import PostRatingField from "../components/PostRatingField";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import "../styles/FeedPage.css";
import { deletePost, getMyPosts, updatePost } from "../api/postApi";
import "../styles/MyPostsPage.css";

const PAGE_SIZE = 4;
const DESCRIPTION_LIMIT = 1000;

type EditDraft = {
  postId: string;
  rating: number;
  description: string;
  imageFile: File | null;
  imagePreview: string;
};

function MyPostsPage() {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const cameraCaptureRef = useRef<CameraCaptureHandle | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextSkip, setNextSkip] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [postPendingDelete, setPostPendingDelete] = useState<FeedPost | null>(
    null,
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const revokeDraftPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const clearEditor = () => {
    cameraCaptureRef.current?.closeCamera();
    revokeDraftPreview();
    setEditDraft(null);
  };

  const applyDraftImageFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }

    revokeDraftPreview();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    cameraCaptureRef.current?.closeCamera();

    setEditDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        imageFile: file,
        imagePreview: previewUrl,
      };
    });

    setError("");
    setSuccessMessage("");
  };

  const loadPosts = async (reset = false) => {
    const targetSkip = reset ? 0 : nextSkip;

    try {
      if (reset) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getMyPosts({ skip: targetSkip, limit: PAGE_SIZE });

      setPosts((currentPosts) =>
        reset ? result.items : mergeById(currentPosts, result.items),
      );
      setNextSkip(result.nextSkip);
      setTotalPosts(result.total);
      setHasMore(result.hasMore);
      setError("");
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load your posts";
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

    const root = document.querySelector(".app-shell__content");

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          void loadPosts(false);
        }
      },
      {
        root,
        rootMargin: "0px 0px 260px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [error, hasMore, isInitialLoading, isLoadingMore, nextSkip]);

  useEffect(() => {
    if (editDraft && !posts.some((post) => post._id === editDraft.postId)) {
      clearEditor();
    }
  }, [editDraft, posts]);

  const editedPost = editDraft
    ? (posts.find((post) => post._id === editDraft.postId) ?? null)
    : null;

  const renderEditablePostCard = () => {
    if (!editDraft || !editedPost) {
      return null;
    }

    return (
      <article
        className="feed-card my-posts-editor-card"
        aria-label="Edit post"
      >
        <div className="row g-0 align-items-stretch">
          <div className="col-lg-4">
            <div className="feed-card__media h-100 p-3">
              <CameraCapture
                ref={cameraCaptureRef}
                facingMode="environment"
                fileName="edited-post-photo.jpg"
                previewClassName="my-posts-editor__image my-posts-editor__image--camera"
                onCapture={applyDraftImageFile}
                onError={setError}
              >
                {({
                  isOpen,
                  isReady,
                  preview,
                  openCamera,
                  capturePhoto,
                  closeCamera,
                }) => (
                  <>
                    <div className="my-posts-editor__image-wrap">
                      {isOpen ? (
                        preview
                      ) : (
                        <img
                          src={editDraft.imagePreview}
                          alt={`Preview for ${editedPost.beer?.name ?? "selected post"}`}
                          className="my-posts-editor__image"
                        />
                      )}
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      <label className="btn btn-outline-secondary rounded-pill px-4 fw-semibold my-posts-editor__file-button">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDraftImageChange}
                          disabled={isSaving || isOpen}
                        />
                        <span>
                          {editDraft.imageFile
                            ? "Choose another image"
                            : "Replace image"}
                        </span>
                      </label>

                      {!isOpen ? (
                        <button
                          type="button"
                          className="btn btn-warning rounded-pill px-4 fw-semibold text-white shadow-sm"
                          onClick={() => {
                            setError("");
                            setSuccessMessage("");
                            openCamera();
                          }}
                          disabled={isSaving}
                        >
                          Use camera
                        </button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="warning"
                            className="rounded-pill px-4 fw-semibold text-white shadow-sm border-0"
                            onClick={capturePhoto}
                            disabled={!isReady || isSaving}
                          >
                            {isReady ? "Take photo" : "Preparing camera..."}
                          </Button>
                          <Button
                            type="button"
                            variant="outline-secondary"
                            className="rounded-pill px-4 fw-semibold"
                            onClick={closeCamera}
                            disabled={isSaving}
                          >
                            Close camera
                          </Button>
                        </>
                      )}

                      <Button
                        type="button"
                        variant="outline-secondary"
                        className="rounded-pill px-4 fw-semibold"
                        onClick={handleUseCurrentImage}
                        disabled={!editDraft.imageFile || isSaving || isOpen}
                      >
                        Keep current image
                      </Button>
                    </div>
                  </>
                )}
              </CameraCapture>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="feed-card__body h-100 d-flex flex-column">
              <div className="d-flex align-items-start gap-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="feed-card__avatar" aria-hidden="true">
                    {editedPost.user.profilePic ? (
                      <img src={editedPost.user.profilePic} alt="" />
                    ) : (
                      editedPost.user.username.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div>
                    <strong className="feed-card__author-name">
                      {editedPost.user.username}
                    </strong>
                    <div className="feed-card__timestamp">
                      Editing this post
                    </div>
                  </div>
                </div>
              </div>

              <section
                className="feed-card__beer-panel mt-3"
                aria-label="Edit post details"
              >
                <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 mb-3">
                  <div>
                    <p className="feed-page__eyebrow mb-1">Edit post</p>
                    <h2 className="my-posts-editor__title">
                      Update photo, rating, and tasting note.
                    </h2>
                  </div>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="rounded-pill px-4 fw-semibold"
                    onClick={clearEditor}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="row g-3">
                  <div className="col-md-5">
                    <PostRatingField
                      label="Rating"
                      inputId="my-post-rating"
                      value={editDraft.rating}
                      onChange={(nextRating) => {
                        setEditDraft((currentDraft) =>
                          currentDraft
                            ? { ...currentDraft, rating: nextRating }
                            : currentDraft,
                        );
                        setSuccessMessage("");
                      }}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="col-md-7">
                    <label
                      htmlFor="my-post-beer"
                      className="my-posts-editor__label"
                    >
                      Beer
                    </label>
                    <Form.Control
                      id="my-post-beer"
                      type="text"
                      className="my-posts-editor__input"
                      value={
                        editedPost.beer?.name ?? "Beer details unavailable"
                      }
                      disabled
                    />
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="my-post-description"
                      className="my-posts-editor__label"
                    >
                      Description
                    </label>
                    <Form.Control
                      as="textarea"
                      id="my-post-description"
                      className="feed-textarea"
                      rows={6}
                      maxLength={DESCRIPTION_LIMIT}
                      value={editDraft.description}
                      onChange={(event) => {
                        setEditDraft((currentDraft) =>
                          currentDraft
                            ? {
                                ...currentDraft,
                                description: event.target.value,
                              }
                            : currentDraft,
                        );
                        setSuccessMessage("");
                      }}
                      disabled={isSaving}
                    />
                    <div className="my-posts-editor__meta-row">
                      <span>
                        {editDraft.description.trim().length}/
                        {DESCRIPTION_LIMIT}
                      </span>
                      <span>
                        {editDraft.imageFile
                          ? `New file: ${editDraft.imageFile.name}`
                          : "Using current image"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="feed-card__footer d-flex flex-wrap align-items-center justify-content-between gap-3 mt-auto pt-3">
                <div className="d-flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="warning"
                    className="fw-semibold text-white border-0 rounded-pill px-4"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="rounded-pill px-4 fw-semibold"
                    onClick={clearEditor}
                    disabled={isSaving}
                  >
                    Discard changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const handleRetry = () => {
    void loadPosts(true);
  };

  const handleStartEditing = (post: FeedPost) => {
    revokeDraftPreview();
    setEditDraft({
      postId: post._id,
      rating: post.rating,
      description: post.description,
      imageFile: null,
      imagePreview: post.image,
    });
    setError("");
    setSuccessMessage("");
  };

  const handleDraftImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    applyDraftImageFile(event.target.files?.[0] ?? null);
  };

  const handleUseCurrentImage = () => {
    if (!editedPost) {
      return;
    }

    revokeDraftPreview();
    setEditDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        imageFile: null,
        imagePreview: editedPost.image,
      };
    });
    setSuccessMessage("");
  };

  const validateDraft = (draft: EditDraft) => {
    const trimmedDescription = draft.description.trim();

    if (
      !Number.isFinite(draft.rating) ||
      draft.rating < 1 ||
      draft.rating > 5
    ) {
      return "Rating must be between 1 and 5";
    }

    if (!trimmedDescription) {
      return "Description is required";
    }

    if (trimmedDescription.length > DESCRIPTION_LIMIT) {
      return `Description must be ${DESCRIPTION_LIMIT} characters or less`;
    }

    return "";
  };

  const handleSaveEdit = async () => {
    if (!editDraft || !editedPost) {
      return;
    }

    const validationMessage = validateDraft(editDraft);

    if (validationMessage) {
      setError(validationMessage);
      setSuccessMessage("");
      return;
    }

    const trimmedDescription = editDraft.description.trim();
    const hasChanges =
      editDraft.imageFile !== null ||
      editDraft.rating !== editedPost.rating ||
      trimmedDescription !== editedPost.description;

    if (!hasChanges) {
      setSuccessMessage("No changes to save");
      setError("");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await updatePost(editDraft.postId, {
        imageFile: editDraft.imageFile,
        rating: editDraft.rating,
        description: trimmedDescription,
      });

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === response.data._id ? response.data : post,
        ),
      );
      clearEditor();
      setSuccessMessage(response.message || "Post updated");
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to update post";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (post: FeedPost) => {
    setPostPendingDelete(post);
  };

  const handleCancelDelete = () => {
    if (deletingPostId) {
      return;
    }

    setPostPendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!postPendingDelete) {
      return;
    }

    try {
      setDeletingPostId(postPendingDelete._id);
      setError("");
      setSuccessMessage("");

      const response = await deletePost(postPendingDelete._id);

      if (editDraft?.postId === postPendingDelete._id) {
        clearEditor();
      }

      await loadPosts(true);
      setPostPendingDelete(null);
      setSuccessMessage(response.message || "Post deleted");
    } catch (deleteError: unknown) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete post";
      setError(message);
    } finally {
      setDeletingPostId(null);
    }
  };

  if (isInitialLoading) {
    return (
      <section className="feed-page my-posts-page" aria-label="My posts page">
        <div className="feed-page__backdrop" />
        <div className="feed-page__shell container-fluid position-relative p-3">
          <Card className="feed-surface-card border-0 text-center">
            <Card.Body className="d-flex align-items-center justify-content-center gap-3 py-3">
              <Spinner animation="border" role="status" size="sm" />
              <span>Loading your posts...</span>
            </Card.Body>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="feed-page my-posts-page" aria-label="My posts page">
      <ConfirmDialog
        isOpen={!!postPendingDelete}
        title="Delete post"
        message={`Delete your post about ${postPendingDelete?.beer?.name ?? "this beer"}? This action cannot be undone.`}
        confirmLabel="Delete post"
        cancelLabel="Keep post"
        isConfirming={!!deletingPostId}
        onCancel={handleCancelDelete}
        onConfirm={() => void handleConfirmDelete()}
      />

      <div className="feed-page__backdrop" />
      <div className="feed-page__shell container-fluid position-relative p-3">
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-between gap-3 mb-3">
          <div>
            <h1 className="feed-page__headline">
              Your pours, your notes, your edits.
            </h1>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {editDraft ? (
            <Badge
              pill
              className="px-3 py-2 feed-pill my-posts-page__pill-active"
            >
              Editing
              <strong className="ms-2">1</strong>
            </Badge>
          ) : null}
        </div>

        {error ? (
          <FeedbackToast
            show
            variant="danger"
            title="Could not load posts"
            message={error}
            actionLabel="Retry"
            onAction={handleRetry}
            onClose={() => setError("")}
          />
        ) : null}

        {successMessage ? (
          <FeedbackToast
            show
            title="Posts updated"
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        ) : null}

        <div className="d-grid gap-3">
          {posts.map((post) =>
            editDraft?.postId === post._id ? (
              renderEditablePostCard()
            ) : (
              <PostCard
                key={post._id}
                post={post}
                onOpenComments={(selectedPost) =>
                  navigate(`/posts/${selectedPost._id}/comments`, {
                    state: {
                      post: selectedPost,
                      returnTo: "/my-posts",
                      returnLabel: "Back to my posts",
                    },
                  })
                }
                footerActions={
                  <>
                    <button
                      type="button"
                      className={`btn btn-outline-secondary rounded-pill px-4 fw-semibold${editDraft?.postId === post._id ? " my-posts-card__action--active" : ""}`}
                      onClick={() => handleStartEditing(post)}
                      disabled={deletingPostId === post._id}
                    >
                      Edit post
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger rounded-pill px-4 fw-semibold"
                      onClick={() => void handleDeletePost(post)}
                      disabled={deletingPostId === post._id}
                    >
                      {deletingPostId === post._id
                        ? "Deleting..."
                        : "Delete post"}
                    </button>
                  </>
                }
              />
            ),
          )}
        </div>

        {!posts.length && !error ? (
          <div className="feed-empty-state text-center mt-3">
            <p className="mb-3">You have not posted anything yet.</p>
            <Button
              type="button"
              variant="warning"
              className="fw-semibold text-white border-0 rounded-pill px-4"
              onClick={() => navigate("/create-post")}
            >
              Create your first post
            </Button>
          </div>
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

export default MyPostsPage;
