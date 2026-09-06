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
  },
];

export default projects;
