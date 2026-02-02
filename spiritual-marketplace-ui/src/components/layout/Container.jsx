export default function Container({ children }) {
  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 16px" }}>
      {children}
    </div>
  );
}
