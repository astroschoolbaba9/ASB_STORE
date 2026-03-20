import { useEffect } from 'react';

/**
 * A simple component to inject JSON-LD into the document head.
 * This avoids the need for external dependencies like react-helmet.
 */
const JsonLd = ({ data, id }) => {
    useEffect(() => {
        if (!data) return;

        // Check if script already exists
        let script = document.getElementById(id);
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = id;
            document.head.appendChild(script);
        }

        script.text = JSON.stringify(data);

        // Optional: Cleanup on unmount
        return () => {
            const existing = document.getElementById(id);
            if (existing) {
                existing.remove();
            }
        };
    }, [data, id]);

    return null;
};

export default JsonLd;
