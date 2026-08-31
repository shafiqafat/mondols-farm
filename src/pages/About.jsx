import { Link } from "react-router-dom";

import "./About.css";

function About() {
  return (
    <main className="about-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="about-hero">
        <div className="container about-hero__content">
          <span className="about-hero__eyebrow">ABOUT MONDOL'S FARM</span>

          <h1>
            Built from
            <br />
            the soil up.
          </h1>

          <p>
            A small farm built around growing good food, living simply, and
            creating a place where people can reconnect with rural life.
          </p>
        </div>
      </section>

      {/* ========================================
          OUR STORY
      ======================================== */}

      <section className="about-story section">
        <div className="container about-story__grid">
          <div className="about-story__image">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85"
              alt="Countryside farmland"
            />
          </div>

          <div className="about-story__content">
            <span className="about-eyebrow">OUR STORY</span>

            <h2>It started with a simple idea.</h2>

            <p>
              Mondol's Farm began with a desire to build something connected to
              the land — a place where farming, food, family, and everyday rural
              life could exist together.
            </p>

            <p>
              Rather than trying to build everything at once, we're taking a
              slower approach. Each project is an opportunity to learn, improve,
              and understand what works for the farm.
            </p>

            <p>
              From growing seasonal vegetables to raising animals and welcoming
              guests, every part of the farm contributes to the same vision:
              creating a meaningful connection between people and the
              countryside.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          PHILOSOPHY
      ======================================== */}

      <section className="about-philosophy section">
        <div className="container">
          <div className="about-philosophy__heading">
            <span className="about-eyebrow">OUR PHILOSOPHY</span>

            <h2>
              Grow locally.
              <br />
              Live simply.
              <br />
              Share the experience.
            </h2>
          </div>

          <div className="about-philosophy__text">
            <p>
              We don't believe a farm needs to be enormous to be meaningful.
            </p>

            <p>
              Our focus is on responsible, small-scale farming and creating
              experiences that feel genuine rather than manufactured.
            </p>

            <p>
              That means respecting the seasons, learning from the land, using
              what we produce, and sharing the process with the people who
              visit.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          VALUES
      ======================================== */}

      <section className="about-values section">
        <div className="container">
          <div className="about-section-heading">
            <span className="about-eyebrow">WHAT MATTERS TO US</span>

            <h2>
              The principles behind
              <br />
              the farm.
            </h2>
          </div>

          <div className="about-values__grid">
            <article>
              <span>01</span>

              <h3>Grow Responsibly</h3>

              <p>
                We aim to work with the land rather than simply taking from it.
              </p>
            </article>

            <article>
              <span>02</span>

              <h3>Keep It Simple</h3>

              <p>
                Small projects, practical decisions, and a focus on what
                genuinely works.
              </p>
            </article>

            <article>
              <span>03</span>

              <h3>Respect the Seasons</h3>

              <p>
                What we grow and produce follows the natural rhythm of the year.
              </p>
            </article>

            <article>
              <span>04</span>

              <h3>Share Rural Life</h3>

              <p>
                The farm is also a place for people to slow down and experience
                the countryside.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ========================================
          TIMELINE
      ======================================== */}

      <section className="about-timeline section">
        <div className="container">
          <div className="about-section-heading">
            <span className="about-eyebrow">THE JOURNEY</span>

            <h2>
              One project
              <br />
              at a time.
            </h2>
          </div>

          <div className="about-timeline__list">
            <div className="about-timeline__item">
              <span>01</span>

              <div>
                <small>THE BEGINNING</small>

                <h3>The idea</h3>

                <p>
                  The vision for a small countryside farm begins with a desire
                  to return closer to the land.
                </p>
              </div>
            </div>

            <div className="about-timeline__item">
              <span>02</span>

              <div>
                <small>FIRST PROJECTS</small>

                <h3>Starting small</h3>

                <p>
                  Initial farming projects begin, allowing us to learn what
                  works and build practical experience.
                </p>
              </div>
            </div>

            <div className="about-timeline__item">
              <span>03</span>

              <div>
                <small>THE HOMESTAY</small>

                <h3>Opening the farm</h3>

                <p>
                  The farm expands into a countryside experience where visitors
                  can stay, explore, and slow down.
                </p>
              </div>
            </div>

            <div className="about-timeline__item">
              <span>04</span>

              <div>
                <small>THE FUTURE</small>

                <h3>Growing together</h3>

                <p>
                  New agricultural projects, experiences, and ideas will
                  continue to shape the farm over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          FUTURE VISION
      ======================================== */}

      <section className="about-vision">
        <div className="about-vision__image">
          <img
            src="https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=2000&q=85"
            alt="Trees and countryside"
          />
        </div>

        <div className="about-vision__overlay"></div>

        <div className="container about-vision__content">
          <span>LOOKING AHEAD</span>

          <h2>
            A little more
            <br />
            connected to nature.
          </h2>

          <p>
            Our vision is simple: grow the farm gradually, create a meaningful
            countryside experience, and build something that can be enjoyed for
            generations.
          </p>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section className="about-cta">
        <div className="container">
          <span>COME SEE IT FOR YOURSELF</span>

          <h2>The farm is waiting.</h2>

          <div className="about-cta__buttons">
            <Link to="/stay" className="button button--light">
              Stay With Us
            </Link>

            <Link to="/farm" className="button button--outline-light">
              Explore the Farm
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
