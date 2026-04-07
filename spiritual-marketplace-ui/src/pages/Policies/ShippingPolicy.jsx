import React from "react";
import styles from "./Policies.module.css";
import JsonLd from "../../components/common/JsonLd";

export default function ShippingPolicy() {
    const lastUpdated = "April 7, 2026";

    return (
        <div className={styles.container}>
            <JsonLd
                id="shipping-schema"
                data={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Shipping Policy - ASB Store",
                    "description": "Shipping policy for the ASB Store spiritual marketplace.",
                    "publisher": {
                        "@type": "Organization",
                        "name": "ASB Store"
                    }
                }}
            />

            <header className={styles.header}>
                <h1 className={styles.title}>Shipping Policy</h1>
                <p className={styles.updated}>Last Updated: {lastUpdated}</p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Shipping Overview</h2>
                <div className={styles.content}>
                    <p>
                        At ASB Store, we aim to deliver our spiritual products to you in the best condition and
                        as quickly as possible. We ship to most locations across India and select international
                        destinations.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Order Processing Time</h2>
                <div className={styles.content}>
                    <p>
                        Orders are typically processed within 1-3 business days. Processing includes verifying,
                        quality checking, and packaging your items. Orders placed on weekends or holidays will
                        be processed on the next business day.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Shipping Rates & Delivery Estimates</h2>
                <div className={styles.content}>
                    <p>
                        Shipping charges for your order will be calculated and displayed at checkout.
                        Estimated delivery times are as follows:
                    </p>
                    <ul>
                        <li><strong>Standard Shipping (Domestic):</strong> 5-10 business days.</li>
                        <li><strong>Express Shipping (Domestic):</strong> 2-5 business days.</li>
                        <li><strong>International Shipping:</strong> 10-21 business days, depending on destination.</li>
                    </ul>
                    <p>
                        Please note that these are estimates and delays can occur during peak seasons or
                        unforeseen circumstances.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Shipment Tracking</h2>
                <div className={styles.content}>
                    <p>
                        Once your order has shipped, you will receive a shipment confirmation email containing
                        your tracking number(s). The tracking information will be active within 24 hours.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Customs, Duties & Taxes</h2>
                <div className={styles.content}>
                    <p>
                        ASB Store is not responsible for any customs and taxes applied to your order. All fees
                        imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Damages</h2>
                <div className={styles.content}>
                    <p>
                        If you received your order damaged, please contact us immediately at support@asbstore.in
                        with photos of the damaged item and packaging. Please save all packaging materials
                        and damaged goods before filing a claim.
                    </p>
                </div>
            </section>
        </div>
    );
}
