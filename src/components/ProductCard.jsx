import { Link } from "react-router-dom";

import "./ProductCard.css";

function ProductCard({
  slug,
  name,
  category,
  description,
  price,
  unit,
  availability,
  image,
}) {
  return (
    <article className="product-card">
      <Link to={`/shop/${slug}`} className="product-card__image">
        <img src={image} alt={name} loading="lazy" />

        <span className="product-card__status">{availability}</span>
      </Link>

      <div className="product-card__content">
        <div className="product-card__meta">
          <span>{category}</span>

          <span>
            {price} / {unit}
          </span>
        </div>

        <h3>
          <Link to={`/shop/${slug}`}>{name}</Link>
        </h3>

        <p>{description}</p>

        <Link to={`/shop/${slug}`} className="product-card__link">
          View Produce
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;
