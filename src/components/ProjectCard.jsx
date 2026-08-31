import "./ProjectCard.css";

function ProjectCard({ title, description, status, category, image }) {
  return (
    <article className="project-card">
      <div className="project-card__image">
        <img src={image} alt={title} loading="lazy" />

        <span className="project-card__status">{status}</span>
      </div>

      <div className="project-card__content">
        <span className="project-card__category">{category}</span>

        <h3>{title}</h3>

        <p>{description}</p>

        <button className="project-card__link">
          Explore Project
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

export default ProjectCard;
