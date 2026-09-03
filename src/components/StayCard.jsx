import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
    <article className="stay-card">
      <Link
        to={`/contact?stay=${encodeURIComponent(name)}`}
        className="stay-card__image"
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
        <img src={image} alt={name} loading="lazy" />

        <span
          ref={cursorRef}
          className={`stay-card__cursor ${
            isHovering ? "stay-card__cursor--visible" : ""
          }`}
        >
          Check Availability
        </span>
      </Link>

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

        <Link
          to={`/contact?stay=${encodeURIComponent(name)}`}
          className="stay-card__link"
        >
          Check Availability
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

export default StayCard;
