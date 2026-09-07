import quailFarming from "../assets/image/projects/quail-farming.jpg";
import goatRearing from "../assets/image/projects/goat-rearing.avif";
import mustardCultivation from "../assets/image/projects/mustard-cultivation.jpg";
import chickenRearing from "../assets/image/projects/chicken-rearing.jpg";

const projects = [
  {
    id: 1,
    slug: "mustard",
    title: "Mustard",
    description:
      "Cultivating mustard as a seasonal crop to enhance soil health and biodiversity.",
    status: "ONGOING",
    category: "F a r m i n g",
    image: mustardCultivation,

    details: {
      startDate: "Oct 12 2026",
      area: "5 decimal",
      variety: "Brown Mustard",
      season: "Winter",
      currentScale: "5 decimal",
      expectedHarvest: "Dec 2026",
      output: "Mustard greens and seeds",
      irrigation: "",
      fertilizer: "",
      inputs: [],
    },

    overview:
      "Our mustard project is a seasonal farming project focused on growing mustard as part of the farm's wider agricultural cycle. The project allows us to work with the land through the season while producing useful food for the farm.",

    approach: [
      "Seasonal cultivation",
      "Careful land preparation",
      "Regular crop monitoring",
      "Harvesting according to the season",
    ],
  },

  {
    id: 2,
    slug: "quail-farming",
    title: "Quail Farming",
    description:
      "Small-scale quail farming focused on healthy birds and fresh eggs.",
    status: "ONGOING",
    category: "L i v e s t o c k",
    image: quailFarming,

    details: {
      startDate: "Oct 12 2026",
      area: "80 sqft",
      breed: "Japanese Quail",
      season: "Year-round",
      currentScale: "100 birds",
      targetScale: "500 birds",
      output: "Fresh eggs",
      housing: "Small-scale quail coop with proper ventilation and nesting areas",
      feed: "High-quality quail feed and occasional fresh greens",
      inputs: [],
    },

    overview:
      "Our quail farming project is being developed on a small scale with a focus on maintaining healthy birds and producing fresh eggs. The project is part of our wider effort to build a practical livestock system that can grow gradually with the farm.",

    approach: [
      "Healthy bird management",
      "Clean and suitable housing",
      "Regular feeding and care",
      "Small-scale egg production",
    ],
  },

  {
    id: 3,
    slug: "goat-rearing",
    title: "Goat Rearing",
    description:
      "Building a healthy small-scale goat herd as part of our farm ecosystem.",
    status: "ONGOING",
    category: "L i v e s t o c k",
    image: goatRearing,

    details: {
      startDate: "Nov 15 2026",
      area: "100 sqft",
      breed: "Black Bengal Goat",
      season: "Year-round",
      currentScale: "1 goat",
      targetScale: "50 goats",
      maleCount: "0",
      femaleCount: "1",
      kidCount: "0",
      output: "Goat rearing and breeding",
      housing: "Small-scale goat pen with proper ventilation and shelter",
      feed: "High-quality German Napiar grass and access to grazing areas",
      breedingPlan: "Strategic breeding plan to improve herd genetics",
      inputs: [],
    },

    overview:
      "The goat rearing project is focused on gradually building a healthy small-scale herd. The project forms part of the farm ecosystem and gives us an opportunity to develop practical experience in livestock care, feeding, and breeding.",

    approach: [
      "Healthy herd development",
      "Regular livestock care",
      "Appropriate feeding",
      "Gradual herd expansion",
    ],
  },

  {
    id: 4,
    slug: "chicken-rearing",
    title: "Chicken Rearing",
    description:
      "Exploring small-scale chicken farming as a seasonal farm project.",
    status: "SEASONAL",
    category: "L i v e s t o c k",
    image: chickenRearing,

    details: {
      startDate: "Oct 1 2026",
      area: "120 sqft",
      breed: "Deshi Chicken",
      season: "Seasonal",
      currentScale: "12 birds",
      targetScale: "50 birds",
      purpose: "Egg production and meat supply",
      output: "Fresh eggs and chicken meat",
      housing: "Small-scale chicken coop with proper ventilation and nesting areas",
      feed: "High-quality chicken feed and occasional fresh greens",
      inputs: [],
    },

    overview:
      "Our chicken rearing project explores small-scale poultry farming as a seasonal part of the farm. The project gives us room to experiment with practical poultry management while keeping the scale appropriate for the farm.",

    approach: [
      "Small-scale poultry management",
      "Healthy bird care",
      "Practical feeding",
      "Seasonal production",
    ],
  },
];

export default projects;
