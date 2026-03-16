import { Badge } from "react-bootstrap";
import { type SommelierBeer } from "../api/aisommelierApi";

type BeerCardProps = {
  beer: SommelierBeer;
  isTopPick: boolean;
};

export default function BeerCard({ beer, isTopPick }: BeerCardProps) {
  return (
    <div
      className={`sommelier-beer-card${isTopPick ? " sommelier-beer-card--top-pick" : ""}`}
    >
      {isTopPick && (
        <span className="sommelier-beer-card__top-badge">Top pick</span>
      )}
      <h3 className="sommelier-beer-card__name">{beer.name}</h3>
      <p className="sommelier-beer-card__brewery">{beer.brewery}</p>
      <div className="d-flex flex-wrap gap-1 mb-2">
        {beer.style && (
          <Badge className="sommelier-beer-card__tag" pill>
            {beer.style}
          </Badge>
        )}
        {beer.abv != null && (
          <Badge className="sommelier-beer-card__tag" pill>
            {beer.abv.toFixed(1)}% ABV
          </Badge>
        )}
      </div>
      {beer.description && (
        <div className="sommelier-beer-card__description-wrap">
          <p className="sommelier-beer-card__description">{beer.description}</p>
        </div>
      )}
    </div>
  );
}
