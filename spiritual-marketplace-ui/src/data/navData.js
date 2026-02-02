export const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },

  // ✅ Shop (dropdown injected dynamically from backend)
  { label: "Shop", path: "/shop", dropdown: [] },

  // ✅ Gifts (dropdown injected dynamically from backend)
  { label: "Gifts", path: "/shop?group=gifts", dropdown: [] },

  {
    label: "Tools",
    path: "https://asb-ui.onrender.com/",
  },

  {
    label: "Trainings",
    path: "/courses",
    dropdown: [
      { label: "General", path: "/courses?cat=General" },
      { label: "Beginner Programs", path: "/courses?cat=Beginner%20Programs" },
      { label: "Advanced Programs", path: "/courses?cat=Advanced%20Programs" },
      { label: "Certifications", path: "/courses?cat=Certifications" },
      { label: "Workshops", path: "/courses?cat=Workshops" },
    ],
  },

   {
    label: "Services",
    path: "/services",
    dropdown: [
      { label: "All Services", path: "/services" },
      { label: "Gift Wrapping", path: "/services#gift-wrapping" },
       { label: "Courses / Trainings", path: "/courses" },
      { label: "Calculator / Tools", path: "https://asb-ui.onrender.com/" },
      { label: "Personalized Gift Message", path: "/services#gift-message" },
      { label: "Bulk Orders", path: "/services#bulk-orders" },
      { label: "Corporate Gifting", path: "/services#corporate-gifting" },
      { label: "Order Support", path: "/services#support" },
     
    ],
  },

  { label: "Contact Us", path: "/contact" },
];
