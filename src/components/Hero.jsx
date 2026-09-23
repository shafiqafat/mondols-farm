import { useEffect, useRef } from "react";
import gsap from "gsap";

import "./Hero.css";
import Button from "./Button";
import heroImage from "../assets/image/hero/hero-image.jpg";

function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) return;

    const image = hero.querySelector(".hero__image img");
    const overlay = hero.querySelector(".hero__overlay");
    const eyebrow = hero.querySelector(".hero__eyebrow");
    const headingLines = hero.querySelectorAll(".hero__title-line");
    const description = hero.querySelector(".hero__description");
    const actions = hero.querySelector(".hero__actions");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const runAnimation = () => {
      if (prefersReducedMotion) {
        gsap.set(
          [image, overlay, eyebrow, headingLines, description, actions],
          {
            clearProps: "all",
          },
        );

        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      gsap.set(image, {
        scale: 1.12,
        yPercent: 2,
      });

      gsap.set(overlay, {
        opacity: 0,
      });

      gsap.set([eyebrow, ...headingLines, description, actions], {
        opacity: 0,
        y: 30,
      });

      timeline
        .to(
          image,
          {
            scale: 1.05,
            yPercent: 0,
            duration: 2,
            ease: "power2.out",
          },
          0,
        )
        .to(
          overlay,
          {
            opacity: 1,
            duration: 1.2,
            ease: "power2.out",
          },
          0.15,
        )
        .to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          0.35,
        )
        .to(
          headingLines,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
          },
          0.5,
        )
        .to(
          description,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          0.95,
        )
        .to(
          actions,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          1.15,
        );

      return () => {
        timeline.kill();
      };
    };

    if (!document.querySelector(".initial-loader")) {
      return runAnimation();
    }

    const observer = new MutationObserver(() => {
      if (!document.querySelector(".initial-loader")) {
        observer.disconnect();
        runAnimation();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={heroRef} className="hero">
      <div className="hero__image">
        <img src={heroImage} alt="Green countryside landscape" />
      </div>

      <div className="hero__overlay"></div>

      <div className="container hero__content">
        <div className="hero__text">
          <span className="hero__eyebrow">M O N D O L ' S &nbsp; F A R M</span>

          <h1>
            <span className="hero__title-line">A slower life,</span>
            <span className="hero__title-line">closer to nature.</span>
          </h1>

          <p className="hero__description">
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