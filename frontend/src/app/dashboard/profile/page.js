'use client';

import Image from "next/image";
import React, { useState } from 'react'; // Removed useEffect and useContext
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import styles from "@/components/dashboard/DashboardProfile.module.css"; 

// --- UPDATED IMPORTS ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
// Import our new function
import { fetchProfile, fetchAddresses, changePassword } from '@/lib/api'; 

// --- ASSET IMPORTS (Unchanged) ---
import arrow from "@/assets/arrow.svg";
import mapPin from "@/assets/mapPin.png";
import homePin from "@/assets/homePin.png";
import hotelPin from "@/assets/hotelPin.png";
import workPin from "@/assets/workPin.png";
import hidePass from "@/assets/hidePass.png";
import showPass from "@/assets/showPass.png";

// --- COMPONENT IMPORTS (Unchanged) ---
import AddNewDrawer from "@/components/drawers/AddNewDrawer";
import DashboardSideBar from "@/components/dashboardsideBar";

// --- REMOVED IMPORTS ---
// import { fetchWithToken } from "@/utils/CookieManagement";
// import { AppContext } from "@/utils/AppContext";


export default function ProfileClient() {
   // --- LOCAL UI STATE (Unchanged) ---
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
   
   // --- THIS IS THE CORRECTED LINE ---
   const [showAddNewDiv, setShowAddNewDiv] = useState(false);
   // ---------------------------------
   
   const router = useRouter();
   const queryClient = useQueryClient();
   const { token } = useAuthStore();

   // --- QUERIES (Unchanged) ---
   // 1. Fetch User Profile
   const { data: user, isLoading: isUserLoading } = useQuery({
      queryKey: ['profile'],
      queryFn: fetchProfile,
      enabled: !!token,
   });

   // 2. Fetch Addresses
   const { 
      data: addresses = [], 
      isLoading: isAddressLoading, 
      error: addressError 
   } = useQuery({
      queryKey: ['addresses'],
      queryFn: fetchAddresses,
      enabled: !!token,
   });

   // --- NEW: Mutation for Changing Password ---
   const { mutate: performChangePassword, isPending: isChangingPassword } = useMutation({
      mutationFn: changePassword, // Uses our new api.js function
      onSuccess: () => {
         toast.success("Password changed successfully");
         // Clear fields
         setOldPassword("");
         setNewPassword("");
         setRe_enteredNewPassword("");
         // Clear errors
         setNewPasswordError("");
         setOldPasswordError("");
         setRe_enteredNewPasswordError("");
      },
      onError: (err) => {
         toast.error(err.message || "Failed to change password");
      }
   });

   // --- EVENT HANDLERS ---
   const toggleExpand = (index) => {
      setExpand(prev => prev.map((item, i) => i === index ? !item : item));
   };

   // --- REFACTORED: handleChangePassword ---
   const handleChangePassword = async () => {
      // 1. Clear previous errors
      setNewPasswordError("");
      setOldPasswordError("");
      setRe_enteredNewPasswordError("");

      // 2. Perform local validation (Unchanged)
      let hasError = false;
      if (newPassword !== re_enteredNewPassword) {
         setRe_enteredNewPasswordError("Passwords do not match.");
         hasError = true;
      }
      if (!oldPassword) {
         setOldPasswordError("Input cannot be empty.");
         hasError = true;
      }
      if (!newPassword) {
         setNewPasswordError("Input cannot be empty.");
         hasError = true;
      } else {
         const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
         if (!passwordRegex.test(newPassword)) {
            setNewPasswordError("Password must be at least 6 characters long and contain both letters and numbers");
            hasError = true;
         }
      }

      if (hasError) return;

      // 3. Call the mutation
      performChangePassword({ oldPassword, newPassword });
   };

   // --- HELPER FUNCTIONS (Unchanged) ---
   const getAddressIcon = (type) => { 
      switch (type) {
         case 1: return homePin;
         case 2: return workPin;
         case 3: return hotelPin;
         default: return mapPin;
      }
   };
   const getAddressText = (type) => { 
      switch (type) {
         case 1: return "Home";
         case 2: return "Work";
         case 3: return "Hotel";
         default: return "Other";
      }
   };

   // --- Success handler for AddNewDrawer (Unchanged) ---
   const onAddressAdded = () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddNewDiv(false);
   };

   return (
      <div className={styles.main}>
         <DashboardSideBar />
         <div className={styles.mainRight}>
            
            {/* --- USER DETAILS (Unchanged) --- */}
            <div className={`${styles.rightParent} ${styles.expandRightParent}`}>
               <p className={`${styles.rightTitle} ${styles.titleBorder}`}>Your Details</p>
               <div className={styles.rightInfoCtn}>
                  <p className={styles.rightInfo}><span>Name</span> <span>:</span> <span>{isUserLoading ? 'Loading...' : user?.name}</span></p>
                  <p className={styles.rightInfo}><span>Email</span> <span>:</span> <span>{isUserLoading ? 'Loading...' : user?.email}</span></p>
                  <p className={styles.rightInfo}><span>Phone</span> <span>:</span> <span>{isUserLoading ? 'Loading...' : user?.phone}</span></p>
               </div>
               <p>Happy to serve you over the last 6 months ...</p>
            </div>

            {/* --- CHANGE PASSWORD (Button Updated) --- */}
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
                  
                  {/* --- UPDATED BUTTON --- */}
                  <button onClick={handleChangePassword} className={styles.savePasswordBtn} disabled={isChangingPassword}>
                     {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
               </div>
            </div>

            {/* --- MANAGE ADDRESS (Unchanged) --- */}
            <div className={`${styles.rightParent} ${expand[1] ? styles.expandRightParent : ''}`}>
               <div className={styles.rightChipHeroCtn}>
                  <p className={`${styles.rightTitle} ${expand[1] ? styles.titleBorder : ''}`}>Manage Address</p>
                  <button onClick={() => toggleExpand(1)} className={`${styles.expandBtn} ${expand[1] ? styles.rotateBtn : ''}`}>
                     <Image src={arrow} alt="Expand" />
                  </button>
               </div>
               {showAddNewDiv && (
                  <AddNewDrawer 
                     showAddNewDiv={showAddNewDiv} 
                     setShowAddNewDiv={setShowAddNewDiv}
                     onSuccess={onAddressAdded}
                  />
               )}
               <div className={styles.addCtn}>
                  <button className={styles.addAddBtn} onClick={() => setShowAddNewDiv(true)}> + Add Address</button>
                  <div className={styles.addChipCtn}>
                     {isAddressLoading && <p>Loading addresses...</p>}
                     {addressError && <p className={styles.error}>{addressError.message}</p>}
                     {!isAddressLoading && !addressError && addresses.map((address) => (
                        <div key={address.id} className={styles.chip}>
                           <Image src={getAddressIcon(address.address_type)} className={styles.chipImg} alt="Address type icon" />
                           <div>
                              <p className={styles.chipTitle}>{getAddressText(address.address_type)}</p>
                              <p className={styles.chipBody}>{address.content}</p>
                              <p className={styles.chipCaption}>{address.rec_name}, {address.number}</p>
                           </div>
                        </div>
                     ))}
                     {!isAddressLoading && !addressError && addresses.length === 0 && (
                        <p>No saved addresses found.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}