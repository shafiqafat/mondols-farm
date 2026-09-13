import projects from "./projects";
import investmentOpportunities from "./investmentOpportunities";

export function getProjectForInvestment(opportunity) {
  return projects.find((project) => project.slug === opportunity.projectSlug);
}

export function getInvestmentOpportunities() {
  return investmentOpportunities
    .map((opportunity) => ({
      ...opportunity,
      project: getProjectForInvestment(opportunity),
    }))
    .filter((opportunity) => opportunity.project);
}

export function getOpenInvestmentOpportunities() {
  return getInvestmentOpportunities().filter(
    (opportunity) => opportunity.status === "OPEN",
  );
}

export function getInvestmentOpportunityByProjectSlug(slug) {
  return getInvestmentOpportunities().find(
    (opportunity) => opportunity.projectSlug === slug,
  );
}

export default {
  getProjectForInvestment,
  getInvestmentOpportunities,
  getOpenInvestmentOpportunities,
  getInvestmentOpportunityByProjectSlug,
};
