const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const TEST_PHONE = "9999999999";
const TEST_OTP = "123456";

async function runE2E() {
  console.log("🚀 Starting ASB Store E2E Verification...");
  console.log(`🔗 Target URL: ${BASE_URL}`);

  let adminToken = "";
  let clientToken = "";
  let productId = "";

  try {
    // 1. ADMIN AUTH
    console.log("\n1️⃣  Phase: Admin Authentication");
    const adminOtpRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: TEST_PHONE })
    });
    if (!adminOtpRes.ok) throw new Error(`Send OTP failed: ${await adminOtpRes.text()}`);
    console.log("✅ OTP Request Sent");

    const adminVerifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: TEST_PHONE, otp: TEST_OTP })
    });
    const adminAuthData = await adminVerifyRes.json();
    if (!adminAuthData.success) throw new Error(`Admin Verify failed: ${JSON.stringify(adminAuthData)}`);
    adminToken = adminAuthData.accessToken;
    console.log("✅ Admin Login Successful (Token received)");

    // 2. ADMIN: CREATE PRODUCT
    console.log("\n2️⃣  Phase: Admin Product Creation");
    console.log("   Fetching categories...");
    const catRes = await fetch(`${BASE_URL}/api/categories`);
    const catData = await catRes.json();
    console.log("   Debug catData:", JSON.stringify(catData));
    const categories = catData.categories || [];
    const testCat = categories[0];

    if (!testCat) throw new Error("No categories found in system! Please seed categories first.");
    const categoryId = (testCat._id || testCat.id).toString();
    console.log(`✅ Using Category: ${testCat.name} (ID: ${categoryId})`);

    const productPayload = {
      title: "E2E Test Crystal " + Date.now(),
      slug: "e2e-test-crystal-" + Date.now(),
      description: "Automated E2E test product",
      categoryId: categoryId,
      price: 1,
      mrp: 10,
      images: ["https://placehold.co/600x400?text=E2E+Test"],
      stock: 50,
      isActive: true
    };

    const createRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify(productPayload)
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`Product creation failed: ${JSON.stringify(createData)}`);

    productId = (createData.product?._id || createData._id).toString();
    console.log(`✅ Product Created: ${productPayload.title} (ID: ${productId})`);

    // 3. CLIENT: BROWSE CATALOG
    console.log("\n3️⃣  Phase: Client Browse Catalog");
    const catalogRes = await fetch(`${BASE_URL}/api/products`);
    const catalogData = await catalogRes.json();
    const catalogItems = catalogData.items || catalogData.products || catalogData.data || [];
    const productFound = catalogItems.find(p => (p._id || p.id).toString() === productId);

    if (!productFound) {
      console.log("   ⚠️ Product not found on first page of public catalog (might be pagination).");
    } else {
      console.log("   ✅ Product verified in public catalog");
    }

    // 4. CLIENT AUTH
    console.log("\n4️⃣  Phase: Client Authentication");
    const clientOtpRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: TEST_PHONE })
    });
    if (!clientOtpRes.ok) throw new Error(`Client Send OTP failed: ${await clientOtpRes.text()}`);
    console.log("✅ Client OTP Request Sent");

    const clientVerifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: TEST_PHONE, otp: TEST_OTP })
    });
    const clientAuthData = await clientVerifyRes.json();
    if (!clientVerifyRes.ok) throw new Error(`Client Auth Failed: ${JSON.stringify(clientAuthData)}`);

    clientToken = clientAuthData.accessToken;
    console.log("✅ Client Login Successful");

    // 5. CLIENT: CART & CHECKOUT
    console.log("\n5️⃣  Phase: Cart & Checkout");

    // 5.1 Add to Cart
    console.log("   🛒 Adding item to cart...");
    const addToCartRes = await fetch(`${BASE_URL}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clientToken}`
      },
      body: JSON.stringify({ productId, qty: 1 })
    });
    if (!addToCartRes.ok) throw new Error(`Add to cart failed: ${await addToCartRes.text()}`);
    console.log("   ✅ Item added to cart.");

    // 5.2 Create Order
    console.log("   📦 Creating order...");
    const checkoutPayload = {
      items: [{
        productId: productId,
        qty: 1
      }],
      shippingAddress: {
        fullName: "E2E Tester",
        phone: TEST_PHONE,
        email: "test@example.com",
        line1: "123 E2E Street",
        city: "TestCity",
        state: "Delhi",
        pincode: "110001"
      }
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clientToken}`
      },
      body: JSON.stringify(checkoutPayload)
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.order?._id) throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
    const orderId = orderData.order._id;
    console.log(`   ✅ Order Created: ${orderId}`);

    // 5.3 Initiate PayU Hash
    console.log("   🔑 Generating PayU Hash...");
    const payuRes = await fetch(`${BASE_URL}/api/payments/payu/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        purpose: "SHOP_ORDER",
        orderId: orderId
      })
    });
    const payuData = await payuRes.json();
    if (!payuRes.ok || !payuData.fields?.hash) throw new Error(`PayU Hash generation failed: ${JSON.stringify(payuData)}`);
    console.log("✅ PayU Hash Generated Successfully");

    console.log("\n🏁 E2E VERIFICATION SUCCESSFUL!");

  } catch (err) {
    console.error("\n❌ E2E VERIFICATION FAILED:");
    console.error(err.message);
    process.exit(1);
  }
}

runE2E();
