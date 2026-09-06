import { Link, useParams } from "react-router-dom";
import projects from "../data/projects";
import "./ProjectDetail.css";

function ProjectDetail() {
  const { slug } = useParams();

  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <main className="project-not-found">
        <div className="container">
          <span>F A R M &nbsp; P R O J E C T</span>

          <h1>
            We couldn't find
            <br />
            that project.
          </h1>

          <Link to="/farm" className="button">
            Back to Farm
          </Link>
        </div>
      </main>
    );
  }

  const relatedProjects = projects
    .filter((item) => item.id !== project.id)
    .slice(0, 2);

  return (
    <main className="project-detail">
      {/* PROJECT */}

      <section className="project-detail__main section">
        <div className="container">
          <Link to="/farm" className="project-detail__back">
            ← Back to Farm
          </Link>

          <div className="project-detail__grid">
            {/* IMAGE */}

            <div className="project-detail__image">
              <img src={project.image} alt={project.title} />
            </div>

            {/* INFORMATION */}

            <div className="project-detail__content">
              <span className="project-detail__category">
                {project.category}
              </span>

              <h1>{project.title}</h1>

              <p className="project-detail__description">
                {project.description}
              </p>

              <span className="project-detail__status">{project.status}</span>

              <div className="project-detail__intro">
                <h2>Part of life at the farm.</h2>

                <p>
                  This project is one of the things we're growing and developing
                  at Mondol's Farm, alongside the land, animals, and everyday
                  rhythm of countryside life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROJECT */}

      <section className="project-detail__story section">
        <div className="container project-detail__story-grid">
          <div className="project-detail__story-label">
            <span>T H E &nbsp; P R O J E C T</span>
          </div>

          <div className="project-detail__story-content">
            <h2>Growing with purpose.</h2>

            <p>
              At Mondol's Farm, every project begins with the land and develops
              at a scale that allows us to stay connected to the work.
            </p>

            <p>{project.description}</p>

            <div className="project-detail__facts">
              <div>
                <span>Category</span>
                <strong>{project.category}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{project.status}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FROM OUR FARM */}

      <section className="project-detail__farm section">
        <div className="container project-detail__farm-grid">
          <div>
            <span className="project-detail__eyebrow">
              F R O M &nbsp; O U R &nbsp; F A R M
            </span>

            <h2>
              Growing things
              <br />
              takes time.
            </h2>
          </div>

          <div className="project-detail__farm-content">
            <p>
              We believe farming is about paying attention — to the seasons, the
              land, and the things we're raising.
            </p>

            <p>
              Some projects change with the season, some grow slowly, and some
              are simply part of learning what works best for the farm.
            </p>
          </div>
        </div>
      </section>

      {/* RELATED PROJECTS */}

      <section className="project-detail__related section">
        <div className="container">
          <div className="project-detail__related-header">
            <div>
              <span>M O R E &nbsp; F R O M &nbsp; T H E &nbsp; F A R M</span>
              <h2>Other projects.</h2>
            </div>

            <Link to="/farm" className="project-detail__link">
              Explore All Projects
              <span>→</span>
            </Link>
          </div>

          <div className="project-detail__related-grid">
            {relatedProjects.map((item) => (
              <article key={item.id} className="project-detail__related-card">
                <Link
                  to={`/farm/${item.slug}`}
                  className="project-detail__related-image"
                >
                  <img src={item.image} alt={item.title} loading="lazy" />
                </Link>

                <div className="project-detail__related-content">
                  <span>{item.category}</span>

                  <h3>
                    <Link to={`/farm/${item.slug}`}>{item.title}</Link>
                  </h3>

                  <p>{item.description}</p>

                  <Link
                    to={`/farm/${item.slug}`}
                    className="project-detail__read"
                  >
                    Explore Project
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="project-detail__cta">
        <div className="project-detail__cta-image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside farmland"
            loading="lazy"
          />
        </div>

        <div className="project-detail__cta-overlay"></div>

        <div className="container project-detail__cta-content">
          <span>
            C O M E &nbsp; E X P E R I E N C E &nbsp; T H E &nbsp; F A R M
          </span>

          <h2>
            See the farm
            <br />
            for yourself.
          </h2>

          <Link to="/stay" className="button button--light">
            Stay With Us
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ProjectDetail;
