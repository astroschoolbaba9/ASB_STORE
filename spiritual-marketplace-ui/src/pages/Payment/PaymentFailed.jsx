import { Link, useLocation } from "react-router-dom";

export default function PaymentFailed() {
  const q = new URLSearchParams(useLocation().search);
  const purpose = q.get("purpose");
  const orderId = q.get("orderId");
  const courseId = q.get("courseId");

  return (
    <div style={{ padding: 16 }}>
      <h2>Payment failed ❌</h2>
      <p>Please try again.</p>

      {purpose === "shop" ? (
        <Link className="btn-primary" to={orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders"}>
          Back to Order
        </Link>
      ) : purpose === "course" ? (
        <Link className="btn-primary" to={courseId ? `/courses/${courseId}` : "/courses"}>
          Back to Course
        </Link>
      ) : (
        <Link className="btn-primary" to="/">
          Home
        </Link>
      )}
    </div>
  );
}
