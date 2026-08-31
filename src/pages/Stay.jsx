import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import StayCard from "../components/StayCard";

import stays from "../data/stays";

import "./Stay.css";

function Stay() {
  return (
    <main className="stay-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="stay-hero">
        <div className="stay-hero__image">
          <img
            src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside accommodation"
          />
        </div>

        <div className="stay-hero__overlay"></div>

        <div className="container stay-hero__content">
          <span className="stay-hero__eyebrow">STAY WITH US</span>

          <h1>
            Stay close
            <br />
            to the land.
          </h1>

          <p>
            Wake up to open fields, quiet mornings, fresh food, and the everyday
            rhythm of countryside life.
          </p>
        </div>
      </section>

      {/* ========================================
          INTRO
      ======================================== */}

      <section className="stay-intro section">
        <div className="container stay-intro__grid">
          <div className="stay-intro__label">
            <span>THE EXPERIENCE</span>
          </div>

          <div className="stay-intro__content">
            <h2>
              Not a hotel.
              <br />A place to slow down.
            </h2>

            <p>
              Our homestay is part of the farm itself. There are fields outside
              the window, animals nearby, and plenty of space to simply do
              nothing for a while.
            </p>

            <p>
              Choose between our traditional Mud House or the more comfortable
              Farm House and experience the countryside at your own pace.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          ACCOMMODATION
      ======================================== */}

      <section className="stay-accommodation section">
        <div className="container">
          <div className="stay-accommodation__header">
            <SectionHeading
              eyebrow="ACCOMMODATION"
              title="Choose your stay."
              description="Two different ways to experience the farm, each with its own character."
            />
          </div>

          <div className="stay-accommodation__list">
            {stays.map((stay) => (
              <StayCard key={stay.id} {...stay} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          WHAT TO EXPECT
      ======================================== */}

      <section className="stay-expect section">
        <div className="container">
          <SectionHeading
            eyebrow="WHAT TO EXPECT"
            title="Simple things. Done well."
            description="Our stay is about comfort without losing the feeling of being in the countryside."
          />

          <div className="stay-expect__grid">
            <div className="stay-expect__item">
              <span>01</span>

              <h3>Fresh Farm Food</h3>

              <p>
                Enjoy seasonal ingredients and simple meals inspired by what
                grows around us.
              </p>
            </div>

            <div className="stay-expect__item">
              <span>02</span>

              <h3>Quiet Mornings</h3>

              <p>
                Wake up to birds, open fields, fresh air, and a slower start to
                the day.
              </p>
            </div>

            <div className="stay-expect__item">
              <span>03</span>

              <h3>Open Countryside</h3>

              <p>
                Explore the farm, surrounding paths, fields, and nearby village.
              </p>
            </div>

            <div className="stay-expect__item">
              <span>04</span>

              <h3>Farm Life</h3>

              <p>
                Get involved if you want, or simply watch the farm come alive
                around you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          EXPERIENCES
      ======================================== */}

      <section className="stay-experiences section">
        <div className="container stay-experiences__grid">
          <div className="stay-experiences__image">
            <img
              src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=85"
              alt="Countryside experience"
              loading="lazy"
            />
          </div>

          <div className="stay-experiences__content">
            <span className="stay-experiences__eyebrow">FARM EXPERIENCES</span>

            <h2>
              Your stay can be
              <br />
              as simple as you want.
            </h2>

            <p>
              Spend the morning helping in the garden, take a walk through the
              village, feed the animals, or simply sit outside and watch the day
              pass.
            </p>

            <Link to="/farm" className="stay-page__link">
              Explore Farm Experiences
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          GUEST JOURNEY
      ======================================== */}

      <section className="guest-journey section">
        <div className="container">
          <div className="guest-journey__header">
            <SectionHeading
              eyebrow="YOUR STAY"
              title="Arrive. Explore. Slow down."
              description="A simple rhythm for your time at Mondol's Farm."
            />
          </div>

          <div className="guest-journey__steps">
            <div className="guest-journey__step">
              <span>01</span>

              <h3>Arrive</h3>

              <p>
                Leave the busy routine behind and settle into the countryside.
              </p>
            </div>

            <div className="guest-journey__step">
              <span>02</span>

              <h3>Explore</h3>

              <p>Walk around the farm and discover what's growing.</p>
            </div>

            <div className="guest-journey__step">
              <span>03</span>

              <h3>Eat</h3>

              <p>Enjoy simple food connected to the farm and the season.</p>
            </div>

            <div className="guest-journey__step">
              <span>04</span>

              <h3>Relax</h3>

              <p>Find a quiet corner and let the day move at its own pace.</p>
            </div>

            <div className="guest-journey__step">
              <span>05</span>

              <h3>Experience</h3>

              <p>Join farm activities or explore the surrounding village.</p>
            </div>

            <div className="guest-journey__step">
              <span>06</span>

              <h3>Leave</h3>

              <p>Take a few memories of the countryside home with you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section className="stay-cta">
        <div className="stay-cta__image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside landscape"
            loading="lazy"
          />
        </div>

        <div className="stay-cta__overlay"></div>

        <div className="container stay-cta__content">
          <span>YOUR COUNTRYSIDE ESCAPE</span>

          <h2>
            Stay for a while.
            <br />
            Remember it longer.
          </h2>

          <Link to="/contact" className="button button--light">
            Check Availability
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Stay;