import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaymentSuccess() {
  const q = useQuery();
  const navigate = useNavigate();
  const { clearCart, refreshCart } = useCart();

  useEffect(() => {
    (async () => {
      // If it was shop payment, clear cart now
      if (q.get("purpose") === "shop") {
        await clearCart();
        await refreshCart();
        navigate("/dashboard/orders");
      }
      if (q.get("purpose") === "course") {
        const courseId = q.get("courseId");
        navigate(courseId ? `/viewer/${courseId}` : "/dashboard/courses");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 18 }}>
      <h2>Payment successful ✅</h2>
      <p>Redirecting...</p>
    </div>
  );
}
