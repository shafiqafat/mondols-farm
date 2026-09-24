import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./Footer.css";

gsap.registerPlugin(ScrollTrigger);

function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const footer = footerRef.current;

    if (!footer) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const mainItems = footer.querySelectorAll(
      ".footer__brand, .footer__column",
    );
    const newsletter = footer.querySelector(".footer__newsletter");
    const bottom = footer.querySelector(".footer__bottom");

    const ctx = gsap.context(() => {
      gsap.set(mainItems, {
        opacity: 0,
        y: 25,
      });

      gsap.set([newsletter, bottom], {
        opacity: 0,
        y: 30,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: "top 85%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(mainItems, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
        })
        .to(
          newsletter,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          "-=0.45",
        )
        .to(
          bottom,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          "-=0.4",
        );
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="footer">
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
            <span className="footer__heading">E X P L O R E</span>

            <nav>
              <Link to="/farm">Farm</Link>

              <Link to="/stay">Stay</Link>

              <Link to="/shop">Shop</Link>

              <Link to="/journal">Journal</Link>
            </nav>
          </div>

          {/* DISCOVER */}

          <div className="footer__column">
            <span className="footer__heading">D I S C O V E R</span>

            <nav>
              <Link to="/gallery">Gallery</Link>

              <Link to="/invest">Invest</Link>

              <Link to="/about">About</Link>

              <Link to="/contact">Contact</Link>
            </nav>
          </div>

          {/* CONTACT */}

          <div className="footer__column">
            <span className="footer__heading">F I N D &nbsp; U S</span>

            <address>
              Mondol's Farm
              <br />
              Naogaon, Bangladesh
            </address>

            {/* <a href="mailto:hello@mondolsfarm.com">hello@mondolsfarm.com</a> */}
            <a href="mailto:Srahman0123@gmail.com.com">
              Srahman0123@gmail.com.com
            </a>

            <a href="tel:+8801534282793">+880 1534282793</a>
          </div>
        </div>

        {/* ========================================
            NEWSLETTER
        ======================================== */}

        <div className="footer__newsletter">
          <div>
            <span className="footer__heading">
              F A R M &nbsp; J O U R N A L
            </span>

            <h3>
              Stories from the farm,
              <br />
              delivered occasionally.
            </h3>
          </div>

          <form className="footer__form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
            />

            <button type="submit">
              Subscribe
              <span>→</span>
            </button>
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
