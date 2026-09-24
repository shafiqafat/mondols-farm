import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PageMeta from "../components/PageMeta";

import "./About.css";

gsap.registerPlugin(ScrollTrigger);

function About() {
  const aboutHeroRef = useRef(null);
  const aboutStoryRef = useRef(null);
  const aboutPhilosophyRef = useRef(null);
  const aboutValuesRef = useRef(null);
  const aboutTimelineRef = useRef(null);
  const aboutVisionRef = useRef(null);
  const aboutCtaRef = useRef(null);
  useEffect(() => {
    const hero = aboutHeroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const image = hero.querySelector(".about-hero__image img");
    const overlay = hero.querySelector(".about-hero__overlay");
    const eyebrow = hero.querySelector(".about-hero__eyebrow");
    const heading = hero.querySelector("h1");
    const paragraph = hero.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set([eyebrow, heading, paragraph], { opacity: 0, y: 30 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(image, { scale: 1.05, duration: 1.5, ease: "power2.out" })
        .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, 0.48)
        .to(paragraph, { opacity: 1, y: 0, duration: 0.7 }, 0.68);
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = aboutStoryRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".about-story__image");
    const content = section.querySelector(".about-story__content");

    const ctx = gsap.context(() => {
      gsap.set(image, { opacity: 0, x: -40 });
      gsap.set(content, { opacity: 0, x: 40 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(image, { opacity: 1, x: 0, duration: 0.9 })
        .to(content, { opacity: 1, x: 0, duration: 0.8 }, "-=0.55");
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = aboutPhilosophyRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".about-philosophy__heading");
    const text = section.querySelector(".about-philosophy__text");
    const paragraphs = section.querySelectorAll(".about-philosophy__text p");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, x: -40 });
      gsap.set(text, { opacity: 0, x: 40 });
      gsap.set(paragraphs, { opacity: 0, y: 20 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, x: 0, duration: 0.8 })
        .to(text, { opacity: 1, x: 0, duration: 0.75 }, "-=0.55")
        .to(
          paragraphs,
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.1 },
          "-=0.4",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = aboutValuesRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".about-section-heading");
    const values = section.querySelectorAll(".about-values__grid article");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 25 });
      gsap.set(values, { opacity: 0, y: 40 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, y: 0, duration: 0.7 })
        .to(
          values,
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
          "-=0.3",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = aboutTimelineRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".about-section-heading");
    const items = section.querySelectorAll(".about-timeline__item");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 25 });
      gsap.set(items, { opacity: 0, x: 40 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, y: 0, duration: 0.7 })
        .to(
          items,
          { opacity: 1, x: 0, duration: 0.65, stagger: 0.12 },
          "-=0.3",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = aboutVisionRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const content = section.querySelector(".about-vision__content");
    const eyebrow = content.querySelector(":scope > span");
    const heading = content.querySelector("h2");
    const paragraph = content.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(content, { opacity: 0, y: 30 });
      gsap.set([eyebrow, heading, paragraph], { opacity: 0, y: 20 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(content, { opacity: 1, y: 0, duration: 0.7 })
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.25")
        .to(paragraph, { opacity: 1, y: 0, duration: 0.65 }, "-=0.25");
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = aboutCtaRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".about-cta__image img");
    const overlay = section.querySelector(".about-cta__overlay");
    const content = section.querySelector(".about-cta__content");
    const eyebrow = content.querySelector(":scope > span");
    const heading = content.querySelector("h2");
    const buttons = content.querySelectorAll(".about-cta__buttons .button");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set(content, { opacity: 0, y: 30 });
      gsap.set([eyebrow, heading], { opacity: 0, y: 20 });
      gsap.set(buttons, { opacity: 0, y: 20 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(image, { scale: 1.03, duration: 1.4, ease: "power2.out" })
        .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
        .to(content, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(heading, { opacity: 1, y: 0, duration: 0.7 }, "-=0.25")
        .to(
          buttons,
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.1 },
          "-=0.2",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <main className="about-page">
      <PageMeta
        title="About"
        description="Learn about Mondol's Farm, our approach to farming, rural living, and building the farm step by step."
      />
      {/* ========================================
          HERO
      ======================================== */}

      <section ref={aboutHeroRef} className="about-hero">
        <div className="about-hero__image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside farmland"
            loading="eager"
          />
        </div>

        <div className="about-hero__overlay"></div>

        <div className="container about-hero__content">
          <span className="about-hero__eyebrow">
            A B O U T &nbsp; M O N D O L ' S &nbsp; F A R M
          </span>

          <h1>
            Built from
            <br />
            the soil up.
          </h1>

          <p>
            A small farm built around growing good food, living simply, and
            creating a place where people can reconnect with rural life.
          </p>
        </div>
      </section>

      {/* ========================================
          OUR STORY
      ======================================== */}

      <section ref={aboutStoryRef} className="about-story section">
        <div className="container about-story__grid">
          <div className="about-story__image">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85"
              alt="Countryside farmland"
            />
          </div>

          <div className="about-story__content">
            <span className="about-eyebrow">O U R &nbsp; S T O R Y</span>

            <h2>It started with a simple idea.</h2>

            <p>
              Mondol's Farm began with a desire to build something connected to
              the land — a place where farming, food, family, and everyday rural
              life could exist together.
            </p>

            <p>
              Rather than trying to build everything at once, we're taking a
              slower approach. Each project is an opportunity to learn, improve,
              and understand what works for the farm.
            </p>

            <p>
              From growing seasonal vegetables to raising animals and welcoming
              guests, every part of the farm contributes to the same vision:
              creating a meaningful connection between people and the
              countryside.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          PHILOSOPHY
      ======================================== */}

      <section ref={aboutPhilosophyRef} className="about-philosophy section">
        <div className="container">
          <div className="about-philosophy__heading">
            <span className="about-eyebrow">
              O U R &nbsp; P H I L O S O P H Y
            </span>

            <h2>
              Grow locally.
              <br />
              Live simply.
              <br />
              Share the experience.
            </h2>
          </div>

          <div className="about-philosophy__text">
            <p>
              We don't believe a farm needs to be enormous to be meaningful.
            </p>

            <p>
              Our focus is on responsible, small-scale farming and creating
              experiences that feel genuine rather than manufactured.
            </p>

            <p>
              That means respecting the seasons, learning from the land, using
              what we produce, and sharing the process with the people who
              visit.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          VALUES
      ======================================== */}

      <section ref={aboutValuesRef} className="about-values section">
        <div className="container">
          <div className="about-section-heading">
            <span className="about-eyebrow">
              W H A T &nbsp; M A T T E R S &nbsp; T O &nbsp; U S
            </span>

            <h2>
              The principles behind
              <br />
              the farm.
            </h2>
          </div>

          <div className="about-values__grid">
            <article>
              <span>01</span>

              <h3>Grow Responsibly</h3>

              <p>
                We aim to work with the land rather than simply taking from it.
              </p>
            </article>

            <article>
              <span>02</span>

              <h3>Keep It Simple</h3>

              <p>
                Small projects, practical decisions, and a focus on what
                genuinely works.
              </p>
            </article>

            <article>
              <span>03</span>

              <h3>Respect the Seasons</h3>

              <p>
                What we grow and produce follows the natural rhythm of the year.
              </p>
            </article>

            <article>
              <span>04</span>

              <h3>Share Rural Life</h3>

              <p>
                The farm is also a place for people to slow down and experience
                the countryside.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ========================================
          TIMELINE
      ======================================== */}

      <section ref={aboutTimelineRef} className="about-timeline section">
        <div className="container">
          <div className="about-section-heading">
            <span className="about-eyebrow">T H E &nbsp; J O U R N E Y</span>

            <h2>
              One project
              <br />
              at a time.
            </h2>
          </div>

          <div className="about-timeline__list">
            <div className="about-timeline__item">
              <span>01</span>

              <div>
                <small>THE BEGINNING</small>

                <h3>The idea</h3>

                <p>
                  The vision for a small countryside farm begins with a desire
                  to return closer to the land.
                </p>
              </div>
            </div>

            <div className="about-timeline__item">
              <span>02</span>

              <div>
                <small>FIRST PROJECTS</small>

                <h3>Starting small</h3>

                <p>
                  Initial farming projects begin, allowing us to learn what
                  works and build practical experience.
                </p>
              </div>
            </div>

            <div className="about-timeline__item">
              <span>03</span>

              <div>
                <small>THE HOMESTAY</small>

                <h3>Opening the farm</h3>

                <p>
                  The farm expands into a countryside experience where visitors
                  can stay, explore, and slow down.
                </p>
              </div>
            </div>

            <div className="about-timeline__item">
              <span>04</span>

              <div>
                <small>THE FUTURE</small>

                <h3>Growing together</h3>

                <p>
                  New agricultural projects, experiences, and ideas will
                  continue to shape the farm over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          VISION
      ======================================== */}

      <section ref={aboutVisionRef} className="about-vision">
        <div className="about-vision__overlay"></div>

        <div className="container about-vision__content">
          <span>W H E R E &nbsp; W E ' R E &nbsp; H E A D E D</span>

          <h2>
            A farm that
            <br />
            keeps growing.
          </h2>

          <p>
            There's still a lot to build. More crops to grow, animals to raise,
            experiences to create, and ways to make the farm a meaningful part
            of rural life.
          </p>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section ref={aboutCtaRef} className="about-cta">
        <div className="about-cta__image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside farmland"
            loading="lazy"
          />
        </div>

        <div className="about-cta__overlay"></div>

        <div className="container about-cta__content">
          <span>
            C O M E &nbsp; S E E &nbsp; I T &nbsp; F O R &nbsp; Y O U R S E L F
          </span>

          <h2>The farm is waiting.</h2>

          <div className="about-cta__buttons">
            <Link to="/stay" className="button button--light">
              Stay With Us
              <span>→</span>
            </Link>

            <Link to="/farm" className="button button--outline-light">
              Explore the Farm
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
