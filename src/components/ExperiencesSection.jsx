import SectionHeading from "./SectionHeading";
import ExperienceItem from "./ExperienceItem";

import experiences from "../data/experiences";

import "./ExperiencesSection.css";

function ExperiencesSection() {
  return (
    <section className="experiences section">
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
                src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=85"
                alt="Countryside landscape"
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
