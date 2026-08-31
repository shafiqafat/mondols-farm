import { Link } from "react-router-dom";

import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* ========================================
            MAIN FOOTER
        ======================================== */}

        <div className="footer__main">
          {/* BRAND */}

          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              MONDOL'S FARM
            </Link>

            <p>
              A small countryside farm growing good food, creating meaningful
              stays, and sharing the simple rhythms of rural life.
            </p>
          </div>

          {/* EXPLORE */}

          <div className="footer__column">
            <span className="footer__heading">EXPLORE</span>

            <nav>
              <Link to="/farm">Farm</Link>

              <Link to="/stay">Stay</Link>

              <Link to="/shop">Shop</Link>

              <Link to="/journal">Journal</Link>
            </nav>
          </div>

          {/* DISCOVER */}

          <div className="footer__column">
            <span className="footer__heading">DISCOVER</span>

            <nav>
              <Link to="/gallery">Gallery</Link>

              <Link to="/about">About</Link>

              <Link to="/contact">Contact</Link>
            </nav>
          </div>

          {/* CONTACT */}

          <div className="footer__column">
            <span className="footer__heading">FIND US</span>

            <address>
              Mondol's Farm
              <br />
              Naugaon, Bangladesh
            </address>

            <a href="mailto:hello@mondolsfarm.com">hello@mondolsfarm.com</a>

            <a href="tel:+8801000000000">+880 1000-000000</a>
          </div>
        </div>

        {/* ========================================
            NEWSLETTER
        ======================================== */}

        <div className="footer__newsletter">
          <div>
            <span className="footer__heading">FARM JOURNAL</span>

            <h3>
              Stories from the farm,
              <br />
              delivered occasionally.
            </h3>
          </div>

          <form className="footer__form">
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
            />

            <button type="submit">Subscribe →</button>
          </form>
        </div>

        {/* ========================================
            BOTTOM
        ======================================== */}

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Mondol's Farm</span>

          <span>Grown with care.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
