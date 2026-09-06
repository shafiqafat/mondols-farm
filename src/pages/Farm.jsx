import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import ProjectCard from "../components/ProjectCard";
import GalleryItem from "../components/GalleryItem";

import projects from "../data/projects";
import galleryImages from "../data/gallery";

import mustardCultivation from "../assets/image/projects/mustard-cultivation.jpg";

import "./Farm.css";

function Farm() {
  return (
    <main className="farm-page">
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
