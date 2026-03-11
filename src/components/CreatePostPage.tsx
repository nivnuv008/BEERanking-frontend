import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreatePostPage.css';
import { getAuthToken } from '../services/authApi';
import { searchBeers, type Beer } from '../services/profileApi';
import { createPost } from '../services/postApi';

const DESCRIPTION_LIMIT = 1000;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function CreatePostPage() {
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<number | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [beerQuery, setBeerQuery] = useState('');
  const [beerResults, setBeerResults] = useState<Beer[]>([]);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [rating, setRating] = useState(4);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      stopCameraStream();

      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }

      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

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
      // Media readiness is still handled by the listeners above.
    });

    const readyCheckTimeout = window.setTimeout(markReady, 300);

    return () => {
      window.clearTimeout(readyCheckTimeout);
      videoElement.removeEventListener('loadedmetadata', markReady);
      videoElement.removeEventListener('canplay', markReady);
    };
  }, [isCameraOpen]);

  useEffect(() => {
    const normalizedQuery = beerQuery.trim();

    if (!normalizedQuery) {
      setBeerResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setError('');
        const results = await searchBeers(normalizedQuery);
        setBeerResults(results);
      } catch (searchError: unknown) {
        const message = searchError instanceof Error ? searchError.message : 'Beer search failed';
        setError(message);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [beerQuery]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = window.setTimeout(() => {
      setSuccessMessage('');
      successTimeoutRef.current = null;
    }, 4000);

    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, [successMessage]);

  const resetImagePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImagePreview(null);
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }

    resetImagePreview();
    stopCameraStream();
    setIsCameraOpen(false);

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setImageFile(file);
    setImagePreview(previewUrl);
    setError('');
    setSuccessMessage('');
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelected(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFileSelected(file);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
  };

  const handleSelectBeer = (beer: Beer) => {
    setSelectedBeer(beer);
    setBeerQuery(beer.name);
    setBeerResults([]);
    setError('');
  };

  const handleClearBeer = () => {
    setSelectedBeer(null);
    setBeerQuery('');
    setBeerResults([]);
  };

  const handleResetForm = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setSelectedBeer(null);
    setBeerQuery('');
    setBeerResults([]);
    setRating(4);
    setDescription('');
    setImageFile(null);
    resetImagePreview();
  };

  const handleStartCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      stopCameraStream();
      setIsCameraReady(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        },
        audio: false
      });

      resetImagePreview();
      setImageFile(null);
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

        resolve(new File([blob], 'camera-post-photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.92);
    });

    if (!file) {
      setError('Unable to capture image from camera');
      return;
    }

    handleFileSelected(file);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  const getMatchedBeer = () => {
    const normalizedQuery = normalizeText(beerQuery);

    if (!normalizedQuery) {
      return null;
    }

    return beerResults.find((beer) => normalizeText(beer.name) === normalizedQuery) ?? null;
  };

  const validateForm = (_beer: Beer | null) => {
    if (!imageFile) {
      return 'Image file is required';
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return 'Rating must be between 1 and 5';
    }

    if (!description.trim()) {
      return 'Description is required';
    }

    if (description.trim().length > DESCRIPTION_LIMIT) {
      return `Description must be ${DESCRIPTION_LIMIT} characters or less`;
    }

    return '';
  };

  const handleSubmit = async () => {
    const beerToSubmit = selectedBeer ?? getMatchedBeer();
    const validationMessage = validateForm(beerToSubmit);

    if (validationMessage) {
      setError(validationMessage);
      setSuccessMessage('');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');

      const response = await createPost({
        imageFile: imageFile!,
        rating,
        beerId: '69b170ef40c0fa99da66a9df',
        // beerId: beerToSubmit?._id,
        description
      });

      handleResetForm();
      setSuccessMessage(response.message || 'Post created successfully');
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to create post';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const descriptionLength = description.trimStart().length;
  const showSearchResults = beerQuery.trim().length > 0 && beerQuery.trim() !== selectedBeer?.name;
  const submitValidationMessage = validateForm(selectedBeer ?? getMatchedBeer());

  return (
    <section className="create-post-page" aria-label="Create post page">
      {successMessage ? (
        <div className="toast show create-post-toast position-absolute top-0 end-0 m-3 border-0" role="status" aria-live="polite" aria-atomic="true">
          <div className="toast-header create-post-toast__header border-0">
            <span className="create-post-toast__icon" aria-hidden="true">
              ✓
            </span>
            <strong className="me-auto create-post-toast__title">Post added</strong>
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')} aria-label="Dismiss success message" />
          </div>
          <div className="toast-body create-post-toast__message">{successMessage}</div>
        </div>
      ) : null}

      <div className="create-post-page__backdrop" />
      <div className="create-post-page__shell container-fluid">
        <div className="create-post-page__intro d-flex align-items-center justify-content-between gap-3">
          <div>
            <p className="create-post-page__eyebrow">Share a pour</p>
            <h1 className="create-post-page__headline">Post the beer.</h1>
          </div>
          <p className="create-post-page__lead">Photo, beer, rating, note. Keep it sharp.</p>
        </div>

        <div className="row g-3 create-post-page__grid">
          <div className="col-xl-5">
            <section className="create-post-card create-post-card--media h-100">
              <div className="create-post-card__header">
                <div>
                  <p className="create-post-card__eyebrow">Image</p>
                  <h2 className="create-post-card__title">Show the pour</h2>
                </div>
                {imageFile ? <span className="create-post-card__badge">Ready to upload</span> : null}
              </div>

              <label
                className={`create-post-uploader${isDraggingFile ? ' create-post-uploader--dragging' : ''}${imagePreview ? ' create-post-uploader--has-image' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input type="file" accept="image/*" className="create-post-uploader__input" onChange={handleImageChange} />

                {isCameraOpen ? (
                  <video ref={videoRef} className="create-post-uploader__preview create-post-uploader__camera-preview" autoPlay muted playsInline />
                ) : imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview of the post to be uploaded" className="create-post-uploader__preview" />
                    <div className="create-post-uploader__overlay">
                      <span>Replace image</span>
                    </div>
                  </>
                ) : (
                  <div className="create-post-uploader__placeholder">
                    <span className="create-post-uploader__icon">+</span>
                    <strong>Drop an image here</strong>
                    <p>or click to browse from your device</p>
                  </div>
                )}
              </label>

              <div className="create-post-camera-actions d-flex flex-wrap justify-content-center gap-2">
                {!isCameraOpen ? (
                  <button type="button" className="btn create-post-camera-button" onClick={handleStartCamera}>
                    Use camera
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn create-post-camera-button" onClick={handleCapturePhoto} disabled={!isCameraReady}>
                      {isCameraReady ? 'Take photo' : 'Preparing camera...'}
                    </button>
                    <button type="button" className="btn create-post-camera-button create-post-camera-button--ghost" onClick={handleCloseCamera}>
                      Close camera
                    </button>
                  </>
                )}
              </div>

              <canvas ref={canvasRef} className="create-post-camera-canvas" />

              <div className="create-post-card__meta-strip">
                <div>
                  <span className="create-post-card__meta-label">File</span>
                  <strong>{imageFile?.name || (isCameraOpen ? 'Live camera capture' : 'No image selected')}</strong>
                </div>
                <button
                  type="button"
                  className="btn create-post-card__ghost-button"
                  onClick={() => {
                    stopCameraStream();
                    setIsCameraOpen(false);
                    setImageFile(null);
                    resetImagePreview();
                  }}
                  disabled={(!imageFile && !isCameraOpen) || isSubmitting}
                >
                  Remove
                </button>
              </div>
            </section>
          </div>

          <div className="col-xl-7">
            <section className="create-post-card h-100">
              <div className="create-post-card__header">
                <div>
                  <p className="create-post-card__eyebrow">Details</p>
                  <h2 className="create-post-card__title">Write the post</h2>
                </div>
                <span className="create-post-card__badge create-post-card__badge--soft">1 image · 1 beer · 1 rating</span>
              </div>

              {error ? <div className="alert alert-danger create-post-card__alert">{error}</div> : null}

              <div className="row g-3 create-post-form__top-grid">
                <div className="col-lg-7">
                  <div className="create-post-form__section create-post-form__section--tight">
                    <p className="create-post-form__todo">
                      TODO: when the beer search API is ready, make this field required and submit the selected beer id.
                    </p>
                    <label htmlFor="beer-query" className="create-post-form__label">
                      Beer (optional for now)
                    </label>
                    <div className="create-post-search">
                      <input
                        id="beer-query"
                        type="text"
                        className="form-control create-post-search__input"
                        placeholder="Search beer or brewery"
                        value={beerQuery}
                        onChange={(event) => {
                          setBeerQuery(event.target.value);
                          setSuccessMessage('');
                        }}
                        autoComplete="off"
                      />
                      {selectedBeer ? (
                        <button type="button" className="btn create-post-search__clear" onClick={handleClearBeer}>
                          Clear
                        </button>
                      ) : null}
                    </div>

                    {selectedBeer ? (
                      <div className="selected-beer-card">
                        <div>
                          <strong>{selectedBeer.name}</strong>
                          <p>
                            {selectedBeer.brewery} · {selectedBeer.style} · {selectedBeer.abv}% ABV
                          </p>
                        </div>
                        <span className="selected-beer-card__status">Selected</span>
                      </div>
                    ) : null}

                    {showSearchResults ? (
                      <div className="create-post-search__results" aria-live="polite">
                        {isSearching ? <p className="create-post-form__helper">Searching beers...</p> : null}
                        {!isSearching && beerResults.length === 0 ? (
                          <p className="create-post-form__helper">No beers matched this search.</p>
                        ) : null}
                        {!isSearching
                          ? beerResults.map((beer) => (
                              <button
                                key={beer._id}
                                type="button"
                                className={`create-post-search-result${selectedBeer?._id === beer._id ? ' create-post-search-result--active' : ''}`}
                                onClick={() => handleSelectBeer(beer)}
                              >
                                <span>
                                  <strong>{beer.name}</strong>
                                  <small>
                                    {beer.brewery} · {beer.style} · {beer.abv}% ABV
                                  </small>
                                </span>
                                <span>Select</span>
                              </button>
                            ))
                          : null}
                      </div>
                    ) : (
                      <p className="create-post-form__helper">You can skip this for now until the beer API flow is ready.</p>
                    )}
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="create-post-form__section create-post-form__section--tight">
                    <label className="create-post-form__label">Rating</label>
                    <div className="rating-picker" role="radiogroup" aria-label="Beer rating">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`rating-picker__button${rating === value ? ' rating-picker__button--active' : ''}`}
                          onClick={() => setRating(value)}
                          aria-checked={rating === value}
                          role="radio"
                        >
                          <span className="rating-picker__number">{value}</span>
                          <span className="rating-picker__caption">{value === 5 ? 'Top' : value === 4 ? 'Great' : value === 3 ? 'Good' : value === 2 ? 'Weak' : 'Skip'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="create-post-form__section">
                <label htmlFor="post-description" className="create-post-form__label">
                  Description
                </label>
                <textarea
                  id="post-description"
                  className="form-control create-post-form__textarea"
                  rows={4}
                  maxLength={DESCRIPTION_LIMIT}
                  placeholder="Aroma, body, finish, setting, or why you would order it again."
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setSuccessMessage('');
                  }}
                />
                <div className="create-post-form__footer-note">
                  <span>Backend limit: {DESCRIPTION_LIMIT} characters.</span>
                  <strong>{descriptionLength}/{DESCRIPTION_LIMIT}</strong>
                </div>
              </div>

              <div className="create-post-form__actions d-flex justify-content-end gap-3">
                <button type="button" className="btn create-post-card__ghost-button" onClick={handleResetForm} disabled={isSubmitting}>
                  Reset
                </button>
                <button type="button" className="btn create-post-card__primary-button" onClick={handleSubmit} disabled={isSubmitting || !!submitValidationMessage}>
                  {isSubmitting ? 'Publishing...' : 'Publish post'}
                </button>
              </div>

              {!error && submitValidationMessage ? <p className="form-text create-post-form__submit-helper">{submitValidationMessage}</p> : null}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CreatePostPage;