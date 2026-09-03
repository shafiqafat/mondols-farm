import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./ProjectCard.css";

function ProjectCard({ slug, title, description, status, category, image }) {
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
    <article className="project-card">
      <Link
        to={slug ? `/farm/${slug}` : "/farm"}
        className="project-card__image"
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

        <span className="project-card__status">{status}</span>

        <span
          ref={cursorRef}
          className={`project-card__cursor ${
            isHovering ? "project-card__cursor--visible" : ""
          }`}
        >
          View Project
        </span>
      </Link>

      <div className="project-card__content">
        <span className="project-card__category">{category}</span>

        <h3>{title}</h3>

        <p>{description}</p>

        <Link
          to={slug ? `/farm/${slug}` : "/farm"}
          className="project-card__link"
        >
          Explore Project
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

export default ProjectCard;
