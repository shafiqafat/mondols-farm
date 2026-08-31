import { Link } from "react-router-dom";
import "./FinalCTA.css";

function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta__image">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
          alt="Countryside landscape at Mondol's Farm"
          loading="lazy"
        />
      </div>

      <div className="final-cta__overlay"></div>

      <div className="container final-cta__content">
        <span className="final-cta__eyebrow">
          C O M E &nbsp; E X P E R I E N C E &nbsp; T H E &nbsp; F A R M
        </span>

        <h2>
          Come experience
          <br />
          the farm.
        </h2>

        <p>
          Come spend some time with us, explore the farm, and experience a
          slower side of countryside life.
        </p>

        <div className="final-cta__actions">
          <Link to="/stay" className="button button--light">
            Book a Stay
          </Link>

          <Link to="/contact" className="button button--outline-light">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
