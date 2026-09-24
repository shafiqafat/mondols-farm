import { Link, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import projects from "../data/projects";
import PageMeta from "../components/PageMeta";
import "./ProjectDetail.css";

function ProjectDetail() {
  const { slug } = useParams();

  const project = projects.find((item) => item.slug === slug);

  const mainRef = useRef(null);
  const heroRef = useRef(null);
  const informationRef = useRef(null);
  const storyRef = useRef(null);
  const approachRef = useRef(null);
  const farmRef = useRef(null);
  const relatedRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!project || !mainRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Project opening
      const hero = heroRef.current;
      if (hero) {
        const back = hero.querySelector(".project-detail__back");
        const image = hero.querySelector(".project-detail__image");
        const content = hero.querySelector(".project-detail__content");
        const category = hero.querySelector(".project-detail__category");
        const heading = hero.querySelector("h1");
        const description = hero.querySelector(".project-detail__description");
        const status = hero.querySelector(".project-detail__status");
        const intro = hero.querySelector(".project-detail__intro");

        gsap.set(back, { opacity: 0, y: 18 });
        gsap.set(image, { opacity: 0, x: -45, scale: 1.04 });
        gsap.set(content, { opacity: 0, x: 45 });
        gsap.set([category, heading, description, status, intro], {
          opacity: 0,
          y: 20,
        });

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(back, { opacity: 1, y: 0, duration: 0.5 })
          .to(image, { opacity: 1, x: 0, scale: 1, duration: 1 }, "-=0.25")
          .to(content, { opacity: 1, x: 0, duration: 0.8 }, "-=0.7")
          .to(category, { opacity: 1, y: 0, duration: 0.4 }, "-=0.4")
          .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.2")
          .to(description, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2")
          .to(status, { opacity: 1, y: 0, duration: 0.4 }, "-=0.15")
          .to(intro, { opacity: 1, y: 0, duration: 0.6 }, "-=0.15");
      }

      // Project facts
      const information = informationRef.current;
      if (information) {
        const header = information.querySelector(
          ".project-detail__information-header",
        );
        const facts = information.querySelectorAll(
          ".project-detail__facts > div",
        );

        gsap.set(header, { opacity: 0, y: 25 });
        gsap.set(facts, { opacity: 0, y: 30 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: information,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(header, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            facts,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.07 },
            "-=0.25",
          );
      }

      // Project story
      const story = storyRef.current;
      if (story) {
        const label = story.querySelector(".project-detail__story-label");
        const content = story.querySelector(".project-detail__story-content");
        const paragraphs = story.querySelectorAll(
          ".project-detail__story-content p",
        );

        gsap.set(label, { opacity: 0, x: -40 });
        gsap.set(content, { opacity: 0, x: 40 });
        gsap.set(paragraphs, { opacity: 0, y: 20 });

        gsap
          .timeline({
            scrollTrigger: { trigger: story, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(label, { opacity: 1, x: 0, duration: 0.7 })
          .to(content, { opacity: 1, x: 0, duration: 0.75 }, "-=0.5")
          .to(
            paragraphs,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
            "-=0.3",
          );
      }

      // How we work
      const approach = approachRef.current;
      if (approach) {
        const intro = approach.querySelector(
          ".project-detail__approach-grid > div:first-child",
        );
        const content = approach.querySelector(
          ".project-detail__approach-content",
        );
        const methods = approach.querySelectorAll(
          ".project-detail__methods > div",
        );
        const approachItems = approach.querySelectorAll(
          ".project-detail__approach-list > div",
        );

        gsap.set(intro, { opacity: 0, x: -40 });
        gsap.set(content, { opacity: 0, x: 40 });
        gsap.set(methods, { opacity: 0, y: 25 });
        gsap.set(approachItems, { opacity: 0, x: 25 });

        gsap
          .timeline({
            scrollTrigger: { trigger: approach, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(intro, { opacity: 1, x: 0, duration: 0.75 })
          .to(content, { opacity: 1, x: 0, duration: 0.75 }, "-=0.55")
          .to(
            methods,
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.09 },
            "-=0.3",
          )
          .to(
            approachItems,
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 },
            "-=0.2",
          );
      }

      // Farm context
      const farm = farmRef.current;
      if (farm) {
        const intro = farm.querySelector(
          ".project-detail__farm-grid > div:first-child",
        );
        const content = farm.querySelector(".project-detail__farm-content");
        const paragraphs = farm.querySelectorAll(
          ".project-detail__farm-content p",
        );

        gsap.set(intro, { opacity: 0, x: -40 });
        gsap.set(content, { opacity: 0, x: 40 });
        gsap.set(paragraphs, { opacity: 0, y: 20 });

        gsap
          .timeline({
            scrollTrigger: { trigger: farm, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(intro, { opacity: 1, x: 0, duration: 0.75 })
          .to(content, { opacity: 1, x: 0, duration: 0.75 }, "-=0.55")
          .to(
            paragraphs,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
            "-=0.3",
          );
      }

      // Related projects
      const related = relatedRef.current;
      if (related) {
        const header = related.querySelector(".project-detail__related-header");
        const cards = related.querySelectorAll(".project-detail__related-card");

        gsap.set(header, { opacity: 0, y: 25 });
        gsap.set(cards, { opacity: 0, y: 40 });

        gsap
          .timeline({
            scrollTrigger: { trigger: related, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(header, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            cards,
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
            "-=0.25",
          );
      }

      // Final CTA
      const cta = ctaRef.current;
      if (cta) {
        const image = cta.querySelector(".project-detail__cta-image img");
        const overlay = cta.querySelector(".project-detail__cta-overlay");
        const content = cta.querySelector(".project-detail__cta-content");
        const eyebrow = content?.querySelector(":scope > span");
        const heading = content?.querySelector("h2");
        const button = content?.querySelector(".button");

        if (image && overlay && content && eyebrow && heading && button) {
          gsap.set(image, { scale: 1.08 });
          gsap.set(overlay, { opacity: 0 });
          gsap.set(content, { opacity: 0, y: 30 });
          gsap.set([eyebrow, heading, button], { opacity: 0, y: 20 });

          gsap
            .timeline({
              scrollTrigger: { trigger: cta, start: "top 80%", once: true },
              defaults: { ease: "power3.out" },
            })
            .to(image, { scale: 1.03, duration: 1.4, ease: "power2.out" })
            .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
            .to(content, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
            .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.2")
            .to(button, { opacity: 1, y: 0, duration: 0.55 }, "-=0.15");
        }
      }
    }, mainRef);

    return () => ctx.revert();
  }, [project]);

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
    <main ref={mainRef} className="project-detail">
      <PageMeta title={project.title} description={project.description} />

      {/* ========================================
          PROJECT INTRO
      ======================================== */}

      <section ref={heroRef} className="project-detail__main section">
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

      <section
        ref={informationRef}
        className="project-detail__information section"
      >
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

      <section ref={storyRef} className="project-detail__story section">
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
        <section ref={approachRef} className="project-detail__approach section">
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

      <section ref={farmRef} className="project-detail__farm section">
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

      <section ref={relatedRef} className="project-detail__related section">
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

      <section ref={ctaRef} className="project-detail__cta">
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
