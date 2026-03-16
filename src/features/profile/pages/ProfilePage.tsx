import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Badge, Button, Card, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CameraCapture, {
  type CameraCaptureHandle,
} from "../../camera/CameraCapture";
import BeerSearchPicker from "../../../shared/components/BeerSearchPicker";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import type { Beer } from "../../../shared/api/beerApi";
import { useBeerPickerData } from "../../../shared/hooks/useBeerPickerData";
import "../styles/ProfilePage.css";
import { getStoredUser, logout } from "../../auth/api/authApi";
import {
  getCurrentUserProfile,
  getProfileImageUrl,
  updateCurrentUserProfile,
  type UserProfile,
} from "../api/profileApi";

type EditableProfile = {
  username: string;
  favoriteBeers: Beer[];
  profilePhotoFile: File | null;
  previewUrl: string | null;
};

const MAX_FAVORITE_BEERS = 3;

function ProfilePage() {
  const navigate = useNavigate();
  const cameraCaptureRef = useRef<CameraCaptureHandle | null>(null);
  const beerBlurRef = useRef<number | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    getStoredUser<UserProfile>(),
  );
  const [draft, setDraft] = useState<EditableProfile>({
    username: "",
    favoriteBeers: [],
    profilePhotoFile: null,
    previewUrl: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBeerInputFocused, setIsBeerInputFocused] = useState(false);
  const [beerPickerError, setBeerPickerError] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    query: beerQuery,
    setQuery: setBeerQuery,
    searchResults: beerResults,
    displayedBeers,
    isSearching,
    isLoadingMore,
    hasActiveQuery,
    ensureCatalogLoaded,
    onScroll: handleBeerResultsScroll,
    reset: resetBeerPicker,
  } = useBeerPickerData({
    enabled: isEditing,
    debounceMs: 350,
    preloadCatalog: true,
    onError: setBeerPickerError,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
      } catch (loadError: unknown) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load profile";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDraft({
      username: profile.username,
      favoriteBeers: profile.favoriteBeers,
      profilePhotoFile: null,
      previewUrl: getProfileImageUrl(profile.profilePic),
    });
  }, [profile]);

  const handleBeerInputFocus = () => {
    if (beerBlurRef.current) {
      window.clearTimeout(beerBlurRef.current);
    }
    setBeerPickerError("");
    ensureCatalogLoaded();
    setIsBeerInputFocused(true);
  };

  const handleBeerInputBlur = () => {
    beerBlurRef.current = window.setTimeout(() => {
      setIsBeerInputFocused(false);
    }, 150);
  };

  const handleEditToggle = () => {
    if (!profile) {
      return;
    }

    cameraCaptureRef.current?.closeCamera();

    setSuccessMessage("");
    setError("");
    setBeerPickerError("");
    resetBeerPicker();
    setDraft({
      username: profile.username,
      favoriteBeers: profile.favoriteBeers,
      profilePhotoFile: null,
      previewUrl: getProfileImageUrl(profile.profilePic),
    });
    setIsEditing((current) => !current);
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDraft((current) => ({ ...current, username: value }));
  };

  const addFavoriteBeer = (beer: Beer) => {
    setDraft((current) => {
      const alreadySelected = current.favoriteBeers.some(
        (favoriteBeer) => favoriteBeer._id === beer._id,
      );

      if (
        alreadySelected ||
        current.favoriteBeers.length >= MAX_FAVORITE_BEERS
      ) {
        return current;
      }

      return {
        ...current,
        favoriteBeers: [...current.favoriteBeers, beer],
      };
    });
  };

  const removeFavoriteBeer = (beerId: string) => {
    setDraft((current) => ({
      ...current,
      favoriteBeers: current.favoriteBeers.filter(
        (beer) => beer._id !== beerId,
      ),
    }));
  };

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    if (!draft.username.trim()) {
      setError("Username is required");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const updatedProfile = await updateCurrentUserProfile({
        username: draft.username,
        favoriteBeerIds: draft.favoriteBeers.map((beer) => beer._id),
        profilePhotoFile: draft.profilePhotoFile,
      });

      cameraCaptureRef.current?.closeCamera();
      setProfile(updatedProfile);
      setIsEditing(false);
      setBeerPickerError("");
      resetBeerPicker();
      setSuccessMessage("Profile updated successfully");
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to update profile";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const visibleProfileImage = isEditing
    ? draft.previewUrl
    : getProfileImageUrl(profile?.profilePic);
  const isAtFavoriteLimit = draft.favoriteBeers.length >= MAX_FAVORITE_BEERS;

  if (isLoading) {
    return (
      <div className="profile-page d-flex align-items-center justify-content-center">
        <Card className="profile-page__status-card border-0 shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 px-4 py-3">
            <Spinner animation="border" role="status" size="sm" />
            <span>Loading profile...</span>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page d-flex align-items-center justify-content-center">
        <Card className="profile-page__status-card border-0 shadow-sm">
          <Card.Body className="px-4 py-3">
            Profile data is not available.
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page__backdrop" />
      <div className="profile-page__content d-flex flex-column container-fluid profile-page__content-shell">
        <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 mb-3">
          <div className="flex-fill">
            <h1 className="profile-page__headline">
              Your profile, your favorite pours, your beer story.
            </h1>
          </div>

          <div className="d-flex flex-wrap align-self-start justify-content-start justify-content-lg-end gap-3">
            <Button
              type="button"
              variant="light"
              className="rounded-pill px-3 fw-semibold profile-page__ghost-action"
              onClick={handleLogout}
            >
              Log out
            </Button>
            <Button
              type="button"
              variant="warning"
              className="rounded-pill px-3 fw-semibold text-white profile-page__primary-action"
              onClick={handleEditToggle}
            >
              {isEditing ? "Cancel" : "Edit profile"}
            </Button>
          </div>
        </div>

        {error ? (
          <FeedbackToast
            show
            variant="danger"
            title="Profile update failed"
            message={error}
            onClose={() => setError("")}
          />
        ) : null}
        {successMessage ? (
          <FeedbackToast
            show
            title="Profile updated"
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        ) : null}

        <div className="row g-2 align-items-stretch">
          <div className="col-lg-4">
            <Card className="profile-card border-0 h-100">
              <Card.Body className="d-flex flex-column align-items-center text-center h-100 p-0">
                <CameraCapture
                  ref={cameraCaptureRef}
                  facingMode="user"
                  fileName="camera-profile-photo.jpg"
                  previewClassName="profile-card__photo profile-card__camera-preview"
                  onCapture={(file) => {
                    const previewUrl = URL.createObjectURL(file);
                    setDraft((current) => ({
                      ...current,
                      profilePhotoFile: file,
                      previewUrl,
                    }));
                  }}
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
                      <div className="w-100 d-flex justify-content-center mb-2">
                        {isOpen ? (
                          preview
                        ) : visibleProfileImage ? (
                          <img
                            className="profile-card__photo"
                            src={visibleProfileImage}
                            alt={profile.username}
                          />
                        ) : (
                          <div className="profile-card__photo profile-card__photo--fallback">
                            {profile.username.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="d-flex flex-column align-items-center gap-2 mb-2">
                          <div className="d-flex flex-wrap justify-content-center gap-2">
                            {!isOpen ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="warning"
                                className="rounded-pill px-3 fw-semibold text-white"
                                onClick={() => {
                                  setError("");
                                  openCamera();
                                }}
                              >
                                Use camera
                              </Button>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="warning"
                                  className="rounded-pill px-3 fw-semibold text-white"
                                  onClick={capturePhoto}
                                  disabled={!isReady}
                                >
                                  {isReady
                                    ? "Take photo"
                                    : "Preparing camera..."}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="light"
                                  className="rounded-pill px-3 fw-semibold border"
                                  onClick={closeCamera}
                                >
                                  Close camera
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </CameraCapture>

                <div className="profile-card__identity-copy">
                  <p className="profile-card__label">Username</p>
                  {isEditing ? (
                    <Form.Control
                      type="text"
                      value={draft.username}
                      onChange={handleUsernameChange}
                      size="lg"
                      className="profile-card__input"
                      placeholder="Enter your username"
                    />
                  ) : (
                    <h2 className="profile-card__username">
                      {profile.username}
                    </h2>
                  )}
                  <p className="profile-card__email">{profile.email}</p>
                </div>

                {isEditing ? (
                  <Button
                    type="button"
                    variant="warning"
                    className="profile-page__save-button rounded-pill fw-semibold text-white"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                ) : null}
              </Card.Body>
            </Card>
          </div>

          <div className="col-lg-8">
            <Card className="profile-card border-0 h-100">
              <Card.Body className="h-100 p-0">
                <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                  <div>
                    <p className="profile-card__label">Favorite beers</p>
                    <h2 className="profile-card__section-title">
                      Your current lineup
                    </h2>
                  </div>
                  <Badge
                    pill
                    bg="warning"
                    text="dark"
                    className="px-3 py-2 fs-6 fw-semibold profile-card__count-badge"
                  >
                    {draft.favoriteBeers.length}/{MAX_FAVORITE_BEERS} selected
                  </Badge>
                </div>

                {isEditing ? (
                  <div className="mb-2">
                    <BeerSearchPicker
                      inputId="profile-beer-query"
                      query={beerQuery}
                      placeholder="Search beers to add to favorites"
                      onQueryChange={(value) => {
                        setBeerPickerError("");
                        setBeerQuery(value);
                      }}
                      onFocus={handleBeerInputFocus}
                      onBlur={handleBeerInputBlur}
                      isOpen={isBeerInputFocused}
                      beers={displayedBeers}
                      hasActiveQuery={hasActiveQuery}
                      isSearching={isSearching}
                      isLoadingMore={isLoadingMore}
                      minCharsText="Type at least 2 characters to search beers."
                      onScroll={handleBeerResultsScroll}
                      onSelect={addFavoriteBeer}
                      renderMeta={(beer) => `${beer.brewery} • ${beer.style}`}
                      isResultDisabled={(beer) =>
                        isAtFavoriteLimit ||
                        draft.favoriteBeers.some(
                          (favoriteBeer) => favoriteBeer._id === beer._id,
                        )
                      }
                      getActionLabel={(beer) => {
                        const isSelected = draft.favoriteBeers.some(
                          (favoriteBeer) => favoriteBeer._id === beer._id,
                        );

                        if (isSelected) {
                          return "Added";
                        }

                        if (isAtFavoriteLimit) {
                          return "Limit reached";
                        }

                        return "Add";
                      }}
                      searchingText="Searching beer catalog..."
                      noResultsText="No beers found for this search."
                      preResultsContent={
                        <>
                          {isAtFavoriteLimit ? (
                            <p className="profile-card__helper d-block">
                              You already have 3 favorite beers.
                            </p>
                          ) : null}
                          {beerPickerError ? (
                            <p className="profile-card__helper d-block">
                              {beerPickerError}
                            </p>
                          ) : null}
                        </>
                      }
                      inputClassName="form-control profile-card__search"
                      resultsClassName="profile-card__search-results"
                      resultClassName="btn btn-light profile-card__search-result text-start"
                      helperClassName="profile-card__helper d-block"
                    />
                  </div>
                ) : null}

                <div className="profile-card__beer-grid">
                  {draft.favoriteBeers.length === 0 ? (
                    <div className="profile-card__empty-state">
                      {isEditing
                        ? "Search and add beers to build your favorites list."
                        : "No favorite beers selected yet."}
                    </div>
                  ) : (
                    draft.favoriteBeers.map((beer) => (
                      <article key={beer._id} className="beer-chip">
                        <div>
                          <h3 className="beer-chip__title">{beer.name}</h3>
                          <p className="beer-chip__meta">{beer.brewery}</p>
                          <p className="beer-chip__meta">
                            {beer.style} • {beer.abv}% ABV
                          </p>
                        </div>

                        {isEditing ? (
                          <Button
                            type="button"
                            variant="link"
                            className="beer-chip__remove p-0 text-decoration-none"
                            onClick={() => removeFavoriteBeer(beer._id)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
