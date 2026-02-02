import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <h1 style={{ fontSize: 42, marginBottom: 10 }}>404</h1>
      <p style={{ color: "var(--muted)", marginBottom: 18 }}>
        Page not found.
      </p>
      <Link to="/" style={{ textDecoration: "underline" }}>
        Go back home
      </Link>
    </div>
  );
}
