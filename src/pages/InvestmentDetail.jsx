import { Link, useParams } from "react-router-dom";

import PageMeta from "../components/PageMeta";
import { getInvestmentOpportunityByProjectSlug } from "../data/investmentUtils";

import "./InvestmentDetail.css";

function InvestmentDetail() {
  const { slug } = useParams();

  const opportunity = getInvestmentOpportunityByProjectSlug(slug);

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
  const details = project.details || {};

  const projectFacts = [
    { label: "Project Status", value: project.status },
    { label: "Started", value: details.startDate },
    { label: "Area", value: details.area },
    { label: "Breed", value: details.breed },
    { label: "Variety", value: details.variety },
    { label: "Season", value: details.season },
    { label: "Current Scale", value: details.currentScale },
    { label: "Target Scale", value: details.targetScale },
    { label: "Expected Output", value: details.output },
  ].filter((item) => item.value);

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
      label: "Duration",
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
        description={opportunity.description || project.description}
        image={project.image}
      />

      {/* ========================================
          INVESTMENT INTRO
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
                {opportunity.description || project.description}
              </p>

              <div className="investment-detail__intro">
                <h2>
                  Participate in
                  <br />
                  the project's growth.
                </h2>

                <p>
                  This opportunity is connected to an actual project being
                  developed at Mondol's Farm.
                </p>
              </div>

              <Link
                to={`/contact?investment=${encodeURIComponent(project.title)}`}
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
          OPPORTUNITY DETAILS
      ======================================== */}

      <section className="investment-detail__information section">
        <div className="container">
          <div className="investment-detail__information-header">
            <span>I N V E S T M E N T &nbsp; D E T A I L S</span>

            <h2>
              The numbers
              <br />
              behind the opportunity.
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
          ABOUT THE OPPORTUNITY
      ======================================== */}

      <section className="investment-detail__story section">
        <div className="container investment-detail__story-grid">
          <div className="investment-detail__story-label">
            <span>T H E &nbsp; O P P O R T U N I T Y</span>
          </div>

          <div className="investment-detail__story-content">
            <h2>
              Grow alongside
              <br />
              the farm.
            </h2>

            <p>{opportunity.description || project.description}</p>

            <p>
              Your participation is connected to the development of this
              specific farm project. The project has its own requirements,
              timeline, risks, and participation terms.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          THE FARM PROJECT
      ======================================== */}

      <section className="investment-detail__project section">
        <div className="container">
          <div className="investment-detail__section-header">
            <span>T H E &nbsp; F A R M &nbsp; P R O J E C T</span>

            <h2>
              Understand what
              <br />
              you're supporting.
            </h2>
          </div>

          {projectFacts.length > 0 && (
            <div className="investment-detail__project-facts">
              {projectFacts.map((fact) => (
                <div key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          )}

          <div className="investment-detail__project-story">
            <p>{project.overview}</p>
          </div>
        </div>
      </section>

      {/* ========================================
          USE OF FUNDS
      ======================================== */}

      {opportunity.useOfFunds?.length > 0 && (
        <section className="investment-detail__funds section">
          <div className="container investment-detail__funds-grid">
            <div>
              <span>U S E &nbsp; O F &nbsp; F U N D S</span>

              <h2>
                Where the
                <br />
                participation goes.
              </h2>
            </div>

            <div className="investment-detail__fund-list">
              {opportunity.useOfFunds.map((item, index) => (
                <div key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================
          TIMELINE
      ======================================== */}

      <section className="investment-detail__timeline section">
        <div className="container">
          <div className="investment-detail__section-header">
            <span>P R O J E C T &nbsp; T I M E L I N E</span>

            <h2>
              From participation
              <br />
              to settlement.
            </h2>
          </div>

          <div className="investment-detail__timeline-list">
            <div>
              <span>01</span>

              <h3>Participation</h3>

              <p>
                Review the opportunity and discuss the applicable participation
                terms with Mondol's Farm.
              </p>
            </div>

            <div>
              <span>02</span>

              <h3>Project Development</h3>

              <p>
                The farm develops the project according to its planned
                production cycle.
              </p>
            </div>

            <div>
              <span>03</span>

              <h3>Project Completion</h3>

              <p>
                The project reaches the end of its stated duration and its
                outcome can be assessed.
              </p>
            </div>

            <div>
              <span>04</span>

              <h3>Settlement</h3>

              <p>
                Settlement takes place according to the final agreed
                participation terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          RETURN METHODOLOGY
      ======================================== */}

      <section className="investment-detail__return section">
        <div className="container investment-detail__return-grid">
          <div>
            <span>R E T U R N &nbsp; M E T H O D O L O G Y</span>

            <h2>
              Returns should
              <br />
              follow the project.
            </h2>
          </div>

          <div className="investment-detail__return-content">
            <p>
              The expected return methodology for each opportunity will be
              explained before any participation is confirmed.
            </p>

            <p>
              Project performance can vary. The final settlement is therefore
              based on the applicable terms and the outcome of the project
              rather than being presented as a fixed guaranteed return.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          RISKS
      ======================================== */}

      {opportunity.risks?.length > 0 && (
        <section className="investment-detail__risks section">
          <div className="container investment-detail__risks-grid">
            <div>
              <span>R I S K S</span>

              <h2>
                Farming
                <br />
                carries uncertainty.
              </h2>
            </div>

            <div className="investment-detail__risk-list">
              {opportunity.risks.map((risk, index) => (
                <div key={risk}>
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <p>{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================
          CTA
      ======================================== */}

      <section className="investment-detail__cta section">
        <div className="container">
          <span>
            I N T E R E S T E D &nbsp; I N &nbsp; T H I S &nbsp; P R O J E C T ?
          </span>

          <h2>
            Let's talk before
            <br />
            you participate.
          </h2>

          <p>
            For now, participation begins with a direct enquiry. We'll discuss
            the project, its terms, risks, and the participation process with
            you.
          </p>

          <Link
            to={`/contact?investment=${encodeURIComponent(project.title)}`}
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
