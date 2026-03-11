// src/components/NavratriPopup/NavratriPopup.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NavratriPopup.module.css";
import { useCart } from "../../context/CartContext";
import { api } from "../../lib/api";
import useRequireAuth from "../../hooks/useRequireAuth";

const POPUP_SESSION_KEY = "asb_navratri_popup_shown";
const POPUP_DELAY_MS = 3000;
const PRODUCT_SLUG = "kuber-potli-healing";
const OFFER_PRICE = 2100;

function NavratriPopup() {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState(null);
    const [product, setProduct] = useState(null);

    const navigate = useNavigate();
    const { addToCart } = useCart();
    const requireAuth = useRequireAuth();

    // ── Fetch product ID by slug on mount ──
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                // Try fetching the product by slug to get its _id
                const res = await api.get("/api/products", {
                    query: { search: PRODUCT_SLUG, limit: 1 },
                });

                const items =
                    res?.items || res?.products || res?.data || [];
                const foundProduct = items.find(
                    (p) => p.slug === PRODUCT_SLUG || p.title?.toLowerCase().includes("kuber potli")
                );

                if (mounted && foundProduct) {
                    setProductId(foundProduct._id || foundProduct.id);
                    setProduct(foundProduct);
                }
            } catch {
                // silently ignore — popup still shows, CTA navigates to product page
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // ── Show popup after delay (once per session) ──
    useEffect(() => {
        if (sessionStorage.getItem(POPUP_SESSION_KEY)) return;

        const timer = setTimeout(() => {
            setVisible(true);
        }, POPUP_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    const closePopup = useCallback(() => {
        setVisible(false);
        sessionStorage.setItem(POPUP_SESSION_KEY, "1");
    }, []);

    // ── Escape key closes popup ──
    useEffect(() => {
        if (!visible) return;
        const onKey = (e) => {
            if (e.key === "Escape") closePopup();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [visible, closePopup]);

    // ── CTA: add to cart & go to /cart ──
    const handleClaimOffer = useCallback(() => {
        requireAuth(async () => {
            if (!productId) {
                // Fallback: navigate to shop if product not found
                navigate("/shop");
                closePopup();
                return;
            }

            setLoading(true);
            try {
                await addToCart({ productId, qty: 1 });
                closePopup();
                navigate("/cart");
            } catch (err) {
                console.error("Failed to add Kuber Potli to cart:", err);
                // Still navigate to cart — the item might already be there
                closePopup();
                navigate("/cart");
            } finally {
                setLoading(false);
            }
        });
    }, [productId, addToCart, navigate, closePopup, requireAuth]);

    // ── Backdrop click ──
    const handleBackdropClick = useCallback(
        (e) => {
            if (e.target === e.currentTarget) closePopup();
        },
        [closePopup]
    );

    if (!visible || !product) return null;

    const isOutOfStock = product.stock <= 0;

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div
                className={`${styles.modal} ${isOutOfStock ? styles.outOfStockCard : ""}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="navratri-offer-title"
            >
                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={closePopup}
                    aria-label="Close popup"
                >
                    ✕
                </button>

                <div style={{ position: 'relative' }}>
                    <img
                        src={product.images?.[0] || "/banners/navratri-kuber-potli.jpg"}
                        alt={product.title}
                        className={`${styles.offerImage} ${isOutOfStock ? styles.greyscale : ""}`}
                    />
                    {isOutOfStock && (
                        <div className={styles.outOfStockOverlay}>
                            <span>OUT OF STOCK</span>
                        </div>
                    )}
                </div>

                <div className={styles.actionArea}>
                    <h2 id="navratri-offer-title" style={{ margin: '0 0 8px', fontSize: '22px', color: '#fff' }}>
                        {product.title}
                    </h2>
                    <div style={{ margin: '0 0 16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Invite health, wealth & abundance into your home this festive season.
                        <div style={{ marginTop: '10px' }}>
                            <span style={{ textDecoration: 'line-through', marginRight: '8px', color: 'rgba(255, 255, 255, 0.5)' }}>₹{product.mrp}</span>
                            <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold' }}>₹{product.price}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={styles.ctaBtn}
                        onClick={handleClaimOffer}
                        disabled={loading || isOutOfStock}
                    >
                        {loading ? "Adding..." : (isOutOfStock ? "Sold Out" : `Claim Offer @ ₹${OFFER_PRICE}`)}
                    </button>
                    <button
                        type="button"
                        className={styles.continueBtn}
                        onClick={closePopup}
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NavratriPopup;
