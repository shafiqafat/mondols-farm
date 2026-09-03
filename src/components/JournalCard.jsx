import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

  const cursorRef = useRef(null);
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const animateCursor = () => {
      const ease = 0.08;

      currentPosition.current.x +=
        (targetPosition.current.x - currentPosition.current.x) * ease;

      currentPosition.current.y +=
        (targetPosition.current.y - currentPosition.current.y) * ease;

      if (cursorRef.current) {
        cursorRef.current.style.left = `${currentPosition.current.x}px`;
        cursorRef.current.style.top = `${currentPosition.current.y}px`;
      }

      animationFrame.current = requestAnimationFrame(animateCursor);
    };

    animationFrame.current = requestAnimationFrame(animateCursor);

    return () => {
      cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    targetPosition.current.x = e.clientX - rect.left;
    targetPosition.current.y = e.clientY - rect.top;
  };

  return (
    <article
      className={`journal-card ${featured ? "journal-card--featured" : ""}`}
    >
      <Link
        to={articleUrl}
        className="journal-card__image"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();

          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          targetPosition.current.x = x;
          targetPosition.current.y = y;

          currentPosition.current.x = x;
          currentPosition.current.y = y;

          setIsHovering(true);
        }}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={image} alt={title} loading="lazy" />

        <span
          ref={cursorRef}
          className={`journal-card__cursor ${
            isHovering ? "journal-card__cursor--visible" : ""
          }`}
        >
          View Article
        </span>
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

        {!featured && (
          <Link to={articleUrl} className="journal-card__link">
            Read Story
            <span>→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

export default JournalCard;
