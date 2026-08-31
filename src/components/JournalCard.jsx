import { Link } from "react-router-dom";
import "./JournalCard.css";

function JournalCard({
  slug,
  title,
  excerpt,
  category,
  date,
  image,
  featured = false,
}) {
  const articleUrl = `/journal/${slug}`;

  return (
    <article
      className={`journal-card ${featured ? "journal-card--featured" : ""}`}
    >
      <Link to={articleUrl} className="journal-card__image">
        <img src={image} alt={title} loading="lazy" />
      </Link>

      <div className="journal-card__content">
        <div className="journal-card__meta">
          <span>{category}</span>
          <time>{date}</time>
        </div>

        <h3>
          <Link to={articleUrl}>{title}</Link>
        </h3>

        <p>{excerpt}</p>

        <Link to={articleUrl} className="journal-card__link">
          Read Story
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

export default JournalCard;
