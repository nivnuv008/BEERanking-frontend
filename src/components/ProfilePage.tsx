import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { getStoredUser, logout } from '../services/authApi';
import {
  getCurrentUserProfile,
  getProfileImageUrl,
  searchBeers,
  updateCurrentUserProfile,
  type Beer,
  type UserProfile
} from '../services/profileApi';

type EditableProfile = {
  username: string;
  favoriteBeers: Beer[];
  profilePhotoFile: File | null;
  previewUrl: string | null;
};

function ProfilePage() {
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => getStoredUser<UserProfile>());
  const [draft, setDraft] = useState<EditableProfile>({
    username: '',
    favoriteBeers: [],
    profilePhotoFile: null,
    previewUrl: null
  });
  const [beerQuery, setBeerQuery] = useState('');
  const [beerResults, setBeerResults] = useState<Beer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const stopCameraStream = () => {
    if (!cameraStreamRef.current) {
      return;
    }

    cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraReady(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load profile';
        setError(message);

        if (message.toLowerCase().includes('sign in') || message.toLowerCase().includes('unauthorized')) {
          logout();
          navigate('/', { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDraft({
      username: profile.username,
      favoriteBeers: profile.favoriteBeers,
      profilePhotoFile: null,
      previewUrl: getProfileImageUrl(profile.profilePic)
    });
  }, [profile]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    if (!beerQuery.trim()) {
      setBeerResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchBeers(beerQuery);
        setBeerResults(results);
      } catch (searchError: unknown) {
        const message = searchError instanceof Error ? searchError.message : 'Beer search failed';
        setError(message);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [beerQuery, isEditing]);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !cameraStreamRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    const stream = cameraStreamRef.current;

    const markReady = () => {
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        setIsCameraReady(true);
        void videoElement.play();
      }
    };

    setIsCameraReady(false);
    videoElement.srcObject = stream;

    videoElement.addEventListener('loadedmetadata', markReady);
    videoElement.addEventListener('canplay', markReady);
    void videoElement.play().catch(() => {
      // The user already granted camera access; if autoplay is delayed,
      // readiness will still be updated by the media events above.
    });

    const readyCheckTimeout = window.setTimeout(markReady, 300);

    return () => {
      window.clearTimeout(readyCheckTimeout);
      videoElement.removeEventListener('loadedmetadata', markReady);
      videoElement.removeEventListener('canplay', markReady);
    };
  }, [isCameraOpen]);

  const handleEditToggle = () => {
    if (!profile) {
      return;
    }

    stopCameraStream();
    setIsCameraOpen(false);
    setIsCameraReady(false);

    setSuccessMessage('');
    setError('');
    setBeerQuery('');
    setBeerResults([]);
    setDraft({
      username: profile.username,
      favoriteBeers: profile.favoriteBeers,
      profilePhotoFile: null,
      previewUrl: getProfileImageUrl(profile.profilePic)
    });
    setIsEditing((current) => !current);
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDraft((current) => ({ ...current, username: value }));
  };

  const handleStartCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser');
      return;
    }

    try {
      setError('');
      stopCameraStream();
      setIsCameraReady(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user'
        },
        audio: false
      });

      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (cameraError: unknown) {
      const message = cameraError instanceof Error ? cameraError.message : 'Unable to open camera';
      setError(message);
      setIsCameraOpen(false);
      setIsCameraReady(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setError('Camera is not ready yet');
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      setError('Unable to capture image from camera');
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const file = await new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        resolve(new File([blob], 'camera-profile-photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.92);
    });

    if (!file) {
      setError('Unable to capture image from camera');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setDraft((current) => ({
      ...current,
      profilePhotoFile: file,
      previewUrl
    }));

    stopCameraStream();
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  const addFavoriteBeer = (beer: Beer) => {
    setDraft((current) => {
      const alreadySelected = current.favoriteBeers.some((favoriteBeer) => favoriteBeer._id === beer._id);

      if (alreadySelected) {
        return current;
      }

      return {
        ...current,
        favoriteBeers: [...current.favoriteBeers, beer]
      };
    });
  };

  const removeFavoriteBeer = (beerId: string) => {
    setDraft((current) => ({
      ...current,
      favoriteBeers: current.favoriteBeers.filter((beer) => beer._id !== beerId)
    }));
  };

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    if (!draft.username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      const updatedProfile = await updateCurrentUserProfile({
        username: draft.username,
        favoriteBeerIds: draft.favoriteBeers.map((beer) => beer._id),
        profilePhotoFile: draft.profilePhotoFile
      });

      stopCameraStream();
      setIsCameraOpen(false);
      setProfile(updatedProfile);
      setIsEditing(false);
      setBeerQuery('');
      setBeerResults([]);
      setSuccessMessage('Profile updated successfully');
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to update profile';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const visibleProfileImage = isEditing ? draft.previewUrl : getProfileImageUrl(profile?.profilePic);

  if (isLoading) {
    return (
      <div className="profile-page profile-page--loading">
        <div className="profile-page__status-card">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page profile-page--loading">
        <div className="profile-page__status-card">Profile data is not available.</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page__backdrop" />
      <div className="profile-page__content container-fluid profile-page__content-shell">
        <div className="profile-page__topbar">
          <div className="profile-page__intro-copy">
            <p className="profile-page__eyebrow">BEERanking profile</p>
            <h1 className="profile-page__headline">Your profile, your favorite pours, your beer story.</h1>
          </div>

          <div className="profile-page__actions">
            <button type="button" className="btn profile-page__ghost-button" onClick={handleLogout}>
              Log out
            </button>
            <button type="button" className="btn profile-page__primary-button" onClick={handleEditToggle}>
              {isEditing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>
        </div>

        {error ? <div className="alert alert-danger profile-page__alert">{error}</div> : null}
        {successMessage ? <div className="alert alert-success profile-page__alert">{successMessage}</div> : null}

        <div className="row g-2 align-items-stretch">
          <div className="col-lg-4">
            <section className="profile-card profile-card--identity h-100">
              <div className="profile-card__photo-shell">
                {isEditing && isCameraOpen ? (
                  <video ref={videoRef} className="profile-card__photo profile-card__camera-preview" autoPlay muted playsInline />
                ) : visibleProfileImage ? (
                  <img className="profile-card__photo" src={visibleProfileImage} alt={profile.username} />
                ) : (
                  <div className="profile-card__photo profile-card__photo--fallback">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="profile-card__photo-tools">
                  <div className="profile-card__camera-actions">
                    {!isCameraOpen ? (
                      <button type="button" className="btn profile-card__camera-button" onClick={handleStartCamera}>
                        Use camera
                      </button>
                    ) : (
                      <>
                        <button type="button" className="btn profile-card__camera-button" onClick={handleCapturePhoto} disabled={!isCameraReady}>
                          {isCameraReady ? 'Take photo' : 'Preparing camera...'}
                        </button>
                        <button type="button" className="btn profile-card__camera-button profile-card__camera-button--ghost" onClick={handleCloseCamera}>
                          Close camera
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              <canvas ref={canvasRef} className="profile-card__capture-canvas" />

              <div className="profile-card__identity-copy">
                <p className="profile-card__label">Username</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.username}
                    onChange={handleUsernameChange}
                    className="form-control form-control-lg profile-card__input"
                    placeholder="Enter your username"
                  />
                ) : (
                  <h2 className="profile-card__username">{profile.username}</h2>
                )}
                <p className="profile-card__email">{profile.email}</p>
              </div>

              {isEditing ? (
                <button
                  type="button"
                  className="btn profile-page__primary-button profile-page__save-button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              ) : null}
            </section>
          </div>

          <div className="col-lg-8">
            <section className="profile-card h-100">
              <div className="profile-card__section-header">
                <div>
                  <p className="profile-card__label">Favorite beers</p>
                  <h2 className="profile-card__section-title">Your current lineup</h2>
                </div>
                <span className="profile-card__count">{draft.favoriteBeers.length} selected</span>
              </div>

              {isEditing ? (
                <div className="profile-card__editor-tools">
                  <input
                    type="text"
                    value={beerQuery}
                    onChange={(event) => setBeerQuery(event.target.value)}
                    className="form-control profile-card__search"
                    placeholder="Search beers to add to favorites"
                  />

                  <div className="profile-card__search-results">
                    {isSearching ? <p className="profile-card__helper">Searching beer catalog...</p> : null}
                    {!isSearching && beerQuery.trim() && beerResults.length === 0 ? (
                      <p className="profile-card__helper">No beers found for this search.</p>
                    ) : null}

                    {beerResults.map((beer) => {
                      const isSelected = draft.favoriteBeers.some((favoriteBeer) => favoriteBeer._id === beer._id);

                      return (
                        <button
                          key={beer._id}
                          type="button"
                          className="profile-card__search-result"
                          onClick={() => addFavoriteBeer(beer)}
                          disabled={isSelected}
                        >
                          <span>
                            <strong>{beer.name}</strong>
                            <small>{beer.brewery} • {beer.style}</small>
                          </span>
                          <span>{isSelected ? 'Added' : 'Add'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="profile-card__beer-grid">
                {draft.favoriteBeers.length === 0 ? (
                  <div className="profile-card__empty-state">
                    {isEditing ? 'Search and add beers to build your favorites list.' : 'No favorite beers selected yet.'}
                  </div>
                ) : (
                  draft.favoriteBeers.map((beer) => (
                    <article key={beer._id} className="beer-chip">
                      <div>
                        <h3 className="beer-chip__title">{beer.name}</h3>
                        <p className="beer-chip__meta">{beer.brewery}</p>
                        <p className="beer-chip__meta">{beer.style} • {beer.abv}% ABV</p>
                      </div>

                      {isEditing ? (
                        <button
                          type="button"
                          className="beer-chip__remove"
                          onClick={() => removeFavoriteBeer(beer._id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;