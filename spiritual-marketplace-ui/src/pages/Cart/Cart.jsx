import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Cart.module.css";

import useRequireAuth from "../../hooks/useRequireAuth";
import { useCart } from "../../context/CartContext";
import { getFriendlyMessage } from "../../utils/errorMapping";
import Toast from "../../components/ui/Toast";
import { useState } from "react";


export default function Cart() {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const { cart, loading, refreshCart, updateCartItem, removeCartItem, clearCart } = useCart();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartRows = useMemo(() => {
    const items = cart?.items || [];

    return items
      .map((it) => {
        const p = it.product || it.productId || it.productRef || null;

        const itemId = it._id || it.id || it.itemId || it.cartItemId || it.lineId || null;
        const productId = (p && (p._id || p.id)) || null;

        if (!p || !productId || !itemId) return null;

        const name = p.title || p.name || "Product";
        const price = p.price ?? 0;
        const category = p.category?.name || p.category || "General";

        const gift = it.isGift || it.gift?.isGift || it.gift === true || false;
        const giftWrap = it.giftWrap || it.gift?.giftWrap || false;

        const recipient = it.recipientName || it.gift?.recipientName || it.meta?.recipient || "";
        const occasion = it.giftOccasion || it.occasion || it.gift?.occasion || it.meta?.occasion || "";
        const giftMessage = it.giftMessage || it.gift?.giftMessage || it.meta?.message || "";

        return {
          key: String(itemId),
          itemId: String(itemId),
          productId: String(productId),
          qty: it.qty || 1,
          name,
          price,
          category,
          gift,
          giftWrap,
          recipient,
          occasion,
          giftMessage
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

  const hasItems = cartRows.length > 0;

  const handleClearCart = async () => {
    await requireAuth(async () => {
      await clearCart();
      await refreshCart();
    });
  };

  const updateQty = async (itemId, nextQty) => {
    await requireAuth(async () => {
      try {
        await updateCartItem(itemId, { qty: nextQty });
        await refreshCart();
      } catch (e) {
        if (e?.code === "OUT_OF_STOCK") {
          const stock = Number(e?.details?.stock ?? 0);

          if (stock <= 0) {
            await removeCartItem(itemId);
            await refreshCart();
            showToast("This item is now out of stock and was removed from your cart.");
            return;
          }

          await updateCartItem(itemId, { qty: stock });
          await refreshCart();
          showToast(`Only ${stock} available. Quantity updated to ${stock}.`);
          return;
        }

        showToast(getFriendlyMessage(e));
      }

    });
  };

  const removeItem = async (itemId) => {
    await requireAuth(async () => {
      try {
        await removeCartItem(itemId);
        await refreshCart();
      } catch (e) {
        showToast(getFriendlyMessage(e));
      }

    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Cart</h1>
          <p className={styles.sub}>Review items, adjust quantity, and checkout peacefully.</p>
        </div>

        <div className={styles.headActions}>
          <Link to="/shop" className={`btn-outline ${styles.btnLink}`}>
            Continue Shopping
          </Link>

          {hasItems ? (
            <button type="button" className={`btn-outline ${styles.btnLink}`} onClick={handleClearCart} disabled={loading}>
              Clear Cart
            </button>
          ) : null}
        </div>
      </div>

      {!hasItems ? (
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>Your cart is empty</h3>
          <p className={styles.emptySub}>Add something calm and meaningful from the shop.</p>
          <Link to="/shop" className="btn-primary">
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className={styles.split}>
          <section className={styles.items}>
            {cartRows.map((it) => (
              <div key={it.key} className={styles.itemRow}>
                <div className={styles.media}>
                  <div className={styles.badge}>{it.category}</div>
                </div>

                <div className={styles.details}>
                  <div className={styles.title}>{it.name}</div>
                  <div className={styles.muted}>₹{it.price} • Item</div>

                  {it.gift ? (
                    <div className={styles.giftMini}>
                      Gift: {it.recipient || "Recipient"} • {it.occasion || "Occasion"}
                      {it.giftWrap ? " • Wrap" : ""}
                    </div>
                  ) : null}

                  <div className={styles.controls}>
                    <div className={styles.qty}>
                      <button
                        className={styles.qtyBtn}
                        type="button"
                        onClick={() => updateQty(it.itemId, Math.max(1, it.qty - 1))}
                        aria-label="Decrease quantity"
                        disabled={loading}
                      >
                        −
                      </button>
                      <div className={styles.qtyVal}>{it.qty}</div>
                      <button
                        className={styles.qtyBtn}
                        type="button"
                        onClick={() => updateQty(it.itemId, it.qty + 1)}
                        aria-label="Increase quantity"
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>

                    <button className={`btn-outline ${styles.smallBtn}`} type="button" onClick={() => removeItem(it.itemId)} disabled={loading}>
                      Remove
                    </button>
                  </div>
                </div>

                <div className={styles.lineTotal}>₹{it.price * it.qty}</div>
              </div>
            ))}

            <div className={styles.giftNote}>
              <div className={styles.giftTitle}>Gifting Note</div>
              <p className={styles.giftText}>Gift details are stored per item in backend cart (including gift wrap).</p>
            </div>
          </section>

          <aside className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>Order Summary</div>

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

              <button className="btn-primary" type="button" onClick={() => requireAuth(() => navigate("/checkout"))} disabled={loading}>
                Proceed to Checkout
              </button>

              <div className={styles.smallHelp}>Free shipping above ₹1499. Calm checkout experience.</div>
            </div>
          </aside>
        </div>
      )}
      <Toast open={toastOpen} message={toastMsg} />
    </div>
  );
}
