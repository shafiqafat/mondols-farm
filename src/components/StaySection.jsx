import { Link } from "react-router-dom";

import SectionHeading from "./SectionHeading";
import StayCard from "./StayCard";

import stays from "../data/stays";

import "./StaySection.css";

function StaySection({ home = false }) {
  return (
    <section
      className={`stay-section section ${home ? "stay-section--home" : ""}`}
    >
      <div className="container">
        <div className="stay-section__header">
          <SectionHeading
            eyebrow="S T A Y &nbsp; W I T H &nbsp; U S"
            title="Stay close to the land."
            description="Wake up to open fields, slow mornings, and the everyday rhythm of countryside life."
          />
        </div>

        <div className="stay-section__list">
          {stays.map((stay) => (
            <StayCard key={stay.id} {...stay} />
          ))}
        </div>

        {home && (
          <div className="stay-section__footer">
            <Link to="/stay">
              View All Stays
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default StaySection;
