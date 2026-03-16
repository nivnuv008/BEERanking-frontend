import { useState, type CSSProperties } from "react";
import { Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import {
  askSommelier,
  type AskSommelierResponse,
  type RecommendationType,
} from "../api/AISommelierApi";
import BeerCard from "../components/BeerCard";
import "../styles/AISommelier.css";

const MAX_PROMPT_LENGTH = 300;
const MAX_RECOMMENDED_BEERS = 3;

const BADGE_LABELS: Record<RecommendationType, string> = {
  SINGLE_BEST: "Perfect match",
  MULTIPLE_GOOD: "Great options",
  CLOSE_ALTERNATIVES: "Close alternatives",
  NO_MATCH: "No match",
};

const BADGE_MODIFIER: Record<RecommendationType, string> = {
  SINGLE_BEST: "single",
  MULTIPLE_GOOD: "multiple",
  CLOSE_ALTERNATIVES: "alternatives",
  NO_MATCH: "nomatch",
};

export function AISommelier() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AskSommelierResponse | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await askSommelier(trimmed);
      setResult(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const { analysis, beers } = result ?? {};
  const recommendedBeerIds = analysis?.recommendedIds ?? [];
  const beerById = new Map((beers ?? []).map((beer) => [beer._id, beer]));
  const recommendedBeers = recommendedBeerIds
    .map((id) => beerById.get(id))
    .filter((beer): beer is NonNullable<typeof beer> => Boolean(beer))
    .slice(0, MAX_RECOMMENDED_BEERS);
  const hasBeers = recommendedBeers.length > 0;
  const beerColumns = Math.max(
    1,
    Math.min(recommendedBeers.length, MAX_RECOMMENDED_BEERS),
  );
  const beerGridStyle: CSSProperties &
    Record<"--sommelier-beer-columns", string> = {
    "--sommelier-beer-columns": String(beerColumns),
  };

  return (
    <div className="sommelier-page">
      <div className="sommelier-page__backdrop" />

      <div className="sommelier-page__shell">
        <div>
          <h1 className="sommelier-page__headline">
            AI <span>Sommelier</span>
          </h1>
          <p className="sommelier-page__subtitle">
            Describe your mood, occasion, or taste — the sommelier will find
            your perfect beer.
          </p>
        </div>

        <form className="sommelier-prompt-card" onSubmit={handleSubmit}>
          <Form.Label className="sommelier-prompt-card__label">
            Your request
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              className="sommelier-prompt-card__textarea"
              placeholder="e.g. Something dark and roasty for a cold evening…"
              value={prompt}
              maxLength={MAX_PROMPT_LENGTH}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              type="submit"
              className="sommelier-prompt-card__btn d-inline-flex align-items-center gap-2"
              disabled={!prompt.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" /> Asking…
                </>
              ) : (
                "🍺 Ask the sommelier"
              )}
            </button>
          </InputGroup>
          <Form.Text className="sommelier-prompt-card__char-count">
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </Form.Text>
        </form>

        <div className="sommelier-results">
          {!result && !isLoading && (
            <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 gap-2 text-center sommelier-empty">
              <div className="sommelier-empty__icon">🍻</div>
              <p className="sommelier-empty__text">
                Tell the sommelier what you're looking for and let AI find your
                perfect match.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 gap-2 sommelier-empty">
              <Spinner
                animation="border"
                style={{ color: "var(--sommelier-accent)" }}
              />
              <p className="sommelier-empty__text mt-2">
                The sommelier is thinking…
              </p>
            </div>
          )}

          {result && analysis && (
            <>
              <div className="sommelier-analysis-card">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="sommelier-analysis-card__icon">🧑‍🍳</span>
                  <h2 className="sommelier-analysis-card__title">
                    Sommelier's analysis
                  </h2>
                  <Badge
                    className={`ms-auto sommelier-analysis-card__badge sommelier-analysis-card__badge--${BADGE_MODIFIER[analysis.recommendationType]}`}
                    pill
                  >
                    {BADGE_LABELS[analysis.recommendationType]}
                  </Badge>
                </div>
                <p className="sommelier-analysis-card__explanation">
                  {analysis.explanation}
                </p>
              </div>

              {hasBeers && (
                <div className="sommelier-beers-grid" style={beerGridStyle}>
                  {recommendedBeers.map((beer) => (
                    <BeerCard
                      key={beer._id}
                      beer={beer}
                      isTopPick={beer._id === analysis.topPickId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error ? (
        <FeedbackToast
          show
          title="The sommelier couldn't process your request"
          message={error}
          variant="danger"
          onClose={() => setError("")}
        />
      ) : null}
    </div>
  );
}
