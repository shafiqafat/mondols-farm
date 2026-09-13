const investmentOpportunities = [
  {
    id: 1,

    // Connects this opportunity to an existing farm project.
    projectSlug: "goat-rearing",

    status: "OPEN",

    funding: {
      target: 200000,
      raised: 0,
      minimum: 2000,
      currency: "BDT",
    },

    duration: {
      value: 8,
      unit: "months",
    },

    settlement: {
      daysAfterCompletion: 7,
    },

    returnModel: {
      type: "PERFORMANCE_BASED",
    },

    useOfFunds: [
      "Livestock purchase",
      "Feed and nutrition",
      "Housing improvements",
      "Routine livestock care",
    ],

    risks: [
      "Normal agricultural and livestock risks apply.",
      "Actual project performance may vary.",
    ],

    description:
      "Support the gradual development of our Black Bengal goat rearing project through a project-based participation opportunity.",

    notes:
      "Investment terms and final return calculations will be determined according to the project's actual performance and agreed terms.",
  },
];

export default investmentOpportunities;
