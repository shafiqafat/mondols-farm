import mudHouse from "../assets/image/stay/mud-house.jpg";
import brickHouse from "../assets/image/stay/brick-house.jpg";

const stays = [
  {
    id: 1,
    slug: "mud-house",
    name: "The Mud House",

    description:
      "A traditional countryside retreat offering a simple and authentic rural experience.",

    price: "৳1,500",
    unit: "per night",

    guests: "2 guests",
    bedrooms: "1 bedroom",
    bathrooms: "1 bathroom",

    image: mudHouse,

    details: {
      guests: "2 guests",
      bedrooms: "1 bedroom",
      bathrooms: "1 bathroom",
      houseType: "Traditional mud house",
      location: "Mondol's Farm",
    },

    about:
      "The Mud House is our more traditional countryside accommodation, created for guests who want a simple and closer-to-nature stay at Mondol's Farm.",

    experience:
      "Stay surrounded by the farm and experience a quieter side of rural life. The Mud House is suited to guests looking for a simple place to rest, slow down, and enjoy the countryside.",

    services: {
      included: [
        "WiFi",
        "Breakfast",
        "Dinner",
        "Access to farm activities",
        "Use of farm facilities",
        "Guided farm tours",
      ],
      availableOnRequest: [
        "Bicycle rental",
        "Outdoor seating area",
        "Fire pit",
        "Barbecue facilities",
      ],
    },

    practical: {
      checkIn: "10:00 AM",
      checkOut: "10:00 AM",
      meals: "Included breakfast and dinner available on request",
      minimumStay: "1 night",
      bookingPolicy: "Booking must be made at least 24 hours in advance.",
    },

    highlights: [
      "Traditional countryside accommodation",
      "Designed for two guests",
      "Located within Mondol's Farm",
    ],

    gallery: [mudHouse],
  },

  {
    id: 2,
    slug: "farm-house",
    name: "The Farm House",

    description:
      "A comfortable brick-built home surrounded by the quiet landscape of the farm.",

    price: "৳2,500",
    unit: "per night",

    guests: "2–4 guests",
    bedrooms: "2 bedrooms",
    bathrooms: "1 bathroom",

    image: brickHouse,

    details: {
      guests: "2–4 guests",
      bedrooms: "2 bedrooms",
      bathrooms: "1 bathroom",
      houseType: "Brick-built farm house",
      location: "Mondol's Farm",
    },

    about:
      "The Farm House is a more spacious countryside accommodation for guests who want additional room while remaining close to the everyday life of the farm.",

    experience:
      "With two bedrooms and space for up to four guests, the Farm House is suited to a small family or group looking to spend time together in a peaceful rural setting.",

    services: {
      included: [
        "WiFi",
        "Breakfast",
        "Dinner",
        "Access to farm activities",
        "Use of farm facilities",
        "Guided farm tours",
      ],
      availableOnRequest: [
        "Bicycle rental",
        "Outdoor seating area",
        "Fire pit",
        "Barbecue facilities",
      ],
    },

    practical: {
      checkIn: "10:00 AM",
      checkOut: "10:00 AM",
      meals: "Included breakfast, dinner",
      minimumStay: "1 night",
      bookingPolicy: "Booking must be made at least 24 hours in advance.",
    },

    highlights: [
      "More spacious accommodation",
      "Suitable for up to four guests",
      "Located within Mondol's Farm",
    ],

    gallery: [brickHouse],
  },
];

export default stays;
