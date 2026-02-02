import styles from "./InstagramFloat.module.css";

export default function InstagramFloat() {
  const instaLink = "https://www.instagram.com/astroschoolbaba/";

  return (
    <a
      href={instaLink}
      className={styles.fab}
      target="_blank"
      rel="noreferrer"
      aria-label="Instagram"
      title="Instagram"
    >
      📷
    </a>
  );
}
