import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function goLogin() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Access Denied</h2>
      <p>Your account is not an admin.</p>
      <button onClick={goLogin} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
        Back to Login
      </button>
    </div>
  );
}
