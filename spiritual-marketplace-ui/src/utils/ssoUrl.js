/**
 * Build an SSO-aware URL for asbreport.in.
 * Appends the user's JWT token as ?token=<jwt> so asbreport.in
 * can auto-login the user without requiring a separate sign-in.
 */
export function buildSsoUrl(baseUrl) {
    const token = localStorage.getItem("asb_access_token");
    if (!token) return baseUrl;

    try {
        const url = new URL(baseUrl);
        url.searchParams.set("token", token);
        return url.toString();
    } catch {
        // fallback: just append manually
        const sep = baseUrl.includes("?") ? "&" : "?";
        return `${baseUrl}${sep}token=${encodeURIComponent(token)}`;
    }
}
