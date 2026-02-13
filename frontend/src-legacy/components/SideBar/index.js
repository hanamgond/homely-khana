import React, { useState, useEffect } from "react";

import styles from "./SideBar.module.css"
import Link from "next/link";

const SideBar = ({ isOpen }) => {

    const [isMenuOpen, setIsMenuOpen] = useState(isOpen);

    useEffect(() => {
        setIsMenuOpen(isOpen);
    }, [isOpen]);

    return (
        <div className={`${isMenuOpen ? styles.container : styles.hide}`}>
            <div className={`${styles.parent} ${isMenuOpen ? styles.slide : ""}`}>
            <Link href="/" style={{textDecoration:"none", color:"black"}} >
                <div className={styles.link}>Home</div>
                </Link>
                <Link href="/login" style={{textDecoration:"none", color:"black"}} >
                <div className={styles.link}>Login</div>
                </Link>
                <Link href="/profile" style={{textDecoration:"none", color:"black"}} >
                <div className={styles.link}>Profile</div>
                </Link>
            </div>
        </div>
    )
}

export default SideBar