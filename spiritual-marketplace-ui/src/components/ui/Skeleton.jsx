import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = () => {
    return (
        <div className={styles.skeleton_container} aria-hidden="true">
            <div className={`${styles.skeleton_box} ${styles.skeleton_title}`} />
            <div className={`${styles.skeleton_box} ${styles.skeleton_rect}`} />
            <div className={`${styles.skeleton_box} ${styles.skeleton_text}`} />
            <div className={`${styles.skeleton_box} ${styles.skeleton_text}`} />
            <div className={`${styles.skeleton_box} ${styles.skeleton_text}`} style={{ width: '60%' }} />
        </div>
    );
};

export default Skeleton;
