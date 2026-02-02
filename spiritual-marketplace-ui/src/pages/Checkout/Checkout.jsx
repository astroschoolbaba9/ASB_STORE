import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";

import useRequireAuth from "../../hooks/useRequireAuth";
import { useCart } from "../../context/CartContext";
import Toast from "../../components/ui/Toast";
import { api } from "../../lib/api";

function pickDefaultAddress(addresses = []) {
  const arr = Array.isArray(addresses) ? addresses : [];
  return arr.find((a) => a.isDefault) || arr[0] || null;
}

function mapAddressToForm(a) {
  if (!a) return null;
  return {
    fullName: a.fullName || "",
    mobile: a.phone || "",
    email: a.email || "",
    addressLine: a.line1 || "",
    addressLine2: a.line2 || "",
    city: a.city || "",
    state: a.state || "",
    pincode: a.pincode || "",
    landmark: a.landmark || ""
  };
}

// Inline PayU auto submit form (no extra component file needed)
function PayuAutoForm({ actionUrl, fields }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.submit();
  }, []);

  if (!actionUrl || !fields) return null;

  return (
    <form ref={ref} method="POST" action={actionUrl}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
      <noscript>
        <button type="submit" className="btn-primary">
          Continue to PayU
        </button>
      </noscript>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();

  const { cart, loading, refreshCart, clearCart } = useCart();

  const [toastOpen, setToastOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // profile/address loading
  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // save to address book option
  const [saveToBook, setSaveToBook] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [setAsDefault, setSetAsDefault] = useState(false);

  // form fields
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // payment
  const [payMethod, setPayMethod] = useState("COD"); // "COD" | "PAYU"
  const [payu, setPayu] = useState(null); // { actionUrl, fields }

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load profile + addresses + auto-fill from default
  useEffect(() => {
    requireAuth(async () => {
      setMeLoading(true);
      try {
        const meRes = await api.get("/api/me");
        const u = meRes?.user || meRes?.data?.user || meRes?.user || null;
        setMe(u || null);

        const addrRes = await api.get("/api/me/addresses");
        const list = Array.isArray(addrRes?.addresses) ? addrRes.addresses : [];
        setAddresses(list);

        const def = pickDefaultAddress(list);
        if (def?._id) setSelectedAddressId(def._id);

        const form = mapAddressToForm(def);
        if (form) {
          setFullName(form.fullName || u?.name || "");
          setMobile(form.mobile || u?.phone || "");
          setEmail(form.email || u?.email || "");
          setAddressLine(form.addressLine || "");
          setAddressLine2(form.addressLine2 || "");
          setCity(form.city || "");
          setState(form.state || "");
          setPincode(form.pincode || "");
          setLandmark(form.landmark || "");
        } else {
          setFullName(u?.name || "");
          setMobile(u?.phone || "");
          setEmail(u?.email || "");
        }
      } catch {
        setMe(null);
        setAddresses([]);
      } finally {
        setMeLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectAddress = (id) => {
    setSelectedAddressId(id);
    const a = (addresses || []).find((x) => String(x._id) === String(id));
    const form = mapAddressToForm(a);
    if (!form) return;

    setFullName(form.fullName || me?.name || "");
    setMobile(form.mobile || me?.phone || "");
    setEmail(form.email || me?.email || "");
    setAddressLine(form.addressLine || "");
    setAddressLine2(form.addressLine2 || "");
    setCity(form.city || "");
    setState(form.state || "");
    setPincode(form.pincode || "");
    setLandmark(form.landmark || "");
  };

  const cartRows = useMemo(() => {
    const items = cart?.items || [];

    return items
      .map((it) => {
        const p = it.product || it.productId || it.productRef || null;
        if (!p) return null;

        const name = p.title || p.name || "Product";
        const category = p.category?.name || p.category || "General";
        const price = p.price ?? 0;
        const qty = it.qty || 1;

        const gift = it.isGift || it.gift?.isGift || it.gift === true || false;
        const giftWrap = it.giftWrap || it.gift?.giftWrap || false;

        const recipient = it.recipientName || it.gift?.recipientName || it.meta?.recipient || "";
        const occasion = it.giftOccasion || it.occasion || it.gift?.occasion || it.meta?.occasion || "";

        return {
          key: it._id || it.itemId || `${p._id || p.id}-${qty}`,
          name,
          category,
          price,
          qty,
          meta: { gift, giftWrap, recipient, occasion }
        };
      })
      .filter(Boolean);
  }, [cart]);

  const fallbackSubtotal = useMemo(() => cartRows.reduce((sum, it) => sum + it.price * it.qty, 0), [cartRows]);

  const totals = cart?.totals || {};
  const subtotal = Number(totals.subtotal ?? fallbackSubtotal);
  const shipping = Number(totals.shipping ?? (subtotal > 1499 ? 0 : cartRows.length > 0 ? 99 : 0));
  const giftWrapTotal = Number(totals.giftWrapTotal ?? 0);
  const total = Number(totals.grandTotal ?? subtotal + shipping + giftWrapTotal);

  const empty = cartRows.length === 0;

  const placeOrder = async () => {
    await requireAuth(async () => {
      if (empty) return;

      if (!fullName.trim() || !mobile.trim() || !addressLine.trim()) {
        setError("Please fill Full Name, Mobile, and Address.");
        return;
      }

      // PayU needs email+phone; force email if PayU selected
      if (payMethod === "PAYU" && !(email || "").trim()) {
        setError("Email is required for online payment.");
        return;
      }

      setError("");
      setPlacing(true);

      try {
        // Build order items from BACKEND cart snapshot
        const rawItems = Array.isArray(cart?.items) ? cart.items : [];

        const items = rawItems
          .map((it) => {
            const p = it.product || it.productId || it.productRef || null;
            const productId = (p && (p._id || p.id)) || it.productId || it.productRef || null;
            if (!productId) return null;

            return {
              productId: String(productId),
              qty: Number(it.qty || 1),

              isGift: Boolean(it.isGift || it.gift?.isGift || it.gift === true),
              giftWrap: Boolean(it.giftWrap || it.gift?.giftWrap),
              giftWrapPrice: Number(it.giftWrapPrice || it.gift?.giftWrapPrice || 0),

              giftOccasion: String(it.giftOccasion || it.occasion || it.gift?.occasion || ""),
              giftMessage: String(it.giftMessage || it.gift?.giftMessage || it.meta?.message || ""),
              recipientName: String(it.recipientName || it.gift?.recipientName || it.meta?.recipient || ""),
              recipientPhone: String(it.recipientPhone || it.gift?.recipientPhone || "")
            };
          })
          .filter(Boolean);

        if (!items.length) {
          setError("Cart is empty. Please add items again.");
          return;
        }

        const payload = {
          items,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: mobile.trim(),
            email: (email || "").trim(),
            line1: addressLine.trim(),
            line2: (addressLine2 || "").trim(),
            city: (city || "").trim(),
            state: (state || "").trim(),
            pincode: (pincode || "").trim(),
            landmark: (landmark || "").trim()
          },
          notes: (deliveryNotes || "").trim(),
          discount: Number(totals.discount || 0),
          shipping: Number(totals.shipping || 0),
          payment: {
            method: payMethod === "PAYU" ? "ONLINE_PENDING" : "COD",
            provider: payMethod === "PAYU" ? "PAYU" : ""
          }
        };

        // 1) create order
        const created = await api.post("/api/orders/checkout", payload);
        const order = created?.order || created?.data?.order || null;

        if (!order?._id) {
          throw new Error("Order not created (missing order id)");
        }

        // 2) optionally save address to address book (safe to do before PayU redirect)
        if (saveToBook) {
          try {
            const addrPayload = {
              label: addressLabel || "Home",
              fullName: fullName.trim(),
              phone: mobile.trim(),
              line1: addressLine.trim(),
              line2: (addressLine2 || "").trim(),
              city: (city || "").trim(),
              state: (state || "").trim(),
              pincode: (pincode || "").trim(),
              landmark: (landmark || "").trim(),
              isDefault: !!setAsDefault
            };

            const res = await api.post("/api/me/addresses", addrPayload);
            const list = Array.isArray(res?.addresses) ? res.addresses : [];
            setAddresses(list);

            const def = pickDefaultAddress(list);
            if (def?._id) setSelectedAddressId(def._id);
          } catch {
            // do not block
          }
        }

        // 3) PayU flow (do NOT clear cart here; clear after successful payment)
        if (payMethod === "PAYU") {
          const payuRes = await api.post("/api/payments/payu/initiate", {
            purpose: "SHOP_ORDER",
            orderId: order._id
          });

          setPayu({ actionUrl: payuRes?.actionUrl, fields: payuRes?.fields });
          return;
        }

        // 4) COD flow: clear cart immediately
        await clearCart();
        await refreshCart();

        setToastOpen(true);
        window.clearTimeout(window.__asb_toast_checkout);
        window.__asb_toast_checkout = window.setTimeout(() => setToastOpen(false), 1400);

        window.setTimeout(() => navigate("/dashboard/orders"), 350);
      } catch (e) {
        console.error("Checkout failed:", e);
        setError(e?.response?.message || e?.message || "Checkout failed. Please try again.");
      } finally {
        setPlacing(false);
      }
    });
  };

  return (
    <div className={styles.page}>
      {/* Auto submit PayU form if present */}
      {payu ? <PayuAutoForm actionUrl={payu.actionUrl} fields={payu.fields} /> : null}

      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Checkout</h1>
          <p className={styles.sub}>A calm, stress-free checkout experience.</p>
        </div>
        <Link to="/cart" className={`btn-outline ${styles.btnLink}`}>
          Back to Cart
        </Link>
      </div>

      {empty ? (
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>Your cart is empty</h3>
          <p className={styles.emptySub}>Please add items before checkout.</p>
          <Link to="/shop" className="btn-primary">
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className={styles.split}>
          {/* Address / Details */}
          <section className={styles.formCard}>
            <div className={styles.cardTitle}>Delivery Address</div>

            {/* Saved address dropdown */}
            {!meLoading && addresses.length > 0 ? (
              <div className={styles.payCard} style={{ marginBottom: 12 }}>
                <div className={styles.payTitle}>Choose saved address</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <select
                    className={styles.input}
                    value={selectedAddressId}
                    onChange={(e) => onSelectAddress(e.target.value)}
                  >
                    {(addresses || []).map((a) => (
                      <option key={a._id} value={a._id}>
                        {(a.label || "Address") + (a.isDefault ? " • Default" : "") + (a.city ? ` • ${a.city}` : "")}
                      </option>
                    ))}
                  </select>

                  <div className={styles.muted} style={{ fontWeight: 800 }}>
                    Tip: edit saved addresses in Dashboard → Profile.
                  </div>
                </div>
              </div>
            ) : null}

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Mobile</label>
                <input className={styles.input} value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email {payMethod === "PAYU" ? "(required)" : "(optional)"}</label>
                <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Address Line 1</label>
                <input className={styles.input} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Address Line 2 (optional)</label>
                <input className={styles.input} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>City</label>
                <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>State</label>
                <input className={styles.input} value={state} onChange={(e) => setState(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Pincode</label>
                <input className={styles.input} value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Landmark (optional)</label>
                <input className={styles.input} value={landmark} onChange={(e) => setLandmark(e.target.value)} />
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Delivery Notes (optional)</label>
                <input className={styles.input} value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
              </div>
            </div>

            {/* Save to address book */}
            <div className={styles.payCard} style={{ marginTop: 12 }}>
              <div className={styles.payTitle}>Save this address</div>

              <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
                <input type="checkbox" checked={saveToBook} onChange={(e) => setSaveToBook(e.target.checked)} />
                Save this address to my Address Book
              </label>

              {saveToBook ? (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                      className={styles.input}
                      style={{ flex: 1, minWidth: 220 }}
                      placeholder="Label (Home / Office)"
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                    />
                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
                      <input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} />
                      Set as default
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className={styles.payCard}>
                <div className={styles.payTitle}>Error</div>
                <p className={styles.muted}>{error}</p>
              </div>
            ) : null}

            {/* Payment selection */}
            <div className={styles.payCard}>
              <div className={styles.payTitle}>Payment</div>
              <div className={styles.payOptions}>
                <button
                  type="button"
                  className={styles.payOpt}
                  onClick={() => setPayMethod("PAYU")}
                  style={{ border: payMethod === "PAYU" ? "2px solid var(--border)" : undefined }}
                >
                  Pay Online (PayU)
                </button>
                <button
                  type="button"
                  className={styles.payOpt}
                  onClick={() => setPayMethod("COD")}
                  style={{ border: payMethod === "COD" ? "2px solid var(--border)" : undefined }}
                >
                  Cash on Delivery
                </button>
              </div>
              <p className={styles.muted} style={{ marginTop: 8 }}>
                Selected: <b>{payMethod === "PAYU" ? "PayU Online" : "COD"}</b>
              </p>
            </div>
          </section>

          {/* Summary */}
          <aside className={styles.summaryCard}>
            <div className={styles.cardTitle}>Order Summary</div>

            <div className={styles.itemMiniList}>
              {cartRows.map((it) => (
                <div key={it.key} className={styles.itemMini}>
                  <div className={styles.itemMiniLeft}>
                    <div className={styles.itemMiniName}>{it.name}</div>
                    <div className={styles.itemMiniMeta}>
                      {it.category} • Qty {it.qty}
                      {it.meta?.gift ? " • Gift" : ""}
                      {it.meta?.giftWrap ? " • Gift Wrap" : ""}
                    </div>
                  </div>
                  <div className={styles.itemMiniPrice}>₹{it.price * it.qty}</div>
                </div>
              ))}
            </div>

            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={styles.muted}>Subtotal</span>
              <span className={styles.value}>₹{subtotal}</span>
            </div>

            {giftWrapTotal > 0 ? (
              <div className={styles.row}>
                <span className={styles.muted}>Gift Wrap</span>
                <span className={styles.value}>₹{giftWrapTotal}</span>
              </div>
            ) : null}

            <div className={styles.row}>
              <span className={styles.muted}>Shipping</span>
              <span className={styles.value}>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>₹{total}</span>
            </div>

            <button className="btn-primary" type="button" onClick={placeOrder} disabled={placing || loading}>
              {placing ? "Placing..." : payMethod === "PAYU" ? "Pay & Place Order" : "Place Order"}
            </button>

            <p className={styles.smallHelp}>
              Backend validates cart & stock. PayU orders are placed first, then paid securely.
            </p>
          </aside>
        </div>
      )}

      <Toast open={toastOpen} message="Order placed" />
    </div>
  );
}
