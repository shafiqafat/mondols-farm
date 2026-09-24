import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "../components/SectionHeading";
import ProjectCard from "../components/ProjectCard";
import GalleryItem from "../components/GalleryItem";

import projects from "../data/projects";
import galleryImages from "../data/gallery";
import { getOpenInvestmentOpportunities } from "../data/investmentUtils";

import mustardCultivation from "../assets/image/projects/mustard-cultivation.jpg";
import PageMeta from "../components/PageMeta";

import "./Farm.css";
gsap.registerPlugin(ScrollTrigger);

function Farm() {
  const investmentOpportunities = getOpenInvestmentOpportunities();

  const farmHeroRef = useRef(null);
  const farmIntroductionRef = useRef(null);
  const farmProjectsRef = useRef(null);
  const farmGrowRef = useRef(null);
  const farmInvestmentRef = useRef(null);
  const farmGalleryRef = useRef(null);
  const farmPhilosophyRef = useRef(null);
  const farmCtaRef = useRef(null);

  const investmentCursorRef = useRef(null);
  const investmentTargetPosition = useRef({ x: 0, y: 0 });
  const investmentCurrentPosition = useRef({ x: 0, y: 0 });
  const investmentAnimationFrame = useRef(null);

  const [isInvestmentHovering, setIsInvestmentHovering] = useState(false);

  useEffect(() => {
    const animateInvestmentCursor = () => {
      const ease = 0.08;

      investmentCurrentPosition.current.x +=
        (investmentTargetPosition.current.x -
          investmentCurrentPosition.current.x) *
        ease;

      investmentCurrentPosition.current.y +=
        (investmentTargetPosition.current.y -
          investmentCurrentPosition.current.y) *
        ease;

      if (investmentCursorRef.current) {
        investmentCursorRef.current.style.left = `${investmentCurrentPosition.current.x}px`;
        investmentCursorRef.current.style.top = `${investmentCurrentPosition.current.y}px`;
      }

      investmentAnimationFrame.current = requestAnimationFrame(
        animateInvestmentCursor,
      );
    };

    investmentAnimationFrame.current = requestAnimationFrame(
      animateInvestmentCursor,
    );

    return () => {
      cancelAnimationFrame(investmentAnimationFrame.current);
    };
  }, []);

  const handleInvestmentMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    investmentTargetPosition.current.x = e.clientX - rect.left;
    investmentTargetPosition.current.y = e.clientY - rect.top;
  };

  useEffect(() => {
    const hero = farmHeroRef.current;

    if (!hero) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const image = hero.querySelector(".farm-hero__image img");
    const overlay = hero.querySelector(".farm-hero__overlay");
    const eyebrow = hero.querySelector(".farm-hero__eyebrow");
    const heading = hero.querySelector("h1");
    const paragraph = hero.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, {
        scale: 1.08,
      });

      gsap.set(overlay, {
        opacity: 0,
      });

      gsap.set([eyebrow, heading, paragraph], {
        opacity: 0,
        y: 30,
      });

      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(image, {
          scale: 1.03,
          duration: 1.5,
          ease: "power2.out",
        })
        .to(
          overlay,
          {
            opacity: 0.5,
            duration: 0.8,
          },
          0.1,
        )
        .to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.35,
        )
        .to(
          heading,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          0.48,
        )
        .to(
          paragraph,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          0.68,
        );
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmIntroductionRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const image = section.querySelector(".farm-introduction__image");
    const content = section.querySelector(".farm-introduction__content");

    const ctx = gsap.context(() => {
      gsap.set(image, {
        opacity: 0,
        x: -40,
      });

      gsap.set(content, {
        opacity: 0,
        x: 40,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(image, {
          opacity: 1,
          x: 0,
          duration: 0.9,
        })
        .to(
          content,
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
          },
          "-=0.55",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmProjectsRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const heading = section.querySelector(".section-heading");
    const cards = section.querySelectorAll(".project-card");

    const ctx = gsap.context(() => {
      gsap.set(heading, {
        opacity: 0,
        y: 25,
      });

      gsap.set(cards, {
        opacity: 0,
        y: 45,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(heading, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
          },
          "-=0.35",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmGrowRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const heading = section.querySelector(".section-heading");
    const items = section.querySelectorAll(".farm-grow__item");
    const footer = section.querySelector(".farm-grow__footer");

    const ctx = gsap.context(() => {
      gsap.set(heading, {
        opacity: 0,
        y: 25,
      });

      gsap.set(items, {
        opacity: 0,
        x: -25,
      });

      gsap.set(footer, {
        opacity: 0,
        y: 20,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(heading, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          items,
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.12,
          },
          "-=0.3",
        )
        .to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          "-=0.25",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmInvestmentRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const image = section.querySelector(".farm-investment__image");
    const content = section.querySelector(".farm-investment__content");

    const ctx = gsap.context(() => {
      gsap.set(image, {
        opacity: 0,
        x: -40,
      });

      gsap.set(content, {
        opacity: 0,
        x: 40,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(image, {
          opacity: 1,
          x: 0,
          duration: 0.9,
        })
        .to(
          content,
          {
            opacity: 1,
            x: 0,
            duration: 0.85,
          },
          "-=0.55",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmGalleryRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const heading = section.querySelector(".section-heading");
    const items = section.querySelectorAll(".gallery-item");
    const footer = section.querySelector(".farm-gallery__footer");

    const ctx = gsap.context(() => {
      gsap.set(heading, {
        opacity: 0,
        y: 25,
      });

      gsap.set(items, {
        opacity: 0,
        y: 35,
        scale: 0.96,
      });

      gsap.set(footer, {
        opacity: 0,
        y: 20,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(heading, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          items,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
          },
          "-=0.3",
        )
        .to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          "-=0.25",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmPhilosophyRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const intro = section.querySelector(
      ".farm-philosophy__grid > div:first-child",
    );
    const values = section.querySelectorAll(".farm-philosophy__values > div");

    const ctx = gsap.context(() => {
      gsap.set(intro, {
        opacity: 0,
        x: -40,
      });

      gsap.set(values, {
        opacity: 0,
        x: 40,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(intro, {
          opacity: 1,
          x: 0,
          duration: 0.8,
        })
        .to(
          values,
          {
            opacity: 1,
            x: 0,
            duration: 0.65,
            stagger: 0.12,
          },
          "-=0.45",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = farmCtaRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const content = section.querySelector(".farm-cta__content");
    const eyebrow = content.querySelector(":scope > span");
    const heading = content.querySelector("h2");
    const actions = content.querySelector("a");

    const ctx = gsap.context(() => {
      gsap.set(content, {
        opacity: 0,
        y: 30,
      });

      gsap.set([eyebrow, heading, actions], {
        opacity: 0,
        y: 20,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true,
          },
          defaults: {
            ease: "power3.out",
          },
        })
        .to(content, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
          },
          "-=0.35",
        )
        .to(
          heading,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          "-=0.25",
        )
        .to(
          actions,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
          },
          "-=0.2",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <main className="farm-page">
      <PageMeta
        title="The Farm"
        description="Explore the crops, livestock, and farming projects growing at Mondol's Farm."
      />
      {/* Hero */}

      <section ref={farmHeroRef} className="farm-hero">
        <div className="farm-hero__image">
          <img src={mustardCultivation} alt="Countryside farm landscape" />
        </div>

        <div className="farm-hero__overlay"></div>

        <div className="container farm-hero__content">
          <span className="farm-hero__eyebrow">T H E &nbsp; F A R M</span>

          <h1>
            Life on
            <br />
            the farm.
          </h1>

          <p>
            A small piece of countryside where growing, raising, learning, and
            living come together.
          </p>
        </div>
      </section>

      {/* Introduction */}

      <section ref={farmIntroductionRef} className="farm-introduction section">
        <div className="container farm-introduction__grid">
          <div className="farm-introduction__image">
            <img
              src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1400&q=85"
              alt="Agricultural field"
              loading="lazy"
            />
          </div>

          <div className="farm-introduction__content">
            <SectionHeading
              eyebrow="O U R &nbsp; F A R M"
              title="Rooted in the land."
              description="Mondol's Farm is a small agricultural project built around sustainable farming, seasonal food, livestock, and a deeper connection with rural life."
            />

            <p className="farm-introduction__extra">
              We believe a farm doesn't have to be enormous to be meaningful.
              Every project starts small, grows carefully, and teaches us
              something along the way.
            </p>

            <Link to="/about" className="farm-page__link">
              Our Story
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Projects */}

      <section ref={farmProjectsRef} className="farm-projects section">
        <div className="container">
          <div className="farm-projects__header">
            <SectionHeading
              eyebrow="C U R R E N T  &nbsp; P R O J E C T S"
              title="What we're working on."
              description="Our farm is always evolving. These are some of the projects currently shaping life here."
            />
          </div>

          <div className="farm-projects__grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </div>
      </section>

      {/* What We Grow */}

      <section ref={farmGrowRef} className="farm-grow section">
        <div className="container">
          <SectionHeading
            eyebrow="W H A T &nbsp; W E &nbsp; G R O W"
            title="Food from the land."
            description="Our produce changes with the seasons. We focus on growing what makes sense for the land, the climate, and the people around us."
          />

          <div className="farm-grow__list">
            <div className="farm-grow__item">
              <span>01</span>
              <h3>Vegetables</h3>
              <p>
                Seasonal vegetables grown for freshness, flavour, and everyday
                meals.
              </p>
            </div>

            <div className="farm-grow__item">
              <span>02</span>
              <h3>Fruits</h3>
              <p>
                Fruit grown naturally and harvested according to the season.
              </p>
            </div>

            <div className="farm-grow__item">
              <span>03</span>
              <h3>Eggs</h3>
              <p>Fresh eggs from our small-scale poultry project.</p>
            </div>

            <div className="farm-grow__item">
              <span>04</span>
              <h3>Farm Meat</h3>
              <p>Farm-raised meat available in limited quantities.</p>
            </div>
          </div>
          <div className="farm-grow__footer">
            <Link to="/shop">
              Explore Our Produce
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Investment Opportunities */}

      {investmentOpportunities.length > 0 && (
        <section ref={farmInvestmentRef} className="farm-investment section">
          <div className="container">
            <div className="farm-investment__grid">
              {/* Project Image */}

              <Link
                to={`/invest/${investmentOpportunities[0].slug}`}
                className="farm-investment__image"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  investmentTargetPosition.current.x = x;
                  investmentTargetPosition.current.y = y;

                  investmentCurrentPosition.current.x = x;
                  investmentCurrentPosition.current.y = y;

                  setIsInvestmentHovering(true);
                }}
                onMouseLeave={() => setIsInvestmentHovering(false)}
                onMouseMove={handleInvestmentMouseMove}
              >
                <img
                  src={investmentOpportunities[0].project.image}
                  alt={investmentOpportunities[0].project.title}
                  loading="lazy"
                />

                <span
                  ref={investmentCursorRef}
                  className={`farm-investment__cursor ${
                    isInvestmentHovering
                      ? "farm-investment__cursor--visible"
                      : ""
                  }`}
                >
                  View Opportunity
                </span>

                <div className="farm-investment__image-caption">
                  <span>R E A L &nbsp; P R O J E C T S</span>
                  <span>R E A L &nbsp; I M P A C T</span>
                </div>
              </Link>

              {/* Investment Information */}

              <div className="farm-investment__content">
                <span className="farm-investment__eyebrow">
                  G R O W &nbsp; W I T H &nbsp; T H E &nbsp; F A R M
                </span>

                <h2>
                  Help us grow
                  <br />
                  what's next.
                </h2>

                <p className="farm-investment__intro">
                  Some of our farm projects may be opened for people who want to
                  participate in their growth. Explore the opportunities
                  currently available.
                </p>

                <div className="farm-investment__opportunity">
                  <div className="farm-investment__opportunity-header">
                    <span>F E A T U R E D &nbsp; O P P O R T U N I T Y</span>

                    <span className="farm-investment__status">
                      <span className="farm-investment__status-dot"></span>
                      OPEN
                    </span>
                  </div>

                  <h3>{investmentOpportunities[0].project.title}</h3>

                  <p>
                    {investmentOpportunities[0].description ||
                      investmentOpportunities[0].project.description}
                  </p>

                  <div className="farm-investment__details">
                    <div>
                      <span>Minimum Participation</span>
                      <strong>
                        ৳
                        {investmentOpportunities[0].funding.minimum.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>
                        {investmentOpportunities[0].duration.value}{" "}
                        {investmentOpportunities[0].duration.unit}
                      </strong>
                    </div>

                    <div>
                      <span>Settlement</span>
                      <strong>
                        {
                          investmentOpportunities[0].settlement
                            .daysAfterCompletion
                        }{" "}
                        days
                        <small>after completion</small>
                      </strong>
                    </div>
                  </div>

                  <div className="farm-investment__actions">
                    <Link
                      to="/invest"
                      className="farm-investment__primary-link"
                    >
                      View Opportunity
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Farm Gallery */}

      <section ref={farmGalleryRef} className="farm-gallery section">
        <div className="container">
          <div className="farm-gallery__header">
            <SectionHeading
              eyebrow="L I F E &nbsp; O N &nbsp; T H E &nbsp; F A R M"
              title="A glimpse of everyday life."
              description="The work, the quiet moments, the changing seasons, and everything in between."
            />
          </div>

          <div className="farm-gallery__grid">
            {galleryImages.slice(0, 5).map((image) => (
              <GalleryItem key={image.id} {...image} />
            ))}
          </div>

          <div className="farm-gallery__footer">
            <Link to="/gallery">
              View Farm Memories
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy */}

      <section ref={farmPhilosophyRef} className="farm-philosophy section">
        <div className="container">
          <div className="farm-philosophy__grid">
            <div>
              <span className="farm-philosophy__eyebrow">
                O U R &nbsp; P H I L O S O P H Y
              </span>

              <h2>
                Grow locally.
                <br />
                Live simply.
              </h2>
            </div>

            <div className="farm-philosophy__values">
              <div>
                <span>01</span>
                <h3>Respect the land.</h3>
                <p>
                  We work with the land rather than treating it simply as a
                  resource.
                </p>
              </div>

              <div>
                <span>02</span>
                <h3>Grow with purpose.</h3>
                <p>
                  Every project should have a reason, whether it's food,
                  learning, or community.
                </p>
              </div>

              <div>
                <span>03</span>
                <h3>Share the experience.</h3>
                <p>
                  We want people to experience the farm, not just look at it
                  from a distance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}

      <section ref={farmCtaRef} className="farm-cta">
        <div className="container farm-cta__content">
          <span>C O M E &nbsp; S E E &nbsp; T H E &nbsp; F A R M</span>

          <h2>
            There's always
            <br />
            something growing.
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

export default Farm;
