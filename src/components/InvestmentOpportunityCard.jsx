import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function InvestmentOpportunityCard({ opportunity }) {
  const cursorRef = useRef(null);

  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);

  const [isHovering, setIsHovering] = useState(false);

  const project = opportunity.project;

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

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    targetPosition.current.x = x;
    targetPosition.current.y = y;

    currentPosition.current.x = x;
    currentPosition.current.y = y;

    setIsHovering(true);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    targetPosition.current.x = e.clientX - rect.left;
    targetPosition.current.y = e.clientY - rect.top;
  };

  return (
    <article className="invest-opportunity">
      {/* Image */}

      <Link
        to={`/invest/${opportunity.projectSlug}`}
        className="invest-opportunity__image"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={project.image} alt={project.title} loading="lazy" />

        <span
          ref={cursorRef}
          className={`invest-opportunity__cursor ${
            isHovering ? "invest-opportunity__cursor--visible" : ""
          }`}
        >
          View Opportunity
        </span>
      </Link>

      {/* Content */}

      <div className="invest-opportunity__content">
        <div className="invest-opportunity__top">
          <span>{project.category}</span>

          <span className="invest-opportunity__status">
            <span></span>
            OPEN
          </span>
        </div>

        <h3>{project.title}</h3>

        <p>{opportunity.description || project.description}</p>

        <div className="invest-opportunity__details">
          <div>
            <span>Minimum</span>

            <strong>৳{opportunity.funding.minimum.toLocaleString()}</strong>
          </div>

          <div>
            <span>Funding Target</span>

            <strong>৳{opportunity.funding.target.toLocaleString()}</strong>
          </div>

          <div>
            <span>Duration</span>

            <strong>
              {opportunity.duration.value} {opportunity.duration.unit}
            </strong>
          </div>
        </div>

        <Link
          to={`/invest/${opportunity.projectSlug}`}
          className="invest-opportunity__link"
        >
          Explore Opportunity
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

export default InvestmentOpportunityCard;
