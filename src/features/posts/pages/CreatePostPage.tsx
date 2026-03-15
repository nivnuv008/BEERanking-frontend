import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import CameraCapture, { type CameraCaptureHandle } from '../../camera/CameraCapture';
import FeedbackToast from '../../../shared/components/FeedbackToast';
import PostRatingField from '../components/PostRatingField';
import '../styles/CreatePostPage.css';
import { getAuthToken } from '../../auth/api/authApi';
import { searchBeers, type Beer } from '../../profile/api/profileApi';
import { createPost } from '../api/postApi';

const DESCRIPTION_LIMIT = 1000;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function CreatePostPage() {
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const cameraCaptureRef = useRef<CameraCaptureHandle | null>(null);
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
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

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
    cameraCaptureRef.current?.closeCamera();

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
    cameraCaptureRef.current?.closeCamera();
    setSelectedBeer(null);
    setBeerQuery('');
    setBeerResults([]);
    setRating(4);
    setDescription('');
    setImageFile(null);
    resetImagePreview();
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
        beerId: '69b44a42a1d380bbcbe02cbe',
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
      {error ? (
        <FeedbackToast
          show
          variant="danger"
          title="Could not publish"
          message={error}
          onClose={() => setError('')}
        />
      ) : null}

      {successMessage ? (
        <FeedbackToast show title="Post added" message={successMessage} onClose={() => setSuccessMessage('')} />
      ) : null}

      <div className="create-post-page__backdrop" />
      <div className="create-post-page__shell container-fluid">
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-between gap-3 mb-2">
          <div>
            <h1 className="create-post-page__headline">Post the beer.</h1>
          </div>
        </div>

        <div className="row g-3 create-post-page__grid">
          <div className="col-xl-5">
            <section className="create-post-card d-flex flex-column justify-content-start h-100">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                <div>
                  <p className="create-post-card__eyebrow">Image *</p>
                  <h2 className="create-post-card__title">Show the pour</h2>
                </div>
                {imageFile ? <Badge pill className="create-post-card__badge">Ready to upload</Badge> : null}
              </div>
              <CameraCapture
                ref={cameraCaptureRef}
                facingMode="environment"
                fileName="camera-post-photo.jpg"
                previewClassName="create-post-uploader__preview create-post-uploader__camera-preview"
                onCapture={handleFileSelected}
                onError={setError}
              >
                {({ isOpen, isReady, preview, openCamera, capturePhoto, closeCamera }) => (
                  <>
                    <label
                      className={`create-post-uploader${isDraggingFile ? ' create-post-uploader--dragging' : ''}`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input type="file" accept="image/*" className="create-post-uploader__input" onChange={handleImageChange} />

                      {isOpen ? preview : imagePreview ? (
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

                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                      {!isOpen ? (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm rounded-pill px-3 fw-semibold text-white shadow-sm"
                          onClick={() => {
                            setError('');
                            setSuccessMessage('');
                            resetImagePreview();
                            setImageFile(null);
                            openCamera();
                          }}
                        >
                          Use camera
                        </button>
                      ) : (
                        <>
                          <button type="button" className="btn btn-warning btn-sm rounded-pill px-3 fw-semibold text-white shadow-sm" onClick={capturePhoto} disabled={!isReady}>
                            {isReady ? 'Take photo' : 'Preparing camera...'}
                          </button>
                          <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold" onClick={closeCamera}>
                            Close camera
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CameraCapture>

              <div className="create-post-card__meta-strip">
                <div>
                  <span className="create-post-card__meta-label">File</span>
                  <strong>{imageFile?.name || 'No image selected'}</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4 fw-semibold"
                  onClick={() => {
                    cameraCaptureRef.current?.closeCamera();
                    setImageFile(null);
                    resetImagePreview();
                  }}
                  disabled={!imageFile || isSubmitting}
                >
                  Remove
                </button>
              </div>
            </section>
          </div>

          <div className="col-xl-7">
            <section className="create-post-card h-100">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                <div>
                  <p className="create-post-card__eyebrow">Details</p>
                  <h2 className="create-post-card__title">Write the post</h2>
                </div>
                <Badge pill className="create-post-card__badge create-post-card__badge--soft">1 image · 1 beer · 1 rating</Badge>
              </div>
              <div className="row g-3">
                <div className="col-lg-7">
                  <div className="create-post-form__section h-100">
                    <p className="create-post-form__todo">
                      TODO: when the beer search API is ready, make this field required and submit the selected beer id.
                    </p>
                    <label htmlFor="beer-query" className="create-post-form__label">
                      Beer (optional for now)
                    </label>
                    <div className="d-flex flex-column flex-md-row gap-3">
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
                        <button type="button" className="btn btn-outline-secondary rounded-4 px-3" onClick={handleClearBeer}>
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
                  <div className="create-post-form__section h-100">
                    <PostRatingField
                      label="Rating *"
                      inputId="create-post-rating"
                      value={rating}
                      onChange={(nextRating) => {
                        setRating(nextRating);
                        setSuccessMessage('');
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="create-post-form__section">
                <label htmlFor="post-description" className="create-post-form__label">
                  Description *
                </label>
                <textarea
                  id="post-description"
                  className="form-control create-post-form__textarea"
                  rows={3}
                  maxLength={DESCRIPTION_LIMIT}
                  placeholder="Aroma, body, finish, setting, or why you would order it again."
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setSuccessMessage('');
                  }}
                />
                <div className="create-post-form__footer-note d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
                  <span>Backend limit: {DESCRIPTION_LIMIT} characters.</span>
                  <strong>{descriptionLength}/{DESCRIPTION_LIMIT}</strong>
                </div>
              </div>

              <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-end gap-3 mt-3">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-semibold" onClick={handleResetForm} disabled={isSubmitting}>
                  Reset
                </button>
                <button type="button" className="btn btn-warning rounded-pill px-4 fw-semibold text-white shadow-sm" onClick={handleSubmit} disabled={isSubmitting || !!submitValidationMessage}>
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