// src/components/PromoPopup/PromoPopup.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PromoPopup.module.css";

const POPUP_DELAY_MS = 3000;

function PromoPopup() {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

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

    // ── CTA: navigate to shop ──
    const handleGoToShop = useCallback(() => {
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

    if (!visible) return null;

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="promo-offer-title"
            >
                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={closePopup}
                    aria-label="Close popup"
                >
                    ✕
                </button>

                <div
                    className={styles.imageWrap}
                    onClick={handleGoToShop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleGoToShop();
                    }}
                    aria-label="View Akshaya Tritiya offers — click to shop"
                >
                    <img
                        src={`${process.env.PUBLIC_URL}/akshaya-tritiya-offer.jpg`}
                        alt="Akshaya Tritiya Special Offer — Sacred Crystal Bracelets 25% OFF"
                        className={styles.offerImage}
                    />
                </div>
            </div>
        </div>
    );
}

export default PromoPopup;
