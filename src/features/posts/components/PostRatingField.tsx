import './PostRatingField.css';

type PostRatingFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  inputId?: string;
};

const QUICK_RATINGS = [1, 2, 3, 4, 5];

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(value * 10) / 10));
}

function PostRatingField({ label, value, onChange, disabled = false, inputId }: PostRatingFieldProps) {
  const safeValue = clampRating(value);

  return (
    <div className="rating-field">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <label htmlFor={inputId} className="create-post-form__label rating-field__label">
            {label}
          </label>
          <p className="rating-field__hint">Whole numbers or decimals from 1.0 to 5.0.</p>
        </div>
        <div className="rating-field__value">{safeValue.toFixed(1)}</div>
      </div>

      <div className="rating-field__quick-picks" role="group" aria-label={`${label} presets`}>
        {QUICK_RATINGS.map((quickValue) => (
          <button
            key={quickValue}
            type="button"
            className={`rating-field__chip${safeValue === quickValue ? ' rating-field__chip--active' : ''}`}
            onClick={() => onChange(quickValue)}
            disabled={disabled}
          >
            {quickValue.toFixed(1)}
          </button>
        ))}
      </div>

      <div className="rating-field__controls">
        <input
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={safeValue}
          onChange={(event) => onChange(clampRating(Number(event.target.value)))}
          className="rating-field__range"
          aria-label={label}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default PostRatingField;