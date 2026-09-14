import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function InvestmentOpportunityCard({ opportunity }) {
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  const project = opportunity.project;

  useEffect(() => {
    const moveCursor = (event) => {
      if (!cursorRef.current) return;

      const rect = cursorRef.current.parentElement.getBoundingClientRect();

      cursorRef.current.style.left = `${event.clientX - rect.left}px`;
      cursorRef.current.style.top = `${event.clientY - rect.top}px`;
    };

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, []);

  if (!project) return null;

  return (
    <article className="invest-opportunity">
      <Link
        to={`/invest/${opportunity.slug}`}
        className="invest-opportunity__image"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img src={project.image} alt={project.title} loading="lazy" />

        <span
          ref={cursorRef}
          className={`invest-opportunity__cursor ${
            isHovering ? "invest-opportunity__cursor--visible" : ""
          }`}
        >
          View Opportunity <span>↗</span>
        </span>
      </Link>

      <div className="invest-opportunity__content">
        <div className="invest-opportunity__top">
          <span>{project.category}</span>

          <span className="invest-opportunity__status">
            <span></span>
            {opportunity.status}
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
          to={`/invest/${opportunity.slug}`}
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
