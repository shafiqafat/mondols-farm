import { Link, useParams } from "react-router-dom";
import projects from "../data/projects";
import PageMeta from "../components/PageMeta";
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

  const details = project.details || {};

  const facts = [
    { label: "Status", value: project.status },
    { label: "Started", value: details.startDate },
    { label: "Area", value: details.area },
    { label: "Variety", value: details.variety },
    { label: "Breed", value: details.breed },
    { label: "Season", value: details.season },
    { label: "Current Scale", value: details.currentScale },
    { label: "Target Scale", value: details.targetScale },
    { label: "Current Birds", value: details.currentCount },
    { label: "Male", value: details.maleCount },
    { label: "Female", value: details.femaleCount },
    { label: "Kids", value: details.kidCount },
    { label: "Expected Harvest", value: details.expectedHarvest },
    { label: "Output", value: details.output },
    { label: "Purpose", value: details.purpose },
  ].filter((fact) => fact.value);

  const methods = [
    { label: "Irrigation", value: details.irrigation },
    { label: "Fertilizer / Manure", value: details.fertilizer },
    { label: "Housing", value: details.housing },
    { label: "Feed", value: details.feed },
    { label: "Breeding Plan", value: details.breedingPlan },
  ].filter((item) => item.value);

  return (
    <main className="project-detail">
      <PageMeta title={project.title} description={project.description} />
      
      {/* ========================================
          PROJECT INTRO
      ======================================== */}

      <section className="project-detail__main section">
        <div className="container">
          <Link to="/farm" className="project-detail__back">
            ← Back to Farm
          </Link>

          <div className="project-detail__grid">
            <div className="project-detail__image">
              <img src={project.image} alt={project.title} />
            </div>

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

                <p>{project.overview}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          PROJECT DETAILS
      ======================================== */}

      <section className="project-detail__information section">
        <div className="container">
          <div className="project-detail__information-header">
            <span> P R O J E C T &nbsp; D E T A I L S </span>

            <h2>
              The numbers
              <br />
              behind the project.
            </h2>
          </div>

          {facts.length > 0 && (
            <div className="project-detail__facts">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className={
                    fact.label === "Purpose" ? "project-detail__fact--wide" : ""
                  }
                >
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================
          ABOUT THE PROJECT
      ======================================== */}

      <section className="project-detail__story section">
        <div className="container project-detail__story-grid">
          <div className="project-detail__story-label">
            <span>T H E &nbsp; P R O J E C T</span>
          </div>

          <div className="project-detail__story-content">
            <h2>Growing with purpose.</h2>

            <p>{project.overview}</p>

            <p>
              Every project at Mondol's Farm is developed at a scale that allows
              us to stay connected to the land, the animals, and the work
              itself. As the farm grows, these projects will continue to evolve
              with it.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          HOW WE DO IT
      ======================================== */}

      {(methods.length > 0 || project.approach?.length > 0) && (
        <section className="project-detail__approach section">
          <div className="container">
            <div className="project-detail__approach-grid">
              <div>
                <span className="project-detail__eyebrow">
                  H O W &nbsp; W E &nbsp; W O R K
                </span>

                <h2>
                  Built around
                  <br />
                  the farm.
                </h2>
              </div>

              <div className="project-detail__approach-content">
                {methods.length > 0 && (
                  <div className="project-detail__methods">
                    {methods.map((method) => (
                      <div key={method.label}>
                        <span>{method.label}</span>
                        <p>{method.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {project.approach?.length > 0 && (
                  <div className="project-detail__approach-list">
                    {project.approach.map((item, index) => (
                      <div key={item}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{item}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================
          FARM CONTEXT
      ======================================== */}

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

      {/* ========================================
          RELATED PROJECTS
      ======================================== */}

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

      {/* ========================================
          CTA
      ======================================== */}

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
