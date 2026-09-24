import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SectionHeading from "../components/SectionHeading";
import StayCard from "../components/StayCard";
import stays from "../data/stays";
import mudHouse from "../assets/image/stay/mud-house.jpg";
import PageMeta from "../components/PageMeta";

import "./Stay.css";

gsap.registerPlugin(ScrollTrigger);

function Stay() {
  const stayHeroRef = useRef(null);
  const stayIntroRef = useRef(null);
  const stayAccommodationRef = useRef(null);
  const stayExpectRef = useRef(null);
  const stayExperiencesRef = useRef(null);
  const guestJourneyRef = useRef(null);
  const stayCtaRef = useRef(null);

  useEffect(() => {
    const hero = stayHeroRef.current;
    if (!hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const image = hero.querySelector(".stay-hero__image img");
    const overlay = hero.querySelector(".stay-hero__overlay");
    const eyebrow = hero.querySelector(".stay-hero__eyebrow");
    const heading = hero.querySelector("h1");
    const paragraph = hero.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set([eyebrow, heading, paragraph], { opacity: 0, y: 30 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(image, { scale: 1.05, duration: 1.5, ease: "power2.out" })
        .to(overlay, { opacity: 0.55, duration: 0.8 }, 0.1)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, 0.48)
        .to(paragraph, { opacity: 1, y: 0, duration: 0.7 }, 0.68);
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = stayIntroRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".stay-intro__image");
    const content = section.querySelector(".stay-intro__content");

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
    const section = stayAccommodationRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".section-heading");
    const cards = section.querySelectorAll(".stay-card");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 25 });
      gsap.set(cards, { opacity: 0, y: 45 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, y: 0, duration: 0.7 })
        .to(
          cards,
          { opacity: 1, y: 0, duration: 0.75, stagger: 0.12 },
          "-=0.35",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = stayExpectRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".stay-expect__heading");
    const items = section.querySelectorAll(".stay-expect__item");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, x: -40 });
      gsap.set(items, { opacity: 0, x: 40 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, x: 0, duration: 0.8 })
        .to(
          items,
          { opacity: 1, x: 0, duration: 0.65, stagger: 0.12 },
          "-=0.45",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = stayExperiencesRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".stay-experiences__image");
    const content = section.querySelector(".stay-experiences__content");

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
    const section = guestJourneyRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".section-heading");
    const steps = section.querySelectorAll(".guest-journey__step");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 25 });
      gsap.set(steps, { opacity: 0, y: 35 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, y: 0, duration: 0.7 })
        .to(steps, { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 }, "-=0.3");
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = stayCtaRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".stay-cta__image img");
    const overlay = section.querySelector(".stay-cta__overlay");
    const content = section.querySelector(".stay-cta__content");
    const eyebrow = content.querySelector(":scope > span");
    const heading = content.querySelector("h2");
    const button = content.querySelector("a");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set(content, { opacity: 0, y: 30 });
      gsap.set([eyebrow, heading, button], { opacity: 0, y: 20 });

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
        .to(button, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2");
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <main className="stay-page">
      <PageMeta
        title="Stay With Us"
        description="Stay close to the land and experience the slower rhythm of countryside life at Mondol's Farm."
      />
      {/* ========================================
          HERO
      ======================================== */}

      <section ref={stayHeroRef} className="stay-hero">
        <div className="stay-hero__image">
          <img src={mudHouse} alt="Countryside accommodation" />
        </div>

        <div className="stay-hero__overlay"></div>

        <div className="container stay-hero__content">
          <span className="stay-hero__eyebrow">
            S T A Y &nbsp; W I T H &nbsp; U S
          </span>

          <h1>
            Stay close
            <br />
            to the land.
          </h1>

          <p>
            Wake up to open fields, quiet mornings, fresh food, and the everyday
            rhythm of countryside life.
          </p>
        </div>
      </section>

      {/* ========================================
          INTRO
      ======================================== */}

      <section ref={stayIntroRef} className="stay-intro section">
        <div className="container stay-intro__grid">
          <div className="stay-intro__image">
            <img
              src={mudHouse}
              alt="Traditional countryside homestay"
              loading="lazy"
            />
          </div>

          <div className="stay-intro__content">
            <span className="stay-intro__eyebrow">
              T H E &nbsp; E X P E R I E N C E
            </span>

            <h2>
              Not a hotel.
              <br />A place to slow down.
            </h2>

            <p>
              Our homestay is part of the farm itself. There are fields outside
              the window, animals nearby, and plenty of space to simply do
              nothing for a while.
            </p>

            <p>
              Choose between our traditional Mud House or the more comfortable
              Farm House and experience the countryside at your own pace.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          ACCOMMODATION
      ======================================== */}

      <section
        ref={stayAccommodationRef}
        className="stay-accommodation section"
      >
        <div className="container">
          <div className="stay-accommodation__header">
            <SectionHeading
              eyebrow="A C C O M M O D A T I O N"
              title="Choose your stay."
              description="Two different ways to experience the farm, each with its own character."
            />
          </div>

          <div className="stay-accommodation__list">
            {stays.map((stay) => (
              <StayCard key={stay.id} {...stay} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          WHAT TO EXPECT
      ======================================== */}

      <section ref={stayExpectRef} className="stay-expect section">
        <div className="container">
          <div className="stay-expect__layout">
            <div className="stay-expect__heading">
              <span>W H A T &nbsp; T O &nbsp; E X P E C T</span>

              <h2>
                Simple things.
                <br />
                Done well.
              </h2>

              <p>
                Our stay is about comfort without losing the feeling of being in
                the countryside.
              </p>
            </div>

            <div className="stay-expect__list">
              <article className="stay-expect__item">
                <span>01</span>

                <div>
                  <h3>Fresh Farm Food</h3>
                  <p>
                    Enjoy seasonal ingredients and simple meals inspired by what
                    grows around us.
                  </p>
                </div>
              </article>

              <article className="stay-expect__item">
                <span>02</span>

                <div>
                  <h3>Quiet Mornings</h3>
                  <p>
                    Wake up to birds, open fields, fresh air, and a slower start
                    to the day.
                  </p>
                </div>
              </article>

              <article className="stay-expect__item">
                <span>03</span>

                <div>
                  <h3>Open Countryside</h3>
                  <p>
                    Explore the farm, surrounding paths, fields, and nearby
                    village.
                  </p>
                </div>
              </article>

              <article className="stay-expect__item">
                <span>04</span>

                <div>
                  <h3>Farm Life</h3>
                  <p>
                    Get involved if you want, or simply watch the farm come
                    alive around you.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          EXPERIENCES
      ======================================== */}

      <section ref={stayExperiencesRef} className="stay-experiences section">
        <div className="container stay-experiences__grid">
          <div className="stay-experiences__image">
            <img
              src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=85"
              alt="Countryside experience"
              loading="lazy"
            />
          </div>

          <div className="stay-experiences__content">
            <span className="stay-experiences__eyebrow">
              F A R M &nbsp; E X P E R I E N C E S
            </span>

            <h2>
              Your stay can be
              <br />
              as simple as you want.
            </h2>

            <p>
              Spend the morning helping in the garden, take a walk through the
              village, feed the animals, or simply sit outside and watch the day
              pass.
            </p>

            <Link to="/farm" className="stay-page__link">
              Explore Farm Experiences
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          GUEST JOURNEY
      ======================================== */}

      <section ref={guestJourneyRef} className="guest-journey section">
        <div className="container">
          <div className="guest-journey__header">
            <SectionHeading
              eyebrow="Y O U R &nbsp; S T A Y"
              title="Arrive. Explore. Slow down."
              description="A simple rhythm for your time at Mondol's Farm."
            />
          </div>

          <div className="guest-journey__timeline">
            <article className="guest-journey__step">
              <span>01</span>

              <div>
                <h3>Arrive</h3>
                <p>
                  Leave the busy routine behind and settle into the countryside.
                </p>
              </div>
            </article>

            <article className="guest-journey__step">
              <span>02</span>

              <div>
                <h3>Explore</h3>
                <p>Walk around the farm and discover what's growing.</p>
              </div>
            </article>

            <article className="guest-journey__step">
              <span>03</span>

              <div>
                <h3>Eat</h3>
                <p>Enjoy simple food connected to the farm and the season.</p>
              </div>
            </article>

            <article className="guest-journey__step">
              <span>04</span>

              <div>
                <h3>Relax</h3>
                <p>Find a quiet corner and let the day move at its own pace.</p>
              </div>
            </article>

            <article className="guest-journey__step">
              <span>05</span>

              <div>
                <h3>Experience</h3>
                <p>Join farm activities or explore the surrounding village.</p>
              </div>
            </article>

            <article className="guest-journey__step">
              <span>06</span>

              <div>
                <h3>Leave</h3>
                <p>Take a few memories of the countryside home with you.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section ref={stayCtaRef} className="stay-cta">
        <div className="stay-cta__image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside landscape"
            loading="lazy"
          />
        </div>

        <div className="stay-cta__overlay"></div>

        <div className="container stay-cta__content">
          <span>Y O U R &nbsp; C O U N T R Y S I D E &nbsp; E S C A P E</span>

          <h2>
            Stay for a while.
            <br />
            Remember it longer.
          </h2>

          <Link to="/contact" className="button button--light">
            Check Availability
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Stay;
