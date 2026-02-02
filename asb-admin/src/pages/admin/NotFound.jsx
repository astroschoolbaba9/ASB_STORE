import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Page not found</h2>
      <Link to="/admin/login">Go to Admin Login</Link>
    </div>
  );
}
