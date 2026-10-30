import quailFarming from "../assets/image/projects/quail-farming.jpg";
import goatRearing from "../assets/image/projects/goat-rearing.avif";
import mustardCultivation from "../assets/image/projects/mustard-cultivation.jpg";
import chickenRearing from "../assets/image/projects/chicken-rearing.jpg";

const projects = [
  {
    id: "sonali-chickens",
    slug: "sonali-chickens",
    title: "Sonali Chicken Rearing",
    description:
      "A small-scale poultry project focused on raising Sonali chickens with proper feeding, housing, and daily care.",
    status: "ONGOING",
    category: "Poultry",
    image: chickenRearing,

    details: {
      startDate: "October 2026",
      currentScale: "20 birds",
      targetScale: "Expand gradually",
      currentCount: 20,
      breed: "Sonali",
      purpose: "Meat production and small-scale farm development",
      housing: "Small-scale poultry housing",
      feed: "Commercial poultry feed with monitored daily consumption",
    },

    overview:
      "The Sonali chicken project is part of our effort to build a practical, manageable poultry farming operation. We focus on daily care, feed management, health monitoring, and learning from actual production results.",

    approach: [
      "Monitor daily feed consumption and water availability.",
      "Maintain clean, dry, and well-ventilated housing.",
      "Observe bird health and follow appropriate vaccination guidance.",
      "Record expenses, growth, and sales to evaluate profitability.",
    ],
  },

  {
    id: "broiler-chickens",
    slug: "broiler-chickens",
    title: "Broiler Chicken Rearing",
    description:
      "A broiler poultry project focused on efficient growth, responsible care, and careful feed-cost management.",
    status: "ONGOING",
    category: "Poultry",
    image: chickenRearing,

    details: {
      startDate: "October 2026",
      currentScale: "32 birds",
      targetScale: "Expand based on results",
      currentCount: 32,
      breed: "Broiler",
      purpose: "Meat production",
      housing: "Small-scale broiler housing",
      feed: "Commercial starter and grower/finisher feed",
    },

    overview:
      "Our broiler project explores small-scale meat production with an emphasis on feed efficiency, bird health, and practical cost control. Production records will help us assess performance and plan future batches.",

    approach: [
      "Follow an age-appropriate feeding schedule.",
      "Provide clean drinking water and suitable ventilation.",
      "Monitor growth, mortality, and feed consumption.",
      "Track operating costs and sales to assess profitability.",
    ],
  },

  {
    id: "mixed-vegetable-garden",
    slug: "mixed-vegetable-garden",
    title: "Mixed Vegetable Garden",
    description:
      "An upcoming seasonal vegetable project featuring carrots, black cumin, coriander, Malabar spinach, red amaranth, and sweet pumpkin.",
    status: "UPCOMING",
    category: "Vegetable Farming",
    image: mustardCultivation,

    details: {
      season: "Winter and seasonal cultivation",
      area: "To be determined",
      variety: "Multiple seasonal crops",
      purpose: "Household food production and potential surplus sales",
      irrigation: "Based on crop requirements and available water",
      fertilizer: "Organic matter and appropriate soil amendments",
    },

    overview:
      "The mixed vegetable garden will diversify farm production through several crops with different growing periods. The plan prioritizes household food needs, affordable cultivation, and the possibility of selling surplus produce.",

    approach: [
      "Prepare the soil and assess sunlight and drainage.",
      "Select suitable planting times for each crop.",
      "Use compost and other appropriate soil amendments.",
      "Monitor pests, water requirements, and crop growth.",
      "Record costs and harvest quantities for each crop.",
    ],
  },

  {
    id: "goat-rearing",
    slug: "goat-rearing",
    title: "Goat Rearing",
    description:
      "A planned small-scale goat-rearing project focused on healthy livestock, suitable housing, and affordable feeding.",
    status: "UPCOMING",
    category: "Livestock",
    image: goatRearing,

    details: {
      startDate: "Planned for November 2026",
      breed: "Black Bengal goat",
      currentScale: "Not started",
      targetScale: "To be determined",
      purpose: "Livestock production and gradual farm expansion",
      housing: "Clean, dry, and well-ventilated shelter",
      feed: "Suitable forage, including planned Napier grass, with supplementary feed as needed",
      breedingPlan: "To be determined after livestock selection",
    },

    overview:
      "The goat-rearing project is planned as a gradual addition to the farm. The initial priority will be suitable livestock selection, affordable forage, proper housing, and reliable health management.",

    approach: [
      "Prepare appropriate housing before acquiring goats.",
      "Establish a dependable forage supply.",
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
      "A proposed small-scale quail project to evaluate suitable housing, feeding requirements, and market opportunities.",
    status: "UPCOMING",
    category: "Poultry",
    image: quailFarming,

    details: {
      breed: "Japanese quail under consideration",
      currentScale: "Not started",
      targetScale: "To be determined",
      purpose: "Evaluate small-scale egg or meat production",
      housing: "To be planned according to the production model",
      feed: "Suitable balanced quail feed",
    },

    overview:
      "Quail farming remains a proposed project. Before starting, we will evaluate local demand, chick availability, housing requirements, feed costs, and the most practical production model.",

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
];

export default projects;
