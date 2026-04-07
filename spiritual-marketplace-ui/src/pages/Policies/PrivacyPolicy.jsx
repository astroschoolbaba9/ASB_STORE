import React from "react";
import styles from "./Policies.module.css";
import JsonLd from "../../components/common/JsonLd";

export default function PrivacyPolicy() {
    const lastUpdated = "April 7, 2026";

    return (
        <div className={styles.container}>
            <JsonLd
                id="privacy-schema"
                data={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Privacy Policy - ASB Store",
                    "description": "Privacy policy for the ASB Store spiritual marketplace.",
                    "publisher": {
                        "@type": "Organization",
                        "name": "ASB Store"
                    }
                }}
            />

            <header className={styles.header}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.updated}>Last Updated: {lastUpdated}</p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Introduction</h2>
                <div className={styles.content}>
                    <p>
                        At ASB Store, we are committed to protecting your privacy and security. This Privacy Policy
                        outlines how we collect, use, and safeguard your personal information when you visit or
                        make a purchase from our Site.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
                <div className={styles.content}>
                    <p>
                        When you visit the Site, we automatically collect certain information about your device,
                        including information about your web browser, IP address, and time zone. Additionally,
                        when you make a purchase, we collect:
                    </p>
                    <ul>
                        <li>Personal details: Name, email address, phone number.</li>
                        <li>Shipping and billing addresses.</li>
                        <li>Payment information (processed securely through our payment partners).</li>
                    </ul>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
                <div className={styles.content}>
                    <p>
                        We use the information we collect to fulfill orders, communicate with you, and improve
                        your experience on our Site. Specifically, we use your information to:
                    </p>
                    <ul>
                        <li>Process and ship your orders.</li>
                        <li>Provide customer support.</li>
                        <li>Send order updates and promotional communications (with your consent).</li>
                        <li>Detect and prevent potential fraud or security risks.</li>
                    </ul>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Sharing Your Information</h2>
                <div className={styles.content}>
                    <p>
                        We share your personal information with third parties only to help us use your personal
                        information, as described above. For example, we use payment gateways to process
                        transactions and shipping carriers to deliver your orders. We do not sell your
                        personal information.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Your Rights</h2>
                <div className={styles.content}>
                    <p>
                        You have the right to access the personal information we hold about you and to ask for it
                        to be corrected or deleted. Please contact us to exercise these rights.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Security</h2>
                <div className={styles.content}>
                    <p>
                        We take reasonable precautions and follow industry best practices to ensure your personal
                        information is not inappropriately lost, misused, accessed, disclosed, altered, or destroyed.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Contact</h2>
                <div className={styles.content}>
                    <p>
                        For more information about our privacy practices, please contact us at privacy@asbstore.in.
                    </p>
                </div>
            </section>
        </div>
    );
}
