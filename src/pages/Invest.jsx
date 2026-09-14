import { Link } from "react-router-dom";

import PageMeta from "../components/PageMeta";
import {
  getOpenInvestmentOpportunities,
  getInvestmentOpportunities,
} from "../data/investmentUtils";
import InvestmentOpportunityCard from "../components/InvestmentOpportunityCard";
import investHero from "../assets/image/hero/invest-hero.png";

import "./Invest.css";

function Invest() {
  const opportunities = getOpenInvestmentOpportunities();
  const upcomingOpportunities = getInvestmentOpportunities().filter(
    (opportunity) => opportunity.status === "COMING_SOON",
  );

  return (
    <main className="invest-page">
      <PageMeta
        title="Investment Opportunities"
        description="Explore current opportunities to participate in selected projects at Mondol's Farm."
      />

      {/* HERO */}

      <section className="invest-hero">
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

      <section className="invest-opportunities section">
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
        <section className="invest-upcoming section">
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

      <section className="invest-process section">
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
