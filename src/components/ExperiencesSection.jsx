import SectionHeading from "./SectionHeading";
import ExperienceItem from "./ExperienceItem";

import experiences from "../data/experiences";

import riverImage from "../assets/image/experiences/river.jpg";

import "./ExperiencesSection.css";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ExperiencesSection() {
  const experiencesRef = useRef(null);

  useEffect(() => {
    const section = experiencesRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const intro = section.querySelector(".experiences__intro");
    const image = section.querySelector(".experiences__image");
    const items = section.querySelectorAll(".experience-item");

    const ctx = gsap.context(() => {
      gsap.set(intro, {
        opacity: 0,
        x: -40,
      });

      gsap.set(image, {
        opacity: 0,
        y: 35,
        scale: 1.04,
      });

      gsap.set(items, {
        opacity: 0,
        x: 40,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(intro, {
          opacity: 1,
          x: 0,
          duration: 0.8,
        })
        .to(
          image,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
          },
          0.25,
        )
        .to(
          items,
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            stagger: 0.12,
          },
          0.35,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={experiencesRef}
      className="experiences experiences--home-transition section"
    >
      <div className="container">
        <div className="experiences__grid">
          {/* Left side */}

          <div className="experiences__intro">
            <SectionHeading
              eyebrow="F A R M &nbsp; E X P E R I E N C E S"
              title="Experience the rhythm of rural life."
              description="There's more to farm life than growing food. Come slow down, get involved, and experience the countryside at your own pace."
            />

            <div className="experiences__image">
              <img
                src={riverImage}
                alt="River flowing through a countryside landscape"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right side */}

          <div className="experiences__list">
            {experiences.map((experience) => (
              <ExperienceItem key={experience.id} {...experience} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExperiencesSection;
