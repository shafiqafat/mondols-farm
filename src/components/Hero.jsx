import "./Hero.css";
import Button from "./Button";
import heroImage from "../assets/image/hero/hero-image.jpg";

function Hero() {
  return (
    <section className="hero">
      <div className="hero__image">
        <img
          src={heroImage}
          alt="Green countryside landscape"
        />
      </div>

      <div className="hero__overlay"></div>

      <div className="container hero__content">
        <div className="hero__text">
          <span className="hero__eyebrow">M O N D O L ' S &nbsp; F A R M</span>

          <h1>
            A slower life,
            <br />
            closer to nature.
          </h1>

          <p>
            A small countryside farm built around sustainable farming, seasonal
            produce, simple living, and meaningful experiences.
          </p>

          <div className="hero__actions">
            <Button to="/farm" variant="light">
              Explore the Farm
            </Button>

            <Button to="/stay" variant="outline-light">
              Book a Stay
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
