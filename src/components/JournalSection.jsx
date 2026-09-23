import SectionHeading from "./SectionHeading";
import JournalCard from "./JournalCard";
import journalPosts from "../data/journal";
import "./JournalSection.css";
import { Link } from "react-router-dom";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function JournalSection() {
  const journalRef = useRef(null);

  useEffect(() => {
    const section = journalRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const header = section.querySelector(".journal-section__header");
    const cards = section.querySelectorAll(".journal-card");
    const footer = section.querySelector(".journal-section__footer");

    const ctx = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 25,
      });

      gsap.set(cards, {
        opacity: 0,
        y: 45,
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
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
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

  const featuredPost =
    journalPosts.find((post) => post.featured) || journalPosts[0];

  const regularPosts = journalPosts.filter(
    (post) => post.id !== featuredPost?.id,
  );

  return (
    <section ref={journalRef} className="journal-section section">
      <div className="container">
        <div className="journal-section__header">
          <SectionHeading
            eyebrow="F R O M &nbsp; T H E &nbsp; J O U R N A L"
            title="Stories from the farm."
            description="Notes on farming, food, rural life, and the changing seasons."
          />
        </div>

        <div className="journal-section__grid">
          {/* Featured article */}
          {featuredPost && <JournalCard {...featuredPost} featured />}

          {/* Two regular articles */}
          {regularPosts.slice(0, 2).map((post) => (
            <JournalCard key={post.id} {...post} />
          ))}
        </div>

        <div className="journal-section__footer">
          <Link to="/journal">
            Explore Journal
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default JournalSection;
