import { Link, useParams } from "react-router-dom";

import PageMeta from "../components/PageMeta";
import { getInvestmentOpportunityBySlug } from "../data/investmentUtils";
import investHero from "../assets/image/hero/invest-hero.png";


import "./InvestmentDetail.css";
import { useEffect } from "react";

function InvestmentDetail() {
  const { slug } = useParams();

  const opportunity = getInvestmentOpportunityBySlug(slug);

  useEffect(() => {
    const timeline = document.querySelector("[data-timeline]");

    if (!timeline) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeline.classList.add("is-visible");
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(timeline);

    return () => observer.disconnect();
  }, []);

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
    <main className="investment-detail">
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

      <section className="investment-detail__information section">
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

      <section className="investment-detail__project section">
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

      <section className="investment-detail__justification section">
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

      <section className="investment-detail__timeline section" data-timeline>
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

      <section className="investment-detail__return section">
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

      <section className="investment-detail__risks section">
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

      <section className="investment-detail__cta">
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
