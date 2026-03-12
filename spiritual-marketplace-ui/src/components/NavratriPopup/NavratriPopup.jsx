// src/components/NavratriPopup/NavratriPopup.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NavratriPopup.module.css";
import { useCart } from "../../context/CartContext";
import { api, API_BASE } from "../../lib/api";
import useRequireAuth from "../../hooks/useRequireAuth";

function absUrl(u) {
    if (!u) return "";
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    if (u.startsWith("/banners/") || u.startsWith("/assets/")) return u;
    return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

const POPUP_SESSION_KEY = "asb_navratri_popup_shown";
const POPUP_DELAY_MS = 3000;
const PRODUCT_SLUG = "kuber-potli-healing";
const OFFER_PRICE = 2100;

function NavratriPopup() {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState(null);
    const [product, setProduct] = useState(null);
    const [potliBannerImage, setPotliBannerImage] = useState(null);

    const { addItem, addToCart } = useCart();
    const handleAdd = addItem || addToCart;

    const navigate = useNavigate();
    const requireAuth = useRequireAuth();

    // ── Fetch product & banner on mount ──
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                // 1. Fetch products with a generic search to support older backends
                const res = await api.get("/api/products", {
                    query: { search: "potli", limit: 50 },
                });

                const items = res?.items || res?.products || res?.data || [];
                // Look for direct slug match OR title match
                const foundProduct = items.find(
                    (p) => p.slug === PRODUCT_SLUG || p.title?.toLowerCase().includes("kuber potli")
                );

                if (mounted && foundProduct) {
                    setProductId(foundProduct._id || foundProduct.id);
                    setProduct(foundProduct);
                } else {
                    // One more try with direct slug if not found in search results
                    try {
                        const directRes = await api.get("/api/products", {
                            query: { slug: PRODUCT_SLUG, limit: 1 }
                        });
                        const directItem = directRes?.items?.[0] || directRes?.products?.[0];
                        if (mounted && directItem) {
                            setProductId(directItem._id || directItem.id);
                            setProduct(directItem);
                        }
                    } catch { /* ignore fallback error */ }
                }

                // 2. Try fetching banners for a "Potli" specific image
                const bRes = await api.get("/api/banners");
                const bList = bRes?.banners || bRes?.data || [];
                const potliBanner = bList.find(b =>
                    b.title?.toLowerCase().includes("potli") ||
                    b.subtitle?.toLowerCase().includes("potli")
                );

                if (mounted && potliBanner) {
                    // If we found a specific banner for the potli, we can use its image
                    // We'll store it in a state or just use it in displayImage logic
                    setPotliBannerImage(potliBanner.imageUrl);
                }
            } catch {
                // silently ignore
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // ── Show popup after delay ──
    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, POPUP_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    const closePopup = useCallback(() => {
        setVisible(false);
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
                await handleAdd({ productId, qty: 1 });
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
    }, [productId, handleAdd, navigate, closePopup, requireAuth]);

    const handleContinueShopping = useCallback(() => {
        closePopup();
        navigate("/shop");
    }, [closePopup, navigate]);

    // ── Backdrop click ──
    const handleBackdropClick = useCallback(
        (e) => {
            if (e.target === e.currentTarget) closePopup();
        },
        [closePopup]
    );

    const isOutOfStock = product?.stock <= 0;
    const displayTitle = product?.title || "Kuber Potli - Sacred Healing";
    const displayPrice = product?.price || 2100;
    const displayMrp = product?.mrp || 7500;
    const isMobile = window.innerWidth <= 480;
    const displayImage = "/navratri-poster.jpg"; // Using the public asset for reliable cross-browser loading.

    if (!visible) return null;

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
                        src={displayImage}
                        alt={displayTitle}
                        className={`${styles.offerImage} ${isOutOfStock ? styles.greyscale : ""}`}
                    />
                    {isOutOfStock && (
                        <div className={styles.outOfStockOverlay}>
                            <span>OUT OF STOCK</span>
                        </div>
                    )}
                </div>

                <div className={styles.actionArea}>
                    {/* Redundant text removed to let the poster design shine */}
                </div>

                <button
                    type="button"
                    className={styles.ctaBtn}
                    style={{ background: "linear-gradient(45deg, #FF8C00, #FFD700)", border: "none", color: "#000", fontWeight: "bold" }}
                    onClick={handleClaimOffer}
                    disabled={loading || isOutOfStock}
                >
                    {loading ? "Adding to Cart..." : (isOutOfStock ? "Sold Out" : `Claim Offer @ ₹${OFFER_PRICE} + ₹150 Charges`)}
                </button>
                <button
                    type="button"
                    className={styles.continueBtn}
                    onClick={handleContinueShopping}
                >
                    Continue Shopping
                </button>
            </div>
        </div>
    );
}

export default NavratriPopup;
