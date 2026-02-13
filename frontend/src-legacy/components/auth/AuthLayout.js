// src/components/AuthLayout.js
import Head from 'next/head';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children, title }) => {
  return (
    <>
      <Head>
        <title>{title} - HomelyKhana</title>
      </Head>
      <div className={styles.pageContainer}>
        {/* Left Side: Image Panel */}
        <div className={styles.imagePanel}>
          {/* This is intentionally left empty; the image is a background */}
        </div>

        {/* Right Side: Form Panel */}
        <div className={styles.formPanel}>
          {children}
        </div>
      </div>
    </>
  );
};

export default AuthLayout;