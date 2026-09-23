import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import "./ProductCard.css";

function ProductCard({
  slug,
  name,
  description,
  availability,
  category,
  image,
  price,
  unit,
}) {
  const cursorRef = useRef(null);
  const imageRef = useRef(null);

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

  useEffect(() => {
    const imageElement = imageRef.current;

    if (!imageElement) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const animation = gsap.fromTo(
      imageElement,
      {
        scale: 1.08,
      },
      {
        scale: 1,
        duration: 1.2,
        ease: "power2.out",
      },
    );

    return () => {
      animation.kill();
    };
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    targetPosition.current.x = e.clientX - rect.left;
    targetPosition.current.y = e.clientY - rect.top;
  };

  return (
    <article className="product-card">
      <Link
        to={`/shop/${slug}`}
        className="product-card__image"
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
        <img ref={imageRef} src={image} alt={name} loading="lazy" />

        <span className="product-card__status">{availability}</span>

        <span
          ref={cursorRef}
          className={`product-card__cursor ${
            isHovering ? "product-card__cursor--visible" : ""
          }`}
        >
          View Produce
        </span>
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
