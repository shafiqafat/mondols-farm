import { Link } from "react-router-dom";

import SectionHeading from "./SectionHeading";
import StayCard from "./StayCard";

import stays from "../data/stays";

import "./StaySection.css";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function StaySection({ home = false }) {
  const stayRef = useRef(null);

  useEffect(() => {
    const section = stayRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const header = section.querySelector(".stay-section__header");
    const cards = section.querySelectorAll(".stay-card");
    const footer = section.querySelector(".stay-section__footer");

    const ctx = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 25,
      });

      gsap.set(cards, {
        opacity: 0,
        y: 50,
      });

      if (footer) {
        gsap.set(footer, {
          opacity: 0,
          y: 20,
        });
      }

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
        .to(header, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
          },
          0.2,
        );

      if (footer) {
        timeline.to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.65,
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={stayRef}
      className={`stay-section section ${home ? "stay-section--home" : ""}`}
    >
      <div className="container">
        <div className="stay-section__header">
          <SectionHeading
            eyebrow="S T A Y &nbsp; W I T H &nbsp; U S"
            title="Stay close to the land."
            description="Wake up to open fields, slow mornings, and the everyday rhythm of countryside life."
          />
        </div>

        <div className="stay-section__list">
          {stays.map((stay) => (
            <StayCard key={stay.id} {...stay} />
          ))}
        </div>

        {home && (
          <div className="stay-section__footer">
            <Link to="/stay">
              View All Stays
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default StaySection;
