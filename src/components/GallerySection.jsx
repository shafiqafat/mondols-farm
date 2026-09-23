import { Link } from "react-router-dom";

import SectionHeading from "./SectionHeading";
import GalleryItem from "./GalleryItem";

import galleryImages from "../data/gallery";

import "./GallerySection.css";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function GallerySection({ home = false }) {
  const galleryRef = useRef(null);

  useEffect(() => {
    const section = galleryRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const header = section.querySelector(".gallery-section__header");
    const items = section.querySelectorAll(".gallery-item");
    const footer = section.querySelector(".gallery-section__footer");

    const ctx = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 25,
      });

      gsap.set(items, {
        opacity: 0,
        y: 35,
        scale: 0.96,
      });

      gsap.set(footer, {
        opacity: 0,
        y: 20,
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
        .to(header, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          items,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
          },
          0.2,
        )
        .to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.7,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={galleryRef}
      className={`gallery-section section ${
        home ? "gallery-section--home" : ""
      }`}
    >
      <div className="container">
        <div className="gallery-section__header">
          <SectionHeading
            eyebrow="F A R M &nbsp; M E M O R I E S"
            title="Life between the fields."
            description="A collection of moments, seasons, people, and everyday life from around the farm."
          />
        </div>

        <div className="gallery-section__grid">
          {galleryImages.slice(0, 5).map((image) => (
            <GalleryItem key={image.id} {...image} />
          ))}
        </div>

        <div className="gallery-section__footer">
          <Link to="/gallery">
            View All Memories
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
