export const COURSES = [
  {
    id: "c1",
    title: "Crystal Basics for Everyday Calm",
    level: "Beginner",
    duration: "2h 10m",
    lessons: 8,
    price: 999,
    desc: "Learn crystal basics and how to use them gently in daily life.",
    modules: [
      { title: "Welcome & Setup", lessons: ["How the course works", "Your calm routine setup"] },
      { title: "Core Crystals", lessons: ["Amethyst", "Rose Quartz", "Clear Quartz"] },
      { title: "Using Crystals", lessons: ["Placement", "Daily habits", "Simple rituals"] },
    ],
  },
  {
    id: "c2",
    title: "Cleansing & Space Energy Rituals",
    level: "Intermediate",
    duration: "3h 05m",
    lessons: 12,
    price: 1499,
    desc: "A calm, practical approach to cleansing spaces and maintaining peaceful energy.",
    modules: [
      { title: "Foundations", lessons: ["Intention", "Tools needed", "Avoiding overwhelm"] },
      { title: "Home Cleansing", lessons: ["Room flow", "Cleansing kit usage", "After-care"] },
      { title: "Consistency", lessons: ["Weekly routines", "Boundaries", "Reset rituals"] },
    ],
  },
  {
    id: "c3",
    title: "Healing Stones: Practical Usage Guide",
    level: "Beginner",
    duration: "1h 45m",
    lessons: 6,
    price: 799,
    desc: "A simple guide to choosing and using healing stones with clarity.",
    modules: [
      { title: "Choosing Stones", lessons: ["What to look for", "Common picks"] },
      { title: "Daily Use", lessons: ["Carrying", "Meditation", "Home placement"] },
    ],
  },
  {
    id: "c4",
    title: "Premium Gifting & Spiritual Curation",
    level: "Advanced",
    duration: "2h 50m",
    lessons: 10,
    price: 1999,
    desc: "Learn how to curate premium spiritual gifts for occasions and people.",
    modules: [
      { title: "Gift Psychology", lessons: ["Meaningful gifting", "Occasion mapping"] },
      { title: "Curations", lessons: ["Sets", "Packaging", "Message writing"] },
      { title: "Premium Touch", lessons: ["Finishing", "Presentation", "Repeatable system"] },
    ],
  },
];

export const FEATURED_COURSES = COURSES.slice(0, 4);
