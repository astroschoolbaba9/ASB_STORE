import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = () => {
    return (
        <div className={styles.skeleton_page} aria-hidden="true">
            <div className={styles.skeleton_hero} />
            <div className={styles.skeleton_container}>
                <div className={`${styles.skeleton_box} ${styles.skeleton_title}`} />
                <div className={`${styles.skeleton_box} ${styles.skeleton_rect}`} />
                <div className={`${styles.skeleton_box} ${styles.skeleton_text}`} />
            </div>
        </div>
    );
};

export default Skeleton;
