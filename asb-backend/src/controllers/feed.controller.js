const { asynchandler } = require("../utils/asyncHandler");
const Product = require("../models/Product");

/**
 * Generates an XML feed for Google Merchant Center
 * Endpoint: GET /api/google-feed
 */
const getGoogleMerchantFeed = asynchandler(async (req, res) => {
  // Fetch only active products
  const products = await Product.find({ isActive: true }).lean();

  const FRONTEND_URL = "https://asbcrystal.in";
  const BACKEND_URL = "https://api.asbcrystal.in"; // Used for image absolute paths if relative

  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ASB Crystal</title>
    <link>${FRONTEND_URL}</link>
    <description>Premium crystals and spiritual products from ASB Crystal.</description>`;

  products.forEach((p) => {
    // Determine the primary image link
    // If image is a full URL, use it; otherwise, prefix with backend URL
    const imagePath = p.images?.[0] || "";
    const imageLink = imagePath.startsWith("http") 
      ? imagePath 
      : `${BACKEND_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

    xml += `
    <item>
      <g:id>${p._id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${FRONTEND_URL}/product/${p.slug}</g:link>
      <g:image_link>${imageLink || FRONTEND_URL + "/logo.png"}</g:image_link>
      <g:availability>${p.stock > 0 ? "in stock" : "out of stock"}</g:availability>
      <g:price>${p.price} INR</g:price>
      <g:brand>ASB Crystal</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  res.header("Content-Type", "application/xml");
  res.send(xml.trim());
});

module.exports = { getGoogleMerchantFeed };
