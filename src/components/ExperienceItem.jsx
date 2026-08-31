import "./ExperienceItem.css";

function ExperienceItem({ number, title, description }) {
  return (
    <article className="experience-item">
      <span className="experience-item__number">{number}</span>

      <div className="experience-item__content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <span className="experience-item__arrow">↗</span>
    </article>
  );
}

export default ExperienceItem;
