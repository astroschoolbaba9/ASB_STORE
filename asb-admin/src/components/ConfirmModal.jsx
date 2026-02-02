import Modal from "./Modal";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      title={title}
      open={open}
      onClose={() => !loading && onCancel?.()}
      footer={
        <>
          <button className={styles.btnGhost} onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            className={danger ? styles.btnDanger : styles.btnPrimary}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working..." : confirmText}
          </button>
        </>
      }
    >
      <div className={styles.msg}>{message}</div>
    </Modal>
  );
}
