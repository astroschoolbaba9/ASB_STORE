import { useMemo } from "react";
import PayuRedirectForm from "../../components/PayuRedirectForm";

export default function PaymentRedirect() {
  const data = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("asb_payu") || "null"); } catch { return null; }
  }, []);

  if (!data?.actionUrl || !data?.fields) {
    return (
      <div style={{ padding: 18 }}>
        <h2>Payment session missing</h2>
        <p>Please try again.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 18 }}>
      <h2>Redirecting to PayU...</h2>
      <PayuRedirectForm actionUrl={data.actionUrl} fields={data.fields} />
    </div>
  );
}
