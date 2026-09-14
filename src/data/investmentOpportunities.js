const investmentOpportunities = [
  {
    id: "goat-rearing-2026-01",
    slug: "goat-rearing-2026-01",
    projectSlug: "goat-rearing",

    status: "OPEN",
    featured: true,

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

    /*
     * Short explanation shown near the beginning
     * of the investment detail page.
     */
    projectBrief:
      "Mondol's Farm is developing a small-scale Black Bengal goat rearing operation focused on healthy livestock production and seasonal market demand. This opportunity supports the development of the project through livestock acquisition, feeding, housing and routine care.",

    /*
     * Detailed information about the actual farm project.
     */
    projectDetails: {
      overview:
        "The goat rearing project is being developed as part of Mondol's Farm's broader livestock activities. The project focuses on gradually building a healthy herd while developing the infrastructure and operating practices required for sustainable farm production.",

      activities: [
        "Livestock acquisition",
        "Feeding and nutrition",
        "Housing and farm infrastructure",
        "Routine livestock care",
        "Health and veterinary management",
        "Preparation for eventual sale or asset settlement",
      ],

      valueCreation:
        "The project aims to create value through livestock growth, herd development and eventual sale or agreed asset settlement according to the project's operating plan and market conditions.",

      fundUsage: [
        "Livestock purchase",
        "Feed and nutrition",
        "Housing improvements",
        "Routine livestock care",
      ],
    },

    /*
     * Why the opportunity exists.
     *
     * These are explanations, not promises of return.
     */
    investmentJustification: {
      marketOpportunity:
        "Black Bengal goats have established demand in Bangladesh, particularly around seasonal livestock markets and Eid-ul-Adha. Actual market prices and demand may vary.",

      farmAdvantage:
        "Participation supports a project that is being developed directly within Mondol's Farm, allowing the farm to manage the production cycle, livestock care and project operations directly.",

      projectEconomics:
        "The economic outcome of the project is linked to livestock acquisition costs, operating expenses, animal growth, market prices and the eventual value of the livestock or other project output.",

      timing:
        "This opportunity is structured around a defined livestock production cycle, allowing the required capital to be deployed toward a specific project period rather than general farm expenditure.",
    },

    /*
     * Investment timeline.
     *
     * Exact calendar dates can be added later when
     * an investment actually begins.
     */
    timeline: [
      {
        key: "payment",
        title: "Investment Payment",
        description:
          "The participant completes the agreed contribution and the participation is formally confirmed.",
      },
      {
        key: "funding",
        title: "Project Funding",
        description:
          "Funds are allocated to the project according to the agreed use of funds.",
      },
      {
        key: "development",
        title: "Project Development",
        description:
          "The farm carries out the planned livestock activities throughout the project period.",
      },
      {
        key: "completion",
        title: "Project Deadline",
        description:
          "The stated project period ends and the project's actual outcome can be assessed.",
      },
      {
        key: "settlement",
        title: "Settlement",
        description:
          "The final settlement is prepared according to the applicable participation terms and project outcome.",
      },
    ],

    /*
     * Return / settlement structure.
     *
     * This deliberately does NOT promise a fixed percentage.
     */
    returnMethod: {
      model: "PERFORMANCE_BASED",

      description:
        "The final settlement is determined according to the applicable project terms and the actual performance of the project. The outcome is not presented as a fixed guaranteed return.",

      options: [
        {
          type: "CASH",
          title: "Cash Settlement",
          description:
            "Where applicable, the participant receives the agreed settlement amount through an approved payment method.",
          paymentMethods: ["Bank transfer", "Mobile financial service"],
        },
        {
          type: "ASSET",
          title: "Asset Settlement",
          description:
            "For suitable projects, settlement may be made through transfer of an agreed farm asset instead of cash, subject to the specific opportunity terms.",
          paymentMethods: ["Agreed livestock or farm asset"],
        },
      ],

      process: [
        "Project completion",
        "Final project assessment",
        "Settlement calculation",
        "Participant confirmation",
        "Cash or asset settlement",
      ],
    },

    /*
     * Professional risk disclosure.
     */
    risks: [
      {
        type: "PRODUCTION",
        title: "Production Risk",
        description:
          "Livestock performance may be affected by disease, mortality, health conditions, environmental factors or other operational circumstances.",
      },
      {
        type: "MARKET",
        title: "Market Risk",
        description:
          "Livestock prices, demand and market conditions may change during the project period and can affect the final project outcome.",
      },
      {
        type: "COST",
        title: "Cost Risk",
        description:
          "Feed, livestock acquisition, veterinary care, transportation and other operating costs may differ from initial estimates.",
      },
      {
        type: "TIMING",
        title: "Timing Risk",
        description:
          "The project or settlement process may take longer than initially anticipated because of operational, seasonal or market conditions.",
      },
      {
        type: "PERFORMANCE",
        title: "Performance Risk",
        description:
          "The actual financial or asset outcome of the project may differ from initial expectations. Project performance is not guaranteed.",
      },
    ],

    notes:
      "Full participation terms, settlement methodology and applicable conditions will be provided and agreed before participation is confirmed.",
  },
];

export default investmentOpportunities;
