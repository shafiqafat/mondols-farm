import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./IntroSection.css";

gsap.registerPlugin(ScrollTrigger);
import introImage from "../assets/image/hero/intro-image.jpg";

function IntroSection() {
  const introRef = useRef(null);

  useEffect(() => {
    const intro = introRef.current;

    if (!intro) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const image = intro.querySelector(".intro__image");
    const imageElement = intro.querySelector(".intro__image img");
    const eyebrow = intro.querySelector(".intro__eyebrow");
    const heading = intro.querySelector(".intro__content h2");
    const paragraphs = intro.querySelectorAll(".intro__content p");
    const link = intro.querySelector(".intro__link");

    const ctx = gsap.context(() => {
      gsap.set(image, {
        opacity: 0,
        x: -40,
      });

      gsap.set(imageElement, {
        scale: 1.08,
      });

      gsap.set([eyebrow, heading, ...paragraphs, link], {
        opacity: 0,
        y: 30,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: intro,
          start: "top 75%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(image, {
          opacity: 1,
          x: 0,
          duration: 0.9,
        })
        .to(
          imageElement,
          {
            scale: 1,
            duration: 1.4,
            ease: "power2.out",
          },
          0,
        )
        .to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.2,
        )
        .to(
          heading,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          0.35,
        )
        .to(
          paragraphs,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
          },
          0.55,
        )
        .to(
          link,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.9,
        );
    }, intro);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={introRef} className="intro section">
      <div className="container intro__grid">
        {/* Image */}

        <div className="intro__image">
          <img src={introImage} alt="Countryside mustard farm landscape" />
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
