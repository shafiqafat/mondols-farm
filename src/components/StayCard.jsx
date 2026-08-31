import { Link } from "react-router-dom";
import "./StayCard.css";

function StayCard({
  name,
  description,
  guests,
  bedrooms,
  bathrooms,
  price,
  unit,
  image,
}) {
  return (
    <article className="stay-card">
      <div className="stay-card__image">
        <img src={image} alt={name} loading="lazy" />
      </div>

      <div className="stay-card__content">
        <div className="stay-card__heading">
          <h3>{name}</h3>

          <div className="stay-card__price">
            <strong>{price}</strong>
            <span>{unit}</span>
          </div>
        </div>

        <p className="stay-card__description">{description}</p>

        <div className="stay-card__details">
          <span>{guests}</span>
          <span>{bedrooms}</span>
          <span>{bathrooms}</span>
        </div>

        <Link to="/stay" className="stay-card__link">
          Explore Stay
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

export default StayCard;
