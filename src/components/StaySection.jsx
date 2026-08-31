import SectionHeading from "./SectionHeading";
import StayCard from "./StayCard";

import stays from "../data/stays";

import "./StaySection.css";

function StaySection() {
  return (
    <section className="stay-section section">
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
      </div>
    </section>
  );
}

export default StaySection;
