import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import SectionHeading from "../components/SectionHeading";
import ProjectCard from "../components/ProjectCard";
import GalleryItem from "../components/GalleryItem";

import projects from "../data/projects";
import galleryImages from "../data/gallery";
import { getOpenInvestmentOpportunities } from "../data/investmentUtils";

import mustardCultivation from "../assets/image/projects/mustard-cultivation.jpg";
import PageMeta from "../components/PageMeta";

import "./Farm.css";

function Farm() {
  const investmentOpportunities = getOpenInvestmentOpportunities();

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

  return (
    <main className="farm-page">
      <PageMeta
        title="The Farm"
        description="Explore the crops, livestock, and farming projects growing at Mondol's Farm."
      />
      {/* Hero */}

      <section className="farm-hero">
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

      <section className="farm-introduction section">
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

      <section className="farm-projects section">
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

      <section className="farm-grow section">
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
        <section className="farm-investment section">
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

      <section className="farm-gallery section">
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

      <section className="farm-philosophy section">
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

      <section className="farm-cta">
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
