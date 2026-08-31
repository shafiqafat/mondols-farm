import { Link } from "react-router-dom";
import "./IntroSection.css";

function IntroSection() {
  return (
    <section className="intro section">
      <div className="container intro__grid">
        {/* Image */}

        <div className="intro__image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85"
            alt="Countryside farmland"
          />
        </div>

        {/* Content */}

        <div className="intro__content">
          <span className="intro__eyebrow">O U R &nbsp; S T O R Y</span>

          <h2>
            More than a farm.
            <br />
            It's a way of life.
          </h2>

          <p>
            Mondol's Farm is a small countryside farm built around sustainable
            farming, seasonal produce, and the simple pleasures of rural living.
          </p>

          <p>
            From growing our own food to raising animals and welcoming guests
            into the countryside, everything here is rooted in a slower, more
            connected way of life.
          </p>

          <Link to="/about" className="intro__link">
            Discover Our Story
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default IntroSection;
