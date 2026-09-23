import { Link } from "react-router-dom";
import "./FinalCTA.css";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function FinalCTA() {
  const ctaRef = useRef(null);

  useEffect(() => {
    const section = ctaRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const image = section.querySelector(".final-cta__image img");
    const overlay = section.querySelector(".final-cta__overlay");
    const eyebrow = section.querySelector(".final-cta__eyebrow");
    const heading = section.querySelector("h2");
    const paragraph = section.querySelector("p");
    const actions = section.querySelector(".final-cta__actions");

    const ctx = gsap.context(() => {
      gsap.set(image, {
        scale: 1.08,
      });

      gsap.set(overlay, {
        opacity: 0,
      });

      gsap.set([eyebrow, heading, paragraph, actions], {
        opacity: 0,
        y: 30,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(image, {
          scale: 1,
          duration: 1.4,
          ease: "power2.out",
        })
        .to(
          overlay,
          {
            opacity: 1,
            duration: 0.8,
          },
          0,
        )
        .to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
          },
          0.45,
        )
        .to(
          heading,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          0.55,
        )
        .to(
          paragraph,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.7,
        )
        .to(
          actions,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.85,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ctaRef} className="final-cta">
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
            <span>→</span>
          </Link>

          <Link to="/contact" className="button button--outline-light">
            Get in Touch
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
