import { Link, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PageMeta from "../components/PageMeta";
import stays from "../data/stays";

import "./StayDetail.css";

function StayDetail() {
  const { slug } = useParams();

  const stay = stays.find((item) => item.slug === slug);

  const mainRef = useRef(null);
  const heroRef = useRef(null);
  const factsRef = useRef(null);
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const practicalRef = useRef(null);
  const highlightsRef = useRef(null);
  const galleryRef = useRef(null);
  const otherRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!stay || !mainRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Opening: accommodation introduction
      const hero = heroRef.current;
      if (hero) {
        const back = hero.querySelector(".stay-detail__back");
        const image = hero.querySelector(".stay-detail__image");
        const content = hero.querySelector(".stay-detail__content");
        const category = hero.querySelector(".stay-detail__category");
        const heading = hero.querySelector("h1");
        const price = hero.querySelector(".stay-detail__price");
        const description = hero.querySelector(".stay-detail__description");
        const actions = hero.querySelector(".stay-detail__actions");

        gsap.set(back, { opacity: 0, y: 18 });
        gsap.set(image, { opacity: 0, x: -45, scale: 1.04 });
        gsap.set(content, { opacity: 0, x: 45 });
        gsap.set([category, heading, price, description, actions], {
          opacity: 0,
          y: 20,
        });

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(back, { opacity: 1, y: 0, duration: 0.5 })
          .to(image, { opacity: 1, x: 0, scale: 1, duration: 1 }, "-=0.25")
          .to(content, { opacity: 1, x: 0, duration: 0.8 }, "-=0.7")
          .to(category, { opacity: 1, y: 0, duration: 0.4 }, "-=0.4")
          .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.2")
          .to(price, { opacity: 1, y: 0, duration: 0.45 }, "-=0.25")
          .to(description, { opacity: 1, y: 0, duration: 0.55 }, "-=0.15")
          .to(actions, { opacity: 1, y: 0, duration: 0.5 }, "-=0.15");
      }

      // House details / practical information
      const factsSections = [factsRef.current, practicalRef.current];
      factsSections.forEach((section) => {
        if (!section) return;

        const heading = section.querySelector(".stay-detail__section-heading");
        const facts = section.querySelectorAll(".stay-detail__fact");

        gsap.set(heading, { opacity: 0, y: 25 });
        gsap.set(facts, { opacity: 0, y: 30 });

        gsap
          .timeline({
            scrollTrigger: { trigger: section, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            facts,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
            "-=0.25",
          );
      });

      // About the house
      const about = aboutRef.current;
      if (about) {
        const label = about.querySelector(".stay-detail__about-label");
        const content = about.querySelector(".stay-detail__about-content");
        const paragraphs = about.querySelectorAll(
          ".stay-detail__about-content p",
        );

        gsap.set(label, { opacity: 0, x: -40 });
        gsap.set(content, { opacity: 0, x: 40 });
        gsap.set(paragraphs, { opacity: 0, y: 20 });

        gsap
          .timeline({
            scrollTrigger: { trigger: about, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(label, { opacity: 1, x: 0, duration: 0.7 })
          .to(content, { opacity: 1, x: 0, duration: 0.75 }, "-=0.5")
          .to(
            paragraphs,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
            "-=0.3",
          );
      }

      // Services
      const services = servicesRef.current;
      if (services) {
        const heading = services.querySelector(
          ".stay-detail__services-heading",
        );
        const groups = services.querySelectorAll(".stay-detail__service-group");
        const items = services.querySelectorAll(
          ".stay-detail__service-group li",
        );

        gsap.set(heading, { opacity: 0, y: 25 });
        gsap.set(groups, { opacity: 0, y: 35 });
        gsap.set(items, { opacity: 0, x: 20 });

        gsap
          .timeline({
            scrollTrigger: { trigger: services, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            groups,
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 },
            "-=0.3",
          )
          .to(
            items,
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.045 },
            "-=0.25",
          );
      }

      // Highlights
      const highlights = highlightsRef.current;
      if (highlights) {
        const heading = highlights.querySelector(
          ".stay-detail__highlights-heading",
        );
        const items = highlights.querySelectorAll(".stay-detail__highlight");

        gsap.set(heading, { opacity: 0, y: 25 });
        gsap.set(items, { opacity: 0, x: 35 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: highlights,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            items,
            { opacity: 1, x: 0, duration: 0.55, stagger: 0.1 },
            "-=0.3",
          );
      }

      // Gallery
      const gallery = galleryRef.current;
      if (gallery) {
        const heading = gallery.querySelector(".stay-detail__gallery-heading");
        const items = gallery.querySelectorAll(".stay-detail__gallery-item");

        gsap.set(heading, { opacity: 0, y: 25 });
        gsap.set(items, { opacity: 0, y: 35, scale: 0.97 });

        gsap
          .timeline({
            scrollTrigger: { trigger: gallery, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            items,
            { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.09 },
            "-=0.25",
          );
      }

      // Other stays
      const other = otherRef.current;
      if (other) {
        const heading = other.querySelector(".stay-detail__other-heading");
        const cards = other.querySelectorAll(".stay-detail__other-card");

        gsap.set(heading, { opacity: 0, y: 25 });
        gsap.set(cards, { opacity: 0, y: 40 });

        gsap
          .timeline({
            scrollTrigger: { trigger: other, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            cards,
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
            "-=0.25",
          );
      }

      // Final CTA
      const cta = ctaRef.current;
      if (cta) {
        const image = cta.querySelector(".stay-detail__cta-image");
        const overlay = cta.querySelector(".stay-detail__cta-overlay");
        const content = cta.querySelector(".stay-detail__cta-content");
        const eyebrow = content?.querySelector(":scope > span");
        const heading = content?.querySelector("h2");
        const button = content?.querySelector(".button");

        if (image && overlay && content && eyebrow && heading && button) {
          gsap.set(image, { scale: 1.08 });
          gsap.set(overlay, { opacity: 0 });
          gsap.set(content, { opacity: 0, y: 30 });
          gsap.set([eyebrow, heading, button], { opacity: 0, y: 20 });

          gsap
            .timeline({
              scrollTrigger: { trigger: cta, start: "top 80%", once: true },
              defaults: { ease: "power3.out" },
            })
            .to(image, { scale: 1.03, duration: 1.4, ease: "power2.out" })
            .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
            .to(content, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
            .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.2")
            .to(button, { opacity: 1, y: 0, duration: 0.55 }, "-=0.15");
        }
      }
    }, mainRef);

    return () => ctx.revert();
  }, [stay]);

  if (!stay) {
    return (
      <main className="stay-detail stay-detail--not-found">
        <div className="container">
          <span>S T A Y &nbsp; N O T &nbsp; F O U N D</span>

          <h1>
            We couldn't find
            <br />
            that accommodation.
          </h1>

          <Link to="/stay" className="button">
            Back to Stay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main ref={mainRef} className="stay-detail">
      <PageMeta title={stay.name} description={stay.description} />

      {/* ========================================
          HOUSE INTRO
          ======================================== */}

      <section ref={heroRef} className="stay-detail__main section">
        <div className="container">
          <Link to="/stay" className="stay-detail__back">
            ← Back to Stay
          </Link>

          <div className="stay-detail__grid">
            {/* IMAGE */}

            <div className="stay-detail__image">
              <img src={stay.image} alt={stay.name} />
            </div>

            {/* INFORMATION */}

            <div className="stay-detail__content">
              <span className="stay-detail__category">
                A C C O M M O D A T I O N
              </span>

              <h1>{stay.name}</h1>

              <div className="stay-detail__price">
                <strong>{stay.price}</strong>
                <span>/ {stay.unit}</span>
              </div>

              <p className="stay-detail__description">{stay.description}</p>

              <div className="stay-detail__actions">
                <Link
                  to={`/contact?stay=${encodeURIComponent(stay.name)}`}
                  className="button button--primary"
                >
                  Check Availability
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          HOUSE DETAILS
          ======================================== */}

      <section ref={factsRef} className="stay-detail__facts section">
        <div className="container">
          <div className="stay-detail__section-heading">
            <span>H O U S E &nbsp; D E T A I L S</span>

            <h2>
              Know the
              <br />
              essentials.
            </h2>
          </div>

          <div className="stay-detail__facts-grid">
            {Object.entries(stay.details).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (char) => char.toUpperCase());

              return (
                <div key={key} className="stay-detail__fact">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================
          ABOUT THE HOUSE
          ======================================== */}

      <section ref={aboutRef} className="stay-detail__about section">
        <div className="container stay-detail__about-grid">
          <div className="stay-detail__about-label">
            <span>A B O U T &nbsp; T H E &nbsp; H O U S E</span>
          </div>

          <div className="stay-detail__about-content">
            <h2>
              A place to
              <br />
              slow down.
            </h2>

            <p>{stay.about}</p>

            <p>{stay.experience}</p>
          </div>
        </div>
      </section>

      {/* ========================================
          SERVICES
          ======================================== */}

      <section ref={servicesRef} className="stay-detail__services section">
        <div className="container">
          <div className="stay-detail__services-heading">
            <div>
              <span>S T A Y &nbsp; S E R V I C E S</span>

              <h2>
                More than
                <br />a room.
              </h2>
            </div>

            <p>
              Your stay is connected to the farm. Some things are part of the
              experience, while others can be arranged according to what you
              need.
            </p>
          </div>

          <div className="stay-detail__services-grid">
            {/* INCLUDED */}

            <div className="stay-detail__service-group">
              <span className="stay-detail__service-number">01</span>

              <h3>Included</h3>

              <ul>
                {stay.services.included.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>

            {/* ON REQUEST */}

            <div className="stay-detail__service-group">
              <span className="stay-detail__service-number">02</span>

              <h3>Available on Request</h3>

              <ul>
                {stay.services.availableOnRequest.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          PRACTICAL INFO
          ======================================== */}

      <section ref={practicalRef} className="stay-detail__practical section">
        <div className="container">
          <div className="stay-detail__section-heading">
            <span>P R A C T I C A L &nbsp; I N F O</span>

            <h2>
              Before you
              <br />
              arrive.
            </h2>
          </div>

          <div className="stay-detail__facts-grid">
            {Object.entries(stay.practical).map(([key, value]) => {
              if (!value) return null;

              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (char) => char.toUpperCase());

              return (
                <div key={key} className="stay-detail__fact">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ========================================
          HIGHLIGHTS
          ======================================== */}

      <section ref={highlightsRef} className="stay-detail__highlights section">
        <div className="container">
          <div className="stay-detail__highlights-heading">
            <span>
              W H A T &nbsp; M A K E S &nbsp; I T &nbsp; S P E C I A L
            </span>

            <h2>
              Why stay
              <br />
              here?
            </h2>
          </div>

          <div className="stay-detail__highlights-list">
            {stay.highlights.map((highlight, index) => (
              <article key={index} className="stay-detail__highlight">
                <span>{String(index + 1).padStart(2, "0")}</span>

                <h3>{highlight}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          HOUSE GALLERY
          ======================================== */}

      <section ref={galleryRef} className="stay-detail__gallery section">
        <div className="container">
          <div className="stay-detail__gallery-heading">
            <span>G A L L E R Y</span>

            <h2>
              A closer look
              <br />
              at the stay.
            </h2>
          </div>

          <div className="stay-detail__gallery-grid">
            {stay.gallery.map((image, index) => (
              <div key={index} className="stay-detail__gallery-item">
                <img
                  src={image}
                  alt={`${stay.name} view ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          OTHER STAY
          ======================================== */}

      <section ref={otherRef} className="stay-detail__other section">
        <div className="container">
          <div className="stay-detail__other-heading">
            <span>A N O T H E R &nbsp; W A Y &nbsp; T O &nbsp; S T A Y</span>

            <h2>
              Looking for
              <br />
              another stay?
            </h2>
          </div>

          <div className="stay-detail__other-grid">
            {stays
              .filter((item) => item.id !== stay.id)
              .map((otherStay) => (
                <Link
                  key={otherStay.id}
                  to={`/stay/${otherStay.slug}`}
                  className="stay-detail__other-card"
                >
                  <div className="stay-detail__other-image">
                    <img
                      src={otherStay.image}
                      alt={otherStay.name}
                      loading="lazy"
                    />

                    <div className="stay-detail__other-overlay">
                      <span>View Stay</span>
                      <span>↗</span>
                    </div>
                  </div>

                  <div className="stay-detail__other-content">
                    <div>
                      <span>{otherStay.guests}</span>
                      <h3>{otherStay.name}</h3>
                    </div>

                    <div className="stay-detail__other-price">
                      <strong>{otherStay.price}</strong>
                      <span>/ {otherStay.unit}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
          ======================================== */}

      <section ref={ctaRef} className="stay-detail__cta">
        <div
          className="stay-detail__cta-image"
          style={{ backgroundImage: `url(${stay.image})` }}
        ></div>

        <div className="stay-detail__cta-overlay"></div>

        <div className="container stay-detail__cta-content">
          <span>R E A D Y &nbsp; T O &nbsp; S T A Y ?</span>

          <h2>
            Stay for a while.
            <br />
            Remember it longer.
          </h2>

          <Link
            to={`/contact?stay=${encodeURIComponent(stay.name)}`}
            className="button button--light"
          >
            Check Availability
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default StayDetail;
