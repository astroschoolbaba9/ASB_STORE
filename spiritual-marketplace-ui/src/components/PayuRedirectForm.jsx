import { useEffect, useRef } from "react";

export default function PayuRedirectForm({ actionUrl, fields }) {
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) formRef.current.submit();
  }, []);

  if (!actionUrl || !fields) return null;

  return (
    <form ref={formRef} method="POST" action={actionUrl}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
      <noscript>
        <button type="submit">Continue to PayU</button>
      </noscript>
    </form>
  );
}
