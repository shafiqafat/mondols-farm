import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import PageMeta from "../components/PageMeta";
import {
  getOpenInvestmentOpportunities,
  getInvestmentOpportunities,
} from "../data/investmentUtils";
import InvestmentOpportunityCard from "../components/InvestmentOpportunityCard";
import investHero from "../assets/image/hero/invest-hero.png";

import "./Invest.css";

gsap.registerPlugin(ScrollTrigger);

function Invest() {
  const investHeroRef = useRef(null);
  const opportunitiesRef = useRef(null);
  const upcomingRef = useRef(null);
  const processRef = useRef(null);
  const ctaRef = useRef(null);
  const opportunities = getOpenInvestmentOpportunities();
  const upcomingOpportunities = getInvestmentOpportunities().filter(
    (opportunity) => opportunity.status === "COMING_SOON",
  );

  useEffect(() => {
    const section = investHeroRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".invest-hero__image img");
    const overlay = section.querySelector(".invest-hero__overlay");
    const back = section.querySelector(".invest-hero__back");
    const eyebrow = section.querySelector(".invest-hero__eyebrow");
    const heading = section.querySelector("h1");
    const paragraph = section.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set([back, eyebrow, heading, paragraph], { opacity: 0, y: 24 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(image, { scale: 1.03, duration: 1.5, ease: "power2.out" })
        .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
        .to(back, { opacity: 1, y: 0, duration: 0.5 }, 0.2)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.25")
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, "-=0.2")
        .to(paragraph, { opacity: 1, y: 0, duration: 0.65 }, "-=0.2");
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = opportunitiesRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const header = section.querySelector(".invest-opportunities__header");
    const cards = section.querySelectorAll(".invest-opportunity");
    const empty = section.querySelector(".invest-empty");

    const ctx = gsap.context(() => {
      gsap.set(header, { opacity: 0, y: 25 });

      if (cards.length) {
        gsap.set(cards, { opacity: 0, y: 45 });
      }

      if (empty) {
        gsap.set(empty, { opacity: 0, y: 35 });
      }

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
        defaults: { ease: "power3.out" },
      });

      timeline.to(header, { opacity: 1, y: 0, duration: 0.7 });

      if (cards.length) {
        timeline.to(
          cards,
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.14 },
          "-=0.25",
        );
      }

      if (empty) {
        timeline.to(empty, { opacity: 1, y: 0, duration: 0.7 }, "-=0.2");
      }
    }, section);

    return () => ctx.revert();
  }, [opportunities.length]);

  useEffect(() => {
    const section = upcomingRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const header = section.querySelector(".invest-upcoming__header");
    const cards = section.querySelectorAll(".invest-opportunity");

    const ctx = gsap.context(() => {
      gsap.set(header, { opacity: 0, y: 25 });
      gsap.set(cards, { opacity: 0, y: 45 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(header, { opacity: 1, y: 0, duration: 0.7 })
        .to(
          cards,
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.14 },
          "-=0.25",
        );
    }, section);

    return () => ctx.revert();
  }, [upcomingOpportunities.length]);

  useEffect(() => {
    const section = processRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const intro = section.querySelector(
      ".invest-process__grid > div:first-child",
    );
    const steps = section.querySelectorAll(".invest-process__step");

    const ctx = gsap.context(() => {
      gsap.set(intro, { opacity: 0, x: -40 });
      gsap.set(steps, { opacity: 0, x: 40 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(intro, { opacity: 1, x: 0, duration: 0.8 })
        .to(
          steps,
          { opacity: 1, x: 0, duration: 0.65, stagger: 0.12 },
          "-=0.45",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = ctaRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const content = section.querySelector(".invest-cta__content");
    const eyebrow = section.querySelector(".invest-cta__eyebrow");
    const heading = section.querySelector("h2");
    const paragraph = section.querySelector("p");
    const link = section.querySelector(".invest-cta__link");

    const ctx = gsap.context(() => {
      gsap.set(section, { backgroundSize: "108% auto" });
      gsap.set(content, { opacity: 0, y: 30 });
      gsap.set([eyebrow, heading, paragraph, link], { opacity: 0, y: 20 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(section, {
          backgroundSize: "100% auto",
          duration: 1.4,
          ease: "power2.out",
        })
        .to(content, { opacity: 1, y: 0, duration: 0.7 }, 0.15)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.2")
        .to(paragraph, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2")
        .to(link, { opacity: 1, y: 0, duration: 0.55 }, "-=0.15");
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <main className="invest-page">
      <PageMeta
        title="Investment Opportunities"
        description="Explore current opportunities to participate in selected projects at Mondol's Farm."
      />

      {/* HERO */}

      <section ref={investHeroRef} className="invest-hero">
        <div className="invest-hero__image">
          <img src={investHero} alt="Countryside farm landscape" />
        </div>

        <div className="invest-hero__overlay"></div>

        <div className="container invest-hero__content">
          <Link to="/farm" className="invest-hero__back">
            ← Back to Farm
          </Link>

          <span className="invest-hero__eyebrow">
            G R O W &nbsp; W I T H &nbsp; U S
          </span>

          <h1>
            Opportunities
            <br />
            rooted in the farm.
          </h1>

          <p>
            From livestock to seasonal farming, some of our projects may be
            opened for people who want to participate in their growth.
          </p>
        </div>
      </section>

      {/* OPPORTUNITIES */}

      <section ref={opportunitiesRef} className="invest-opportunities section">
        <div className="container">
          <div className="invest-opportunities__header">
            <div>
              <span className="invest-opportunities__eyebrow">
                C U R R E N T &nbsp; O P P O R T U N I T I E S
              </span>

              <h2>
                Projects currently
                <br />
                open for participation.
              </h2>
            </div>

            <p>
              Each opportunity is connected to an actual project being developed
              at Mondol's Farm.
            </p>
          </div>

          {opportunities.length > 0 ? (
            <div className="invest-opportunities__list">
              {opportunities.map((opportunity) => (
                <InvestmentOpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                />
              ))}
            </div>
          ) : (
            <div className="invest-empty">
              <span>NO CURRENT OPPORTUNITIES</span>

              <h3>
                Nothing is open
                <br />
                right now.
              </h3>

              <p>
                Our projects continue to grow, and new opportunities may open as
                the farm develops.
              </p>

              <Link to="/farm" className="invest-empty__link">
                Explore the Farm
                <span>→</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* UPCOMING OPPORTUNITIES */}

      {upcomingOpportunities.length > 0 && (
        <section ref={upcomingRef} className="invest-upcoming section">
          <div className="container">
            <div className="invest-upcoming__header">
              <div>
                <span className="invest-upcoming__eyebrow">
                  U P C O M I N G &nbsp; O P P O R T U N I T I E S
                </span>

                <h2>
                  More projects
                  <br />
                  are taking shape.
                </h2>
              </div>

              <p>
                These projects are being developed at the farm and may become
                available for participation as their plans take shape.
              </p>
            </div>

            <div className="invest-upcoming__list">
              {upcomingOpportunities.map((opportunity) => (
                <InvestmentOpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}

      <section ref={processRef} className="invest-process section">
        <div className="container">
          <div className="invest-process__grid">
            <div>
              <span className="invest-process__eyebrow">
                H O W &nbsp; I T &nbsp; W O R K S
              </span>

              <h2>
                Participation
                <br />
                starts with
                <br />
                understanding.
              </h2>
            </div>

            <div className="invest-process__steps">
              <div className="invest-process__step">
                <span>01</span>

                <div>
                  <h3>Choose a project</h3>

                  <p>
                    Explore the farm project behind each available opportunity
                    and understand what the funds are intended to support.
                  </p>
                </div>
              </div>

              <div className="invest-process__step">
                <span>02</span>

                <div>
                  <h3>Review the opportunity</h3>

                  <p>
                    Each project has its own funding requirement, duration,
                    risks, and participation terms.
                  </p>
                </div>
              </div>

              <div className="invest-process__step">
                <span>03</span>

                <div>
                  <h3>Express your interest</h3>

                  <p>
                    For now, participation begins with an enquiry so we can
                    discuss the project and its terms directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        ref={ctaRef}
        className="invest-cta"
        style={{ backgroundImage: `url(${investHero})` }}
      >
        <div className="invest-cta__overlay"></div>

        <div className="container invest-cta__content">
          <span className="invest-cta__eyebrow">
            G R O W &nbsp; W I T H &nbsp; U S
          </span>

          <h2>
            Interested in
            <br />
            participating?
          </h2>

          <p>
            Explore an opportunity, understand the project, and start a
            conversation with us before making any commitment.
          </p>

          <Link to="/contact" className="invest-cta__link">
            Start a Conversation
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Invest;
