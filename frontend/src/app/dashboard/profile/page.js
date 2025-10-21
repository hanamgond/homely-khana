'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useContext } from 'react';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- CORRECTED PATHS USING ALIAS ---
import styles from "@/styles/DashboardProfile.module.css";
import arrow from "@/assets/arrow.svg";
import mapPin from "@/assets/mapPin.png";
import homePin from "@/assets/homePin.png";
import hotelPin from "@/assets/hotelPin.png";
import workPin from "@/assets/workPin.png";
import hidePass from "@/assets/hidePass.png";
import showPass from "@/assets/showPass.png";

//components
import AddNewDrawer from "@/components/drawers/AddNewDrawer";
import DashboardSideBar from "@/components/dashboardsideBar";

//utils
import { AppContext } from "@/utils/AppContext";
import { fetchWithToken } from "@/utils/CookieManagement";

// This is the interactive client part of the page
export default function ProfileClient() {
   const [expand, setExpand] = useState([false, false]);
   const [oldPassword, setOldPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [re_enteredNewPassword, setRe_enteredNewPassword] = useState("");
   const [newPasswordError, setNewPasswordError] = useState("");
   const [oldPasswordError, setOldPasswordError] = useState("");
   const [re_enteredNewPasswordError, setRe_enteredNewPasswordError] = useState("");
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showOldPassword, setShowOldPassword] = useState(false);
   const [showRe_enteredNewPassword, setShowRe_eneteredNewPassword] = useState(false);
   const [addresses, setAddresses] = useState([]);
   const [showAddNewDiv, setShowAddNewDiv] = useState(false);
   const [error, setError] = useState(null);

   const router = useRouter();
   const { user } = useContext(AppContext); // Get user from context

   const toggleExpand = (index) => {
      setExpand(prev => prev.map((item, i) => i === index ? !item : item));
   };

   const handleChangePassword = async () => {
      // (Password change logic remains the same)
      if (newPassword !== re_enteredNewPassword) {
         setRe_enteredNewPasswordError("Passwords do not match.");
         return;
      }
      if (!oldPassword || !newPassword) {
         if (!newPassword) setNewPasswordError("Input cannot be empty.");
         if (!oldPassword) setOldPasswordError("Input cannot be empty.");
         return;
      }
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
      if (!passwordRegex.test(newPassword)) {
         setNewPasswordError("Password must be at least 6 characters long and contain both letters and numbers");
         return;
      }
      try {
         const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/users/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword, newPassword })
         });
         const data = await response.json();
         if (!data.success) {
            toast.error(data.error || "Failed to change password");
         } else {
            toast.success("Password changed successfully");
            setOldPassword("");
            setNewPassword("");
            setRe_enteredNewPassword("");
            setNewPasswordError("");
            setOldPasswordError("");
            setRe_enteredNewPasswordError("");
         }
      } catch (err) {
         toast.error("An error occurred. Please try again.");
      }
   };

   const getAddressIcon = (type) => { /* (Logic remains the same) */ 
      switch (type) {
         case 1: return homePin;
         case 2: return workPin;
         case 3: return hotelPin;
         default: return mapPin;
      }
   };

   const getAddressText = (type) => { /* (Logic remains the same) */ 
      switch (type) {
         case 1: return "Home";
         case 2: return "Work";
         case 3: return "Hotel";
         default: return "Other";
      }
   };
   
   useEffect(() => {
      const fetchAddresses = async () => {
         try {
            const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/address/all`);
            if (!response.ok) throw new Error('Failed to fetch addresses');
            const res = await response.json();
            setAddresses(res.data);
         } catch (err) {
            setError(err.message);
         }
      };
      fetchAddresses();
   }, []);

   return (
      <div className={styles.main}>
         <DashboardSideBar />

         <div className={styles.mainRight}>
            
            <div className={`${styles.rightParent} ${styles.expandRightParent}`}>
               <p className={`${styles.rightTitle} ${styles.titleBorder}`}>Your Details</p>
               <div className={styles.rightInfoCtn}>
                  <p className={styles.rightInfo}><span>Name</span> <span>:</span> <span>{user?.name || 'Loading...'}</span></p>
                  <p className={styles.rightInfo}><span>Email</span> <span>:</span> <span>{user?.email || 'Loading...'}</span></p>
                  <p className={styles.rightInfo}><span>Phone</span> <span>:</span> <span>{user?.phone || 'Loading...'}</span></p>
               </div>
               <p>Happy to serve you over the last 6 months ...</p>
            </div>

            <div className={`${styles.rightParent} ${expand[0] ? styles.expandRightParent : ''}`}>
               <div className={styles.rightChipHeroCtn}>
                  <p className={`${styles.rightTitle} ${expand[0] ? styles.titleBorder : ''}`}>Change Password</p>
                  <button onClick={() => toggleExpand(0)} className={`${styles.expandBtn} ${expand[0] ? styles.rotateBtn : ''}`}>
                     <Image src={arrow} alt="Expand" />
                  </button>
               </div>
               <div className={styles.passwordFields}>
                  <div className={styles.inputCtn}>
                     <label htmlFor="oldPassword" className={`${styles.passwordLabel} ${oldPassword ? styles.filled : ""}`}>Old Password</label>
                     <input
                        type={showOldPassword ? "text" : "password"}
                        id="oldPassword"
                        className={styles.passwordInput}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                     />
                     <button type="button" className={styles.toggleButton} onClick={() => setShowOldPassword((prev) => !prev)}>
                        <Image src={showOldPassword ? hidePass : showPass} alt="Toggle password visibility" className={styles.passIcon} />
                     </button>
                     {oldPasswordError && <p className={styles.error}>{oldPasswordError}</p>}
                  </div>

                  <div className={styles.inputCtn}>
                     <label htmlFor="newPassword" className={`${styles.passwordLabel} ${newPassword ? styles.filled : ""}`}>New Password</label>
                     <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        className={styles.passwordInput}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                     />
                     <button type="button" className={styles.toggleButton} onClick={() => setShowNewPassword((prev) => !prev)}>
                        <Image src={showNewPassword ? hidePass : showPass} alt="Toggle password visibility" className={styles.passIcon} />
                     </button>
                     {newPasswordError && <p className={styles.error}>{newPasswordError}</p>}
                  </div>

                  <div className={styles.inputCtn}>
                     <label htmlFor="re_enteredNewPassword" className={`${styles.passwordLabel} ${re_enteredNewPassword ? styles.filled : ""}`}>Re-enter New Password</label>
                     <input
                        type={showRe_enteredNewPassword ? "text" : "password"}
                        id="re_enteredNewPassword"
                        className={styles.passwordInput}
                        value={re_enteredNewPassword}
                        onChange={(e) => setRe_enteredNewPassword(e.target.value)}
                     />
                     <button type="button" className={styles.toggleButton} onClick={() => setShowRe_eneteredNewPassword((prev) => !prev)}>
                        <Image src={showRe_enteredNewPassword ? hidePass : showPass} alt="Toggle password visibility" className={styles.passIcon} />
                     </button>
                     {re_enteredNewPasswordError && <p className={styles.error}>{re_enteredNewPasswordError}</p>}
                  </div>
                  <button onClick={handleChangePassword} className={styles.savePasswordBtn}>Update Password</button>
               </div>
            </div>

            <div className={`${styles.rightParent} ${expand[1] ? styles.expandRightParent : ''}`}>
               <div className={styles.rightChipHeroCtn}>
                  <p className={`${styles.rightTitle} ${expand[1] ? styles.titleBorder : ''}`}>Manage Address</p>
                  <button onClick={() => toggleExpand(1)} className={`${styles.expandBtn} ${expand[1] ? styles.rotateBtn : ''}`}>
                     <Image src={arrow} alt="Expand" />
                  </button>
               </div>
               {showAddNewDiv && <AddNewDrawer addresses={addresses} setAddresses={setAddresses} showAddNewDiv={showAddNewDiv} setShowAddNewDiv={setShowAddNewDiv} />}
               <div className={styles.addCtn}>
                  <button className={styles.addAddBtn} onClick={() => setShowAddNewDiv(true)}> + Add Address</button>
                  <div className={styles.addChipCtn}>
                     {addresses.map((address) => (
                        <div key={address.id} className={styles.chip}>
                           <Image src={getAddressIcon(address.address_type)} className={styles.chipImg} alt="Address type icon" />
                           <div>
                              <p className={styles.chipTitle}>{getAddressText(address.address_type)}</p>
                              <p className={styles.chipBody}>{address.content}</p>
                              <p className={styles.chipCaption}>{address.rec_name}, {address.number}</p>
                           </div>
                        </div>
                     ))}
                     {addresses.length === 0 && <p>No saved addresses found.</p>}
                     {error && <p className={styles.error}>{error}</p>}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
