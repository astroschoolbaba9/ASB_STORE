import styles from "./Toast.module.css";

export default function Toast({ open, message }) {
  if (!open) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
