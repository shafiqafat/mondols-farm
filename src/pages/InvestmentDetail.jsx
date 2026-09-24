import { Link, useParams } from "react-router-dom";

import PageMeta from "../components/PageMeta";
import { getInvestmentOpportunityBySlug } from "../data/investmentUtils";
import investHero from "../assets/image/hero/invest-hero.png";

import "./InvestmentDetail.css";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function InvestmentDetail() {
  const { slug } = useParams();

  const opportunity = getInvestmentOpportunityBySlug(slug);

  const mainRef = useRef(null);
  const informationRef = useRef(null);
  const projectRef = useRef(null);
  const justificationRef = useRef(null);
  const timelineRef = useRef(null);
  const returnRef = useRef(null);
  const risksRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!opportunity || !mainRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const main = mainRef.current.querySelector(".investment-detail__main");

      // Opening
      const back = main?.querySelector(".investment-detail__back");
      const image = main?.querySelector(".investment-detail__image");
      const content = main?.querySelector(".investment-detail__content");
      const top = main?.querySelector(".investment-detail__top");
      const title = main?.querySelector("h1");
      const description = main?.querySelector(
        ".investment-detail__description",
      );
      const primaryLink = main?.querySelector(
        ".investment-detail__primary-link",
      );

      if (
        back &&
        image &&
        content &&
        top &&
        title &&
        description &&
        primaryLink
      ) {
        gsap.set(back, { opacity: 0, y: 18 });
        gsap.set(image, { opacity: 0, x: -45, scale: 1.04 });
        gsap.set(content, { opacity: 0, x: 45 });
        gsap.set([top, title, description, primaryLink], { opacity: 0, y: 20 });

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(back, { opacity: 1, y: 0, duration: 0.5 })
          .to(image, { opacity: 1, x: 0, scale: 1, duration: 1 }, "-=0.25")
          .to(content, { opacity: 1, x: 0, duration: 0.8 }, "-=0.7")
          .to(top, { opacity: 1, y: 0, duration: 0.45 }, "-=0.45")
          .to(title, { opacity: 1, y: 0, duration: 0.7 }, "-=0.2")
          .to(description, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2")
          .to(primaryLink, { opacity: 1, y: 0, duration: 0.5 }, "-=0.15");
      }

      const animateSection = (section, setup, animation) => {
        if (!section) return;
        const targets = setup(section);
        if (!targets || targets.length === 0) return;

        animation(targets);
      };

      // Investment facts
      animateSection(
        informationRef.current,
        (section) => [
          section.querySelector(".investment-detail__section-header"),
          ...section.querySelectorAll(".investment-detail__facts > div"),
        ],
        (targets) => {
          const [header, ...facts] = targets;
          gsap.set(header, { opacity: 0, y: 25 });
          gsap.set(facts, { opacity: 0, y: 30 });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: informationRef.current,
                start: "top 75%",
                once: true,
              },
              defaults: { ease: "power3.out" },
            })
            .to(header, { opacity: 1, y: 0, duration: 0.7 })
            .to(
              facts,
              { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 },
              "-=0.25",
            );
        },
      );

      // Project
      animateSection(
        projectRef.current,
        (section) => [
          section.querySelector(
            ".investment-detail__project-grid > div:first-child",
          ),
          section.querySelector(".investment-detail__project-content"),
          section.querySelector(".investment-detail__project-overview"),
          ...section.querySelectorAll(".investment-detail__project-block"),
          ...section.querySelectorAll(".investment-detail__list > div"),
        ],
        (targets) => {
          const [intro, contentBlock, overview, ...rest] = targets;
          const blockCount = projectRef.current.querySelectorAll(
            ".investment-detail__project-block",
          ).length;
          const blocks = rest.slice(0, blockCount);
          const rows = rest.slice(blockCount);

          gsap.set(intro, { opacity: 0, x: -40 });
          gsap.set(contentBlock, { opacity: 0, x: 40 });
          gsap.set(overview, { opacity: 0, y: 25 });
          gsap.set(blocks, { opacity: 0, y: 30 });
          gsap.set(rows, { opacity: 0, x: 25 });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: projectRef.current,
                start: "top 75%",
                once: true,
              },
              defaults: { ease: "power3.out" },
            })
            .to(intro, { opacity: 1, x: 0, duration: 0.75 })
            .to(contentBlock, { opacity: 1, x: 0, duration: 0.75 }, "-=0.55")
            .to(overview, { opacity: 1, y: 0, duration: 0.6 }, "-=0.35")
            .to(
              blocks,
              { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 },
              "-=0.25",
            )
            .to(
              rows,
              { opacity: 1, x: 0, duration: 0.45, stagger: 0.055 },
              "-=0.2",
            );
        },
      );

      // Justification
      animateSection(
        justificationRef.current,
        (section) => [
          section.querySelector(
            ".investment-detail__justification-grid > div:first-child",
          ),
          ...section.querySelectorAll(
            ".investment-detail__justification-list > div",
          ),
        ],
        (targets) => {
          const [intro, ...items] = targets;
          gsap.set(intro, { opacity: 0, x: -40 });
          gsap.set(items, { opacity: 0, x: 40 });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: justificationRef.current,
                start: "top 75%",
                once: true,
              },
              defaults: { ease: "power3.out" },
            })
            .to(intro, { opacity: 1, x: 0, duration: 0.75 })
            .to(
              items,
              { opacity: 1, x: 0, duration: 0.6, stagger: 0.12 },
              "-=0.4",
            );
        },
      );

      // Timeline signature animation.
      const timeline = timelineRef.current;
      if (timeline) {
        const header = timeline.querySelector(
          ".investment-detail__section-header",
        );
        const line = timeline.querySelector(
          ".investment-detail__timeline-line",
        );
        const items = timeline.querySelectorAll(
          ".investment-detail__timeline-item",
        );
        const numbers = timeline.querySelectorAll(
          ".investment-detail__timeline-number",
        );
        const titles = timeline.querySelectorAll(
          ".investment-detail__timeline-item h3",
        );
        const descriptions = timeline.querySelectorAll(
          ".investment-detail__timeline-item p",
        );

        gsap.set(header, { opacity: 0, y: 25 });
        gsap.set(line, { scaleX: 0, transformOrigin: "left center" });
        gsap.set(items, { opacity: 0, y: 30 });
        gsap.set(numbers, { opacity: 0, y: 8 });
        gsap.set(titles, { opacity: 0, y: 12 });
        gsap.set(descriptions, { opacity: 0, y: 10 });

        gsap
          .timeline({
            scrollTrigger: { trigger: timeline, start: "top 72%", once: true },
            defaults: { ease: "power3.out" },
          })
          .to(header, { opacity: 1, y: 0, duration: 0.6 })
          .to(
            line,
            { scaleX: 1, duration: 1.3, ease: "power2.inOut" },
            "-=0.15",
          )
          .to(
            items,
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 },
            "-=0.95",
          )
          .to(
            numbers,
            { opacity: 1, y: 0, duration: 0.30, stagger: 0.12 },
            "-=0.55",
          )
          .to(
            titles,
            { opacity: 1, y: 0, duration: 0.40, stagger: 0.12 },
            "-=0.55",
          )
          .to(
            descriptions,
            { opacity: 1, y: 0, duration: 0.40, stagger: 0.12 },
            "-=0.48",
          );
      }

      // Return
      animateSection(
        returnRef.current,
        (section) => [
          section.querySelector(".investment-detail__section-header"),
          section.querySelector(".investment-detail__return-intro"),
          ...section.querySelectorAll(
            ".investment-detail__return-options > div",
          ),
          section.querySelector(".investment-detail__return-process"),
          ...section.querySelectorAll(
            ".investment-detail__return-process > div > div",
          ),
        ],
        (targets) => {
          const [header, intro, ...rest] = targets;
          const optionCount = returnRef.current.querySelectorAll(
            ".investment-detail__return-options > div",
          ).length;
          const options = rest.slice(0, optionCount);
          const process = rest[optionCount];
          const processItems = rest.slice(optionCount + 1);

          gsap.set(header, { opacity: 0, y: 25 });
          gsap.set(intro, { opacity: 0, y: 25 });
          gsap.set(options, { opacity: 0, y: 35 });
          gsap.set(process, { opacity: 0, y: 25 });
          gsap.set(processItems, { opacity: 0, y: 20 });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: returnRef.current,
                start: "top 75%",
                once: true,
              },
              defaults: { ease: "power3.out" },
            })
            .to(header, { opacity: 1, y: 0, duration: 0.7 })
            .to(intro, { opacity: 1, y: 0, duration: 0.55 }, "-=0.3")
            .to(
              options,
              { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
              "-=0.2",
            )
            .to(process, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2")
            .to(
              processItems,
              { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
              "-=0.2",
            );
        },
      );

      // Risks
      animateSection(
        risksRef.current,
        (section) => [
          section.querySelector(
            ".investment-detail__risks-grid > div:first-child",
          ),
          ...section.querySelectorAll(".investment-detail__risk-list > div"),
        ],
        (targets) => {
          const [intro, ...items] = targets;
          gsap.set(intro, { opacity: 0, x: -40 });
          gsap.set(items, { opacity: 0, x: 40 });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: risksRef.current,
                start: "top 75%",
                once: true,
              },
              defaults: { ease: "power3.out" },
            })
            .to(intro, { opacity: 1, x: 0, duration: 0.75 })
            .to(
              items,
              { opacity: 1, x: 0, duration: 0.6, stagger: 0.1 },
              "-=0.4",
            );
        },
      );

      // Final CTA
      const cta = ctaRef.current;
      if (cta) {
        const image = cta.querySelector(".investment-detail__cta-image img");
        const overlay = cta.querySelector(".investment-detail__cta-overlay");
        const content = cta.querySelector(".investment-detail__cta-content");

        if (image && overlay && content) {
          const eyebrow = content.querySelector(":scope > span");
          const heading = content.querySelector("h2");
          const paragraph = content.querySelector("p");
          const button = content.querySelector(".button");

          gsap.set(image, { scale: 1.08 });
          gsap.set(overlay, { opacity: 0 });
          gsap.set(content, { opacity: 0, y: 30 });
          gsap.set([eyebrow, heading, paragraph, button].filter(Boolean), {
            opacity: 0,
            y: 20,
          });

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
            .to(paragraph, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2")
            .to(button, { opacity: 1, y: 0, duration: 0.55 }, "-=0.15");
        }
      }
    }, mainRef);

    return () => ctx.revert();
  }, [opportunity]);

  if (!opportunity) {
    return (
      <main className="investment-not-found">
        <div className="container">
          <span>I N V E S T M E N T &nbsp; O P P O R T U N I T Y</span>

          <h1>
            We couldn't find
            <br />
            that opportunity.
          </h1>

          <Link to="/invest" className="button">
            Back to Opportunities
          </Link>
        </div>
      </main>
    );
  }

  const project = opportunity.project;

  const investmentFacts = [
    {
      label: "Minimum Participation",
      value: `৳${opportunity.funding.minimum.toLocaleString()}`,
    },
    {
      label: "Funding Target",
      value: `৳${opportunity.funding.target.toLocaleString()}`,
    },
    {
      label: "Investment Period",
      value: `${opportunity.duration.value} ${opportunity.duration.unit}`,
    },
    {
      label: "Settlement",
      value: `${opportunity.settlement.daysAfterCompletion} days after completion`,
    },
  ];

  return (
    <main ref={mainRef} className="investment-detail">
      <PageMeta
        title={`${project.title} — Investment Opportunity`}
        description={opportunity.projectBrief}
        image={project.image}
      />

      {/* ========================================
          HEADER / PROJECT BRIEF
      ======================================== */}

      <section className="investment-detail__main section">
        <div className="container">
          <Link to="/invest" className="investment-detail__back">
            ← Back to Opportunities
          </Link>

          <div className="investment-detail__grid">
            <div className="investment-detail__image">
              <img src={project.image} alt={project.title} />
            </div>

            <div className="investment-detail__content">
              <div className="investment-detail__top">
                <span className="investment-detail__category">
                  {project.category}
                </span>

                <span className="investment-detail__status">
                  <span></span>
                  {opportunity.status}
                </span>
              </div>

              <h1>{project.title}</h1>

              <p className="investment-detail__description">
                {opportunity.projectBrief}
              </p>

              <Link
                to={`/contact?investment=${encodeURIComponent(
                  opportunity.slug,
                )}`}
                className="investment-detail__primary-link"
              >
                Express Your Interest
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          INVESTMENT DETAILS
      ======================================== */}

      <section
        ref={informationRef}
        className="investment-detail__information section"
      >
        <div className="container">
          <div className="investment-detail__section-header">
            <span>I N V E S T M E N T &nbsp; D E T A I L S</span>

            <h2>
              The terms
              <br />
              at a glance.
            </h2>
          </div>

          <div className="investment-detail__facts">
            {investmentFacts.map((fact) => (
              <div key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          PROJECT DETAILS
      ======================================== */}

      <section ref={projectRef} className="investment-detail__project section">
        <div className="container investment-detail__project-grid">
          <div>
            <span>P R O J E C T &nbsp; D E T A I L S</span>

            <h2>
              Understand
              <br />
              the project.
            </h2>
          </div>

          <div className="investment-detail__project-content">
            <p className="investment-detail__project-overview">
              {opportunity.projectDetails.overview}
            </p>

            <div className="investment-detail__project-block">
              <span>WHAT THE PROJECT INVOLVES</span>

              <div className="investment-detail__list">
                {opportunity.projectDetails.activities.map(
                  (activity, index) => (
                    <div key={activity}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{activity}</strong>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="investment-detail__project-block">
              <span>WHERE THE FUNDS GO</span>

              <div className="investment-detail__list">
                {opportunity.projectDetails.fundUsage.map((item, index) => (
                  <div key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="investment-detail__project-block">
              <span>HOW THE PROJECT CREATES VALUE</span>

              <p>{opportunity.projectDetails.valueCreation}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          INVESTMENT JUSTIFICATION
      ======================================== */}

      <section
        ref={justificationRef}
        className="investment-detail__justification section"
      >
        <div className="container investment-detail__justification-grid">
          <div>
            <span>W H Y &nbsp; T H I S &nbsp; O P P O R T U N I T Y</span>

            <h2>
              Why this
              <br />
              project?
            </h2>
          </div>

          <div className="investment-detail__justification-list">
            <div>
              <span>01</span>

              <div>
                <h3>Market Opportunity</h3>
                <p>{opportunity.investmentJustification.marketOpportunity}</p>
              </div>
            </div>

            <div>
              <span>02</span>

              <div>
                <h3>Farm Advantage</h3>
                <p>{opportunity.investmentJustification.farmAdvantage}</p>
              </div>
            </div>

            <div>
              <span>03</span>

              <div>
                <h3>Project Economics</h3>
                <p>{opportunity.investmentJustification.projectEconomics}</p>
              </div>
            </div>

            <div>
              <span>04</span>

              <div>
                <h3>Timing</h3>
                <p>{opportunity.investmentJustification.timing}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          TIMELINE
      ======================================== */}

      <section
        ref={timelineRef}
        className="investment-detail__timeline section"
        data-timeline
      >
        <div className="container">
          <div className="investment-detail__section-header">
            <span>P R O J E C T &nbsp; T I M E L I N E</span>

            <h2>
              From payment
              <br />
              to settlement.
            </h2>
          </div>

          <div className="investment-detail__timeline-list">
            <div className="investment-detail__timeline-line"></div>

            {opportunity.timeline.map((item, index) => (
              <div
                key={item.key}
                className="investment-detail__timeline-item"
                style={{ "--timeline-index": index }}
              >
                <span className="investment-detail__timeline-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          RETURN METHOD
      ======================================== */}

      <section ref={returnRef} className="investment-detail__return section">
        <div className="container">
          <div className="investment-detail__section-header">
            <span>
              H O W &nbsp; Y O U R &nbsp; I N V E S T M E N T &nbsp; I S &nbsp;
              R E T U R N E D
            </span>

            <h2>
              A clear path
              <br />
              to settlement.
            </h2>
          </div>

          <div className="investment-detail__return-intro">
            <p>{opportunity.returnMethod.description}</p>
          </div>

          <div className="investment-detail__return-options">
            {opportunity.returnMethod.options.map((option, index) => (
              <div key={option.type}>
                <span>{String(index + 1).padStart(2, "0")}</span>

                <h3>{option.title}</h3>

                <p>{option.description}</p>

                <div className="investment-detail__payment-methods">
                  <span>PAYMENT / SETTLEMENT METHOD</span>

                  {option.paymentMethods.map((method) => (
                    <strong key={method}>{method}</strong>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="investment-detail__return-process">
            <span>SETTLEMENT PROCESS</span>

            <div>
              {opportunity.returnMethod.process.map((step, index) => (
                <div key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          RISKS
      ======================================== */}

      <section ref={risksRef} className="investment-detail__risks section">
        <div className="container investment-detail__risks-grid">
          <div>
            <span>U N D E R S T A N D I N G &nbsp; T H E &nbsp; R I S K S</span>

            <h2>
              Investment
              <br />
              carries risk.
            </h2>

            <p className="investment-detail__risk-intro">
              Participation in a farm project involves genuine agricultural and
              business risk. Project performance and final outcomes are not
              guaranteed.
            </p>
          </div>

          <div className="investment-detail__risk-list">
            {opportunity.risks.map((risk, index) => (
              <div key={risk.type}>
                <span>{String(index + 1).padStart(2, "0")}</span>

                <div>
                  <h3>{risk.title}</h3>
                  <p>{risk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section ref={ctaRef} className="investment-detail__cta">
        <div className="investment-detail__cta-image">
          <img src={investHero} alt="" aria-hidden="true" />
        </div>

        <div className="investment-detail__cta-overlay"></div>

        <div className="container investment-detail__cta-content">
          <span>
            I N T E R E S T E D &nbsp; I N &nbsp; T H I S &nbsp; O P P O R T U N
            I T Y ?
          </span>

          <h2>
            Let's talk before
            <br />
            you participate.
          </h2>

          <p>
            We'll discuss the project, applicable terms, risks, settlement
            options and participation process with you.
          </p>

          <Link
            to={`/contact?investment=${encodeURIComponent(opportunity.slug)}`}
            className="button button--primary"
          >
            Express Your Interest
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default InvestmentDetail;
