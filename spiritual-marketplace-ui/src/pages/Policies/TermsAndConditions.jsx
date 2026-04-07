import React from "react";
import styles from "./Policies.module.css";
import JsonLd from "../../components/common/JsonLd";

export default function TermsAndConditions() {
    const lastUpdated = "April 7, 2026";

    return (
        <div className={styles.container}>
            <JsonLd
                id="terms-schema"
                data={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Terms and Conditions - ASB Store",
                    "description": "Terms and conditions for using the ASB Store spiritual marketplace.",
                    "publisher": {
                        "@type": "Organization",
                        "name": "ASB Store"
                    }
                }}
            />

            <header className={styles.header}>
                <h1 className={styles.title}>Terms and Conditions</h1>
                <p className={styles.updated}>Last Updated: {lastUpdated}</p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Agreement to Terms</h2>
                <div className={styles.content}>
                    <p>
                        Welcome to ASB Store (the "Site"). By accessing or using our website, services, and applications,
                        you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree
                        to all of these terms, do not use this Site.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Use of the Site</h2>
                <div className={styles.content}>
                    <p>
                        You may use the Site only for lawful purposes and in accordance with these Terms. You agree not
                        to use the Site in any way that violates any applicable local, state, national, or international law.
                    </p>
                    <ul>
                        <li>You must be at least 18 years old to make a purchase.</li>
                        <li>You are responsible for maintaining the confidentiality of your account information.</li>
                        <li>We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion.</li>
                    </ul>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Intellectual Property</h2>
                <div className={styles.content}>
                    <p>
                        All content on this Site, including text, graphics, logos, images, and software, is the property
                        of ASB Store or its content suppliers and is protected by intellectual property laws. You may
                        not reproduce, distribute, or create derivative works from this content without express
                        written permission.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Product Descriptions & Pricing</h2>
                <div className={styles.content}>
                    <p>
                        We strive to be as accurate as possible with product descriptions and pricing. However, we do
                        not warrant that product descriptions or other content is accurate, complete, reliable,
                        current, or error-free. In the event of a pricing error, we reserve the right to cancel
                        any orders placed at the incorrect price.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Limitation of Liability</h2>
                <div className={styles.content}>
                    <p>
                        ASB Store shall not be liable for any direct, indirect, incidental, special, or consequential
                        damages resulting from the use or inability to use the Site or for the cost of procurement
                        of substitute goods and services.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Governing Law</h2>
                <div className={styles.content}>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of India, without
                        regard to its conflict of law provisions.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Contact Us</h2>
                <div className={styles.content}>
                    <p>
                        If you have any questions about these Terms, please contact us at support@asbstore.in.
                    </p>
                </div>
            </section>
        </div>
    );
}
