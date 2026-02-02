import styles from "./DropdownPanel.module.css";

export default function DropdownPanel({ items = [], onPick }) {
  return (
    <div className={styles.panel} role="menu">
      {items.map((label, idx) => (
        <div
          key={label + idx}
          className={styles.item}
          onClick={() => onPick?.(label)}
          role="menuitem"
          tabIndex={0}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
