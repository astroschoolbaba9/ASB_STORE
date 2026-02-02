const mongoose = require("mongoose");
const { env } = require("../config/env");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Course = require("../models/Course");
const CoursePurchase = require("../models/CoursePurchase");

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function run() {
  await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
  console.log("✅ Connected for seeding");

  // wipe (dev only)
  try { await mongoose.connection.collection("products").drop(); } catch (e) {}
  try { await mongoose.connection.collection("categories").drop(); } catch (e) {}
try { await mongoose.connection.collection("coursepurchases").drop(); } catch (e) {}
try { await mongoose.connection.collection("courses").drop(); } catch (e) {}

  const categories = await Category.insertMany([
    { name: "Spiritual Gifts", slug: "spiritual-gifts" },
    { name: "Puja Items", slug: "puja-items" },
    { name: "Bracelets & Stones", slug: "bracelets-stones" }
  ]);

  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const products = [
    {
      title: "Rudraksha Mala",
      slug: "rudraksha-mala",
      description: "Premium Rudraksha mala for daily wear and meditation.",
      categoryId: bySlug["bracelets-stones"]._id,
      images: ["/banners/banner1.jpg"],
      price: 599,
      mrp: 799,
      stock: 20
    },
    {
      title: "Copper Kalash",
      slug: "copper-kalash",
      description: "Copper kalash for puja and rituals.",
      categoryId: bySlug["puja-items"]._id,
      images: ["/banners/banner1.jpg"],
      price: 899,
      mrp: 1099,
      stock: 15
    },
    {
      title: "Ganesha Idol (Gift Pack)",
      slug: "ganesha-idol-gift-pack",
      description: "Beautiful gift pack with Ganesha idol and diya.",
      categoryId: bySlug["spiritual-gifts"]._id,
      images: ["/banners/banner1.jpg"],
      price: 1299,
      mrp: 1599,
      stock: 10
    }
  ];

await Course.insertMany([
  {
    title: "Numerology Basics (Beginner)",
    slug: "numerology-basics-beginner",
    description: "Start from basics: numbers, meaning, and life patterns.",
    thumbnail: "/banners/banner1.jpg",
    price: 499,
    mrp: 999,
    lessons: [
      { title: "Welcome & Overview", videoUrl: "https://example.com/video1", durationSec: 180, isFreePreview: true },
      { title: "Mulank & Bhagyank", videoUrl: "https://example.com/video2", durationSec: 600, isFreePreview: false },
      { title: "Lo Shu Grid Intro", videoUrl: "https://example.com/video3", durationSec: 720, isFreePreview: false }
    ]
  },
  {
    title: "Advanced Remedies & Compatibility",
    slug: "advanced-remedies-compatibility",
    description: "Deep dive into compatibility and remedies.",
    thumbnail: "/banners/banner1.jpg",
    price: 999,
    mrp: 1499,
    lessons: [
      { title: "Compatibility Framework", videoUrl: "https://example.com/video4", durationSec: 540, isFreePreview: true },
      { title: "Remedies & Practices", videoUrl: "https://example.com/video5", durationSec: 840, isFreePreview: false }
    ]
  }
]);



  // ensure slugs safe
  for (const p of products) p.slug = slugify(p.slug || p.title);

  await Product.insertMany(products);

  console.log("✅ Seed complete:", {
    categories: categories.length,
    products: products.length
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});



