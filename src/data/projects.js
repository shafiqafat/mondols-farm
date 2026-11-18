import quailFarming from "../assets/image/projects/quail-farming.jpg";
import goatRearing from "../assets/image/projects/goat-rearing.avif";
import mustardCultivation from "../assets/image/projects/mustard-cultivation.jpg";
import broilerChickens from "../assets/image/projects/broiler-chicken.jpg";
import sonaliChickens from "../assets/image/projects/Sonali-chicken.jpg";
import mixedVegetableGarden from "../assets/image/journal/vegi.jpg";
import deshiPigeon from "../assets/image/projects/jalali-pigeon.jpg";

const projects = [
  {
    id: "sonali-chickens",
    slug: "sonali-chickens",
    title: "Sonali Chicken Rearing",
    description:
      "An active Sonali poultry project focused on flock health, feed management, mortality monitoring, and small-scale meat production.",
    status: "ONGOING",
    category: "Poultry",
    image: sonaliChickens,

    details: {
      startDate: "November 2026",
      currentScale: "27 birds (30 purchased; 3 mortality)",
      targetScale: "Expand gradually based on flock health and results",
      currentCount: 27,
      breed: "Sonali",
      purpose: "Meat production and small-scale farm development",
      housing: "Small-scale poultry housing",
      feed: "Commercial poultry feed with monitored daily consumption",
    },

    overview:
      "The Sonali flock began with 30 birds in November 2026. Three birds were lost to Gambura, leaving 27. The project now focuses on flock health, feed management, preventive care, and recording actual production results.",

    approach: [
      "Monitor daily feed consumption and water availability.",
      "Maintain clean, dry, and well-ventilated housing.",
      "Monitor flock health closely, including the previous Gambura-related losses, and follow appropriate veterinary and vaccination guidance.",
      "Record expenses, growth, and sales to evaluate profitability.",
    ],
  },

  {
    id: "mixed-vegetable-garden",
    slug: "mixed-vegetable-garden",
    title: "Mixed Vegetable Garden",
    description:
      "A seasonal vegetable project in preparation, with land preparation completed and seeds purchased for a mixed-crop garden.",
    status: "ONGOING",
    category: "Vegetable Farming",
    image: mixedVegetableGarden,

    details: {
      season: "Winter and seasonal cultivation 2026–27",
      area: "Part of 4 kathas prepared for grass and vegetables",
      variety: "Multiple seasonal crops",
      purpose: "Household food production and potential surplus sales",
      irrigation: "Based on crop requirements and available water",
      fertilizer: "Organic matter and appropriate soil amendments",
      crops: [
        "Carrot",
        "Black cumin",
        "Coriander",
        "Malabar spinach",
        "Red amaranth",
        "Sweet pumpkin",
      ],
    },

    overview:
      "The farm has prepared approximately 4 kathas for grass and vegetable cultivation, and vegetable seeds have been purchased. The crop mix includes carrots, black cumin, coriander, Malabar spinach, red amaranth, and sweet pumpkin. Planting progress and actual cultivated area should be updated as sowing proceeds.",

    approach: [
      "Prepare the soil and assess sunlight and drainage.",
      "Select suitable planting times for each crop.",
      "Use compost and other appropriate soil amendments.",
      "Monitor pests, water requirements, and crop growth.",
      "Record costs and harvest quantities for each crop.",
    ],
  },

  {
    id: "broiler-chickens",
    slug: "broiler-chickens",
    title: "Broiler Chicken Rearing",
    description:
      "An active broiler batch focused on growth, feed efficiency, bird health, and tracking sales and operating costs.",
    status: "ONGOING",
    category: "Poultry",
    image: broilerChickens,

    details: {
      startDate: "November 2026",
      currentScale:
        "27 birds alive (32 started; 1 mortality; 4 sold/sent to Dhaka)",
      targetScale: "Evaluate this batch before expanding",
      currentCount: 27,
      breed: "Broiler",
      purpose: "Meat production",
      housing: "Small-scale broiler housing",
      feed: "Commercial starter and grower/finisher feed; approximately 100 kg consumed so far",
    },

    overview:
      "The first broiler batch started with 32 chicks at ৳45 each. One bird died and four were sold/sent to Dhaka, leaving 27 birds as of 17 November 2026. Approximately 100 kg of feed has been used so far. The four-bird sale is expected to generate about ৳1,450. Records will be used to assess feed efficiency, mortality, sales, and batch profitability.",

    approach: [
      "Follow an age-appropriate feeding schedule.",
      "Provide clean drinking water and suitable ventilation.",
      "Monitor growth, mortality, and feed consumption.",
      "Track operating costs and sales to assess profitability.",
    ],
  },

  {
    id: "goat-rearing",
    slug: "goat-rearing",
    title: "Goat Rearing",
    description:
      "An active small-scale Black Bengal goat project focused on individual animal records, health, suitable housing, and affordable feeding.",
    status: "ONGOING",
    category: "Livestock",
    image: goatRearing,

    details: {
      startDate: "November 2026",
      breed: "Black Bengal goat",
      currentScale: "2 female goats",
      currentCount: 2,
      targetScale: "Gradual expansion based on results",
      purpose: "Livestock production and gradual farm expansion",
      housing: "Clean, dry, and well-ventilated shelter",
      feed: "Suitable forage, with Napier grass planting started and supplementary feed as needed",
      breedingPlan: "To be determined after livestock selection",
    },

    overview:
      "The farm acquired two female Black Bengal goats in November 2026. The project is now active, with priorities including individual animal identification, health and lifecycle records, affordable forage, suitable housing, and veterinary guidance.",

    approach: [
      "Maintain clean, dry, and well-ventilated housing for the two acquired goats.",
      "Continue establishing a dependable forage supply, including the Napier grass planting already started.",
      "Provide clean water and suitable supplementary nutrition.",
      "Arrange veterinary guidance and preventive healthcare.",
      "Maintain records of feed, health, expenses, and growth.",
    ],
  },

  {
    id: "quail-farming",
    slug: "quail-farming",
    title: "Quail Farming",
    description:
      "A small active quail group being maintained while the farm evaluates housing, feeding requirements, and future market opportunities.",
    status: "ONGOING",
    category: "Poultry",
    image: quailFarming,

    details: {
      breed: "Quail (variety not yet confirmed)",
      currentScale: "5 birds",
      currentCount: 5,
      targetScale: "Evaluate demand and costs before scaling toward 100 birds",
      purpose: "Evaluate small-scale egg or meat production",
      housing: "To be planned according to the production model",
      feed: "Suitable balanced quail feed",
    },

    overview:
      "The farm currently keeps five quails. This is an initial small group rather than a full production batch. Future expansion will depend on local demand, housing, feed costs, and the production model.",

    approach: [
      "Research local demand for quail eggs and meat.",
      "Estimate startup costs and recurring feed expenses.",
      "Prepare appropriate housing and biosecurity measures.",
      "Start only after evaluating the market and available budget.",
    ],
  },

  {
    id: "mustard",
    slug: "mustard-cultivation",
    title: "Mustard Cultivation",
    description:
      "A planned small-scale mustard cultivation project focused on seasonal crop production and practical farm learning.",
    status: "UPCOMING",
    category: "Crop Farming",
    image: mustardCultivation,

    details: {
      season: "Winter season",
      area: "5 decimals",
      variety: "Suitable mustard variety to be selected",
      purpose: "Oilseed production and potential crop sales",
      irrigation: "According to soil moisture and crop requirements",
      fertilizer: "Based on soil condition and recommended crop guidance",
    },

    overview:
      "The mustard project is planned for a small plot of land. The objective is to learn about seasonal oilseed cultivation, manage production costs, and evaluate the harvest before considering expansion.",

    approach: [
      "Prepare the land and select a suitable mustard variety.",
      "Sow at an appropriate time for the local growing season.",
      "Apply fertilizer according to crop recommendations.",
      "Monitor weeds, pests, and soil moisture.",
      "Record cultivation expenses and harvested yield.",
    ],
  },

  {
    id: "pigeon-rearing",
    slug: "pigeon-rearing",
    title: "Pigeon Rearing",
    description:
      "A small active pigeon group being maintained while the farm evaluates suitable housing, feeding, and future expansion.",
    status: "ONGOING",
    category: "Poultry",
    image: deshiPigeon,

    details: {
      breed: "Deshi pigeon",
      currentScale: "2 birds",
      currentCount: 2,
      targetScale:
        "Gradual expansion after evaluating breeding and market conditions",
      purpose: "Evaluate small-scale egg or meat production",
      housing: "To be planned according to the production model",
      feed: "Suitable balanced pigeon feed",
    },

    overview:
      "The farm currently keeps two Deshi pigeons. The initial focus is suitable housing, feeding, health monitoring, and learning whether a larger breeding group is practical.",

    approach: [
      "Research local demand for pigeon eggs and meat.",
      "Estimate startup costs and recurring feed expenses.",
      "Prepare appropriate housing and biosecurity measures.",
      "Start only after evaluating the market and available budget.",
    ],
  },
];

export default projects;
