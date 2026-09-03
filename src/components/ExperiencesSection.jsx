import SectionHeading from "./SectionHeading";
import ExperienceItem from "./ExperienceItem";

import experiences from "../data/experiences";

import riverImage from "../assets/image/experiences/river.jpg";

import "./ExperiencesSection.css";

function ExperiencesSection() {
  return (
    <section className="experiences experiences--home-transition section">
      <div className="container">
        <div className="experiences__grid">
          {/* Left side */}

          <div className="experiences__intro">
            <SectionHeading
              eyebrow="F A R M &nbsp; E X P E R I E N C E S"
              title="Experience the rhythm of rural life."
              description="There's more to farm life than growing food. Come slow down, get involved, and experience the countryside at your own pace."
            />

            <div className="experiences__image">
              <img
                src={riverImage}
                alt="River flowing through a countryside landscape"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right side */}

          <div className="experiences__list">
            {experiences.map((experience) => (
              <ExperienceItem key={experience.id} {...experience} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExperiencesSection;
