/**
 * One-time script: Upsert "Kuber Potli" product for Navratri offer.
 *
 * Usage:  node src/scripts/add-navratri-product.js
 */
const mongoose = require("mongoose");
const { env } = require("../config/env");
const Category = require("../models/Category");
const Product = require("../models/Product");

const SLUG = "kuber-potli-healing";

async function run() {
    await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
    console.log("✅ Connected to MongoDB");

    // 1) Find or create "Spiritual Gifts" category
    let category = await Category.findOne({ slug: "spiritual-gifts" });
    if (!category) {
        category = await Category.create({
            name: "Spiritual Gifts",
            slug: "spiritual-gifts",
        });
        console.log("📂 Created category:", category._id);
    }

    // 2) Upsert product
    const productData = {
        title: "Kuber Potli — Infused With Sacred Blessings",
        slug: SLUG,
        description:
            "This Festive Season Invite Prosperity. Get Kuber Potli Infused With Sacred Blessings. Growth in business, New clients & opportunities, Release from debts. Special Navratri Offer!",
        categoryId: category._id,
        images: ["/banners/navratri-kuber-potli.jpg"],
        price: 2100,
        mrp: 7500,
        stock: 100,
        isActive: true,
        isFeatured: true,
        spiritualUse:
            "Attracts wealth, prosperity, and new business opportunities. Infused with sacred mantras and blessings.",
        careHandling:
            "Keep in your puja room or at your workplace. Do not open the potli.",
        shippingReturns: "Free shipping. No returns on spiritual items.",
    };

    const existing = await Product.findOne({ slug: SLUG });

    let product;
    if (existing) {
        Object.assign(existing, productData);
        product = await existing.save();
        console.log("🔄 Updated existing product");
    } else {
        product = await Product.create(productData);
        console.log("🆕 Created new product");
    }

    console.log("");
    console.log("═══════════════════════════════════════════");
    console.log("  PRODUCT ID (paste into NavratriPopup.jsx):");
    console.log(`  ${product._id}`);
    console.log("═══════════════════════════════════════════");
    console.log("");

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
});
