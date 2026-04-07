import React from "react";
import styles from "./Policies.module.css";
import JsonLd from "../../components/common/JsonLd";

export default function RefundPolicy() {
    const lastUpdated = "April 7, 2026";

    return (
        <div className={styles.container}>
            <JsonLd
                id="refund-schema"
                data={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Refund Policy - ASB Store",
                    "description": "Refund and cancellation policy for the ASB Store spiritual marketplace.",
                    "publisher": {
                        "@type": "Organization",
                        "name": "ASB Store"
                    }
                }}
            />

            <header className={styles.header}>
                <h1 className={styles.title}>Refund & Cancellation Policy</h1>
                <p className={styles.updated}>Last Updated: {lastUpdated}</p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Cancellation Policy</h2>
                <div className={styles.content}>
                    <p>
                        You may cancel your order within 12 hours of placing it for a full refund, provided
                        it has not yet been processed or shipped. To cancel your order, please contact us
                        at support@asbstore.in.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Returns</h2>
                <div className={styles.content}>
                    <p>
                        We want you to be completely satisfied with your purchase. If you are not happy
                        with your item, you may return it within 7 days of delivery.
                    </p>
                    <ul>
                        <li>Items must be unused and in the same condition that you received them.</li>
                        <li>Items must be in their original packaging.</li>
                        <li>Several types of goods are exempt from being returned, such as personalized items or digital courses.</li>
                    </ul>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Refunds</h2>
                <div className={styles.content}>
                    <p>
                        Once your return is received and inspected, we will send you an email to notify you
                        that we have received your returned item and the status of your refund.
                        If approved, your refund will be processed, and a credit will automatically be
                        applied to your original method of payment within 5-10 business days.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Exchanges</h2>
                <div className={styles.content}>
                    <p>
                        We only replace items if they are defective or damaged. If you need to exchange
                        an item for the same product, please contact us at support@asbstore.in.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Services & Digital Products</h2>
                <div className={styles.content}>
                    <p>
                        Please note that digital products, courses, and spiritual consultations (services)
                        are generally non-refundable once accessed or once the session has been conducted.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Return Shipping</h2>
                <div className={styles.content}>
                    <p>
                        You will be responsible for paying your own shipping costs for returning your item.
                        Shipping costs are non-refundable. If you receive a refund, the cost of return
                        shipping will be deducted from your refund where applicable.
                    </p>
                </div>
            </section>
        </div>
    );
}
