'use client';

import { useState, useContext, useEffect } from 'react';
import { toast } from "sonner";
import { AppContext } from "@/utils/AppContext";
import { fetchWithToken } from "@/utils/CookieManagement";
import { 
  User, Mail, Phone, Lock, MapPin, Home, 
  Briefcase, Eye, EyeOff, ChevronDown, ChevronUp, 
  Plus, Edit, Trash2, Download, AlertTriangle,
  Bell, Package, Truck, Tag, Shield, LogOut,
  CreditCard, Banknote, Pencil
} from 'lucide-react';
import styles from './DashboardProfile.module.css';
import AddressFormDrawer from '@/components/AddressFormDrawer';

export default function ProfileClient() {
   const { user, logout } = useContext(AppContext);
   const [addresses, setAddresses] = useState([]);
   const [showAddressDrawer, setShowAddressDrawer] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [editAddressData, setEditAddressData] = useState(null);
   const [loading, setLoading] = useState(false);
   
   // Toggle State: 'address', or null (closed)
   const [activeSection, setActiveSection] = useState('address'); 

   // Notification preferences
   const [notifications, setNotifications] = useState({
     mealReminders: true,
     subscriptionUpdates: true,
     promotionalOffers: true,
     newsletter: false
   });

   // Function to fetch addresses - Matching checkout.js structure
   const fetchAddresses = async () => {
      if (!user) return; // Prevent call if logged out
      setLoading(true);
      try {
        const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/addresses/all`);
        if (!response.ok) throw new Error("Failed to fetch addresses");
        
        const res = await response.json();
        if (res.success) {
          // Use the same structure as checkout.js - no need to remap
          setAddresses(res.data);
        } else {
          throw new Error(res.error || "Failed to fetch addresses");
        }
      } catch (err) { 
        console.error("Address Fetch Error:", err);
        toast.error("Could not load addresses from server");
        // Fallback to demo addresses only in development
        if (process.env.NODE_ENV === 'development') {
          setAddresses([
            {
              id: 1,
              type: 'home',
              full_name: 'John Doe',
              phone: '+91 9876543210',
              address_line_1: '123 Main Street',
              address_line_2: 'A-Wing, 4th Floor',
              city: 'Mumbai',
              pincode: '400001',
              state: 'Maharashtra',
              landmark: 'Near ABC Mall',
              is_default: true,
              latitude: null,
              longitude: null
            },
            {
              id: 2,
              type: 'work',
              full_name: 'John Doe',
              phone: '+91 9876543211',
              address_line_1: 'Business Bay',
              address_line_2: 'Office No. 501',
              city: 'Navi Mumbai',
              pincode: '400703',
              state: 'Maharashtra',
              landmark: 'Near CBD Station',
              is_default: false,
              latitude: null,
              longitude: null
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

   const toggleSection = (section) => {
      setActiveSection(activeSection === section ? null : section);
   };

   const handleEditProfile = () => {
     toast.info("Edit profile feature coming soon!");
     // In production: Open edit modal or navigate to edit page
   };

   const handleEditAddress = (address) => {
     setEditAddressData(address);
     setShowAddressDrawer(true);
   };

   const handleAddNewAddress = () => {
     setEditAddressData(null);
     setShowAddressDrawer(true);
   };

   const handleSetDefaultAddress = async (addressId) => {
     try {
       const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/addresses/set-default`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ addressId })
       });
       
       if (response.ok) {
         setAddresses(addresses.map(addr => ({
           ...addr,
           is_default: addr.id === addressId
         })));
         toast.success("Default address updated");
       } else {
         const errorData = await response.json();
         toast.error(errorData.error || "Failed to update default address");
       }
     } catch (error) {
       console.error("Set default address error:", error);
       toast.error("Failed to update default address");
     }
   };

   // DELETE ADDRESS FUNCTION - matches your API spec
   const handleDeleteAddress = async (addressId) => {
     if (!confirm("Are you sure you want to delete this address?")) return;
     
     try {
       const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/address/${addressId}`, {
         method: 'DELETE'
       });
       
       const data = await response.json();
       
       if (response.ok) {
         setAddresses(prev => prev.filter(addr => addr.id !== addressId));
         toast.success("Address deleted successfully");
       } else {
         if (response.status === 400 && data.error?.includes("linked to past bookings")) {
           toast.error("Cannot delete address linked to past bookings.");
         } else if (response.status === 404) {
           toast.error("Address not found or you don't have permission to delete it.");
         } else {
           toast.error(data.error || "Delete failed");
         }
       }
     } catch (error) {
       console.error("Delete address error:", error);
       toast.error("Network error during deletion");
     }
   };

   const handleNotificationToggle = (key) => {
     setNotifications(prev => ({
       ...prev,
       [key]: !prev[key]
     }));
   };

   const handleDownloadData = async () => {
     toast.info("Preparing your data for download...");
   };

   const handleDeleteAccount = () => {
     setShowDeleteModal(true);
   };

   const confirmDeleteAccount = async () => {
     try {
       await new Promise(resolve => setTimeout(resolve, 1000));
       logout();
       toast.success("Account deleted successfully");
       window.location.href = '/';
     } catch (error) {
       toast.error("Failed to delete account");
     } finally {
       setShowDeleteModal(false);
     }
   };

   // Get address icon based on type
   const getAddressIcon = (type) => {
     switch (type) {
       case 'home': 
         return <Home size={18} />;
       case 'work': 
         return <Briefcase size={18} />;
       default: 
         return <MapPin size={18} />;
     }
   };

   // Get address type name
   const getAddressTypeName = (type) => {
     switch (type) {
       case 'home': return "Home";
       case 'work': return "Work";
       default: return "Other";
     }
   };

   return (
     <div className={styles.container}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
            <h2 className={styles.headerTitle}>Profile Settings</h2>
            <p className={styles.headerSubtitle}>Manage your account details and preferences</p>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoColumnLayout}>
          {/* Left Column: Personal Info & Notifications */}
          <div>
            {/* Personal Information Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                        <User size={20} color="#2c1810" />
                        Personal Information
                    </h3>
                    <button className={styles.editButton} onClick={handleEditProfile}>
                        Edit
                    </button>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <div className={styles.iconBox}>
                                <User size={20} color="#2c1810" />
                            </div>
                            <div>
                                <span className={styles.infoLabel}>Full Name</span>
                                <p className={styles.infoValue}>{user?.name || 'Guest User'}</p>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.iconBox}>
                                <Mail size={20} color="#2c1810" />
                            </div>
                            <div>
                                <span className={styles.infoLabel}>Email Address</span>
                                <p className={styles.infoValue}>{user?.email || 'user@example.com'}</p>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.iconBox}>
                                <Phone size={20} color="#2c1810" />
                            </div>
                            <div>
                                <span className={styles.infoLabel}>Phone Number</span>
                                <p className={styles.infoValue}>{user?.phone || '+91 9876543210'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                        <Bell size={20} color="#555"/>
                        Notification Preferences
                    </h3>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.notificationGrid}>
                        <div className={styles.notificationItem}>
                            <div className={styles.notificationLabel}>
                                <Package size={16} style={{ marginRight: '0.5rem' }} />
                                Meal Reminders
                            </div>
                            <label className={styles.toggleSwitch}>
                                <input 
                                  type="checkbox" 
                                  checked={notifications.mealReminders}
                                  onChange={() => handleNotificationToggle('mealReminders')}
                                  className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>
                        <div className={styles.notificationItem}>
                            <div className={styles.notificationLabel}>
                                <Truck size={16} style={{ marginRight: '0.5rem' }} />
                                Subscription Updates
                            </div>
                            <label className={styles.toggleSwitch}>
                                <input 
                                  type="checkbox" 
                                  checked={notifications.subscriptionUpdates}
                                  onChange={() => handleNotificationToggle('subscriptionUpdates')}
                                  className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>
                        <div className={styles.notificationItem}>
                            <div className={styles.notificationLabel}>
                                <Tag size={16} style={{ marginRight: '0.5rem' }} />
                                Promotional Offers
                            </div>
                            <label className={styles.toggleSwitch}>
                                <input 
                                  type="checkbox" 
                                  checked={notifications.promotionalOffers}
                                  onChange={() => handleNotificationToggle('promotionalOffers')}
                                  className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>
                        <div className={styles.notificationItem}>
                            <div className={styles.notificationLabel}>
                                <Bell size={16} style={{ marginRight: '0.5rem' }} />
                                Newsletter
                            </div>
                            <label className={styles.toggleSwitch}>
                                <input 
                                  type="checkbox" 
                                  checked={notifications.newsletter}
                                  onChange={() => handleNotificationToggle('newsletter')}
                                  className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Address Book & Account Actions */}
          <div>
            {/* Address Book Card */}
            <div className={styles.card}>
                <div className={styles.cardHeaderClickable} onClick={() => toggleSection('address')}>
                    <div>
                        <h3 className={styles.cardTitle}>
                            <MapPin size={20} color="#2c1810"/>
                            Saved Addresses
                            <span className={styles.addressCount}>{addresses.length}</span>
                        </h3>
                    </div>
                    {activeSection === 'address' ? <ChevronUp size={20} color="#777" /> : <ChevronDown size={20} color="#777" />}
                </div>

                {activeSection === 'address' && (
                    <div className={styles.cardBody}>
                        <button className={styles.addBtn} onClick={handleAddNewAddress}>
                            <Plus size={18} /> Add New Address
                        </button>
                        
                        {loading ? (
                            <div className={styles.emptyState}>
                                <div className={styles.spinner}></div>
                                <p>Loading addresses...</p>
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className={styles.emptyState}>
                                <MapPin size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No addresses saved yet.</p>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                    Add your first address to get started!
                                </p>
                            </div>
                        ) : (
                            <div className={styles.addressList}>
                                {addresses.map((addr) => (
                                    <div key={addr.id} className={styles.addressItem}>
                                        <div className={styles.addressIcon}>
                                            {getAddressIcon(addr.type)}
                                        </div>
                                        <div className={styles.addressContent}>
                                            <div className={styles.addressType}>
                                                {getAddressTypeName(addr.type)}
                                                {addr.is_default && (
                                                    <span className={styles.defaultBadge}>DEFAULT</span>
                                                )}
                                            </div>
                                            <p className={styles.addressText}>
                                                {addr.address_line_1}, {addr.address_line_2 && `${addr.address_line_2}, `}
                                                {addr.city} - <strong>{addr.pincode}</strong>
                                                {addr.landmark && <><br/><small>Landmark: {addr.landmark}</small></>}
                                            </p>
                                            <div className={styles.addressContact}>
                                                <span>{addr.full_name || 'Recipient'}</span> • 
                                                <span>{addr.phone || 'Phone not provided'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.addressActions}>
                                            {!addr.is_default && (
                                                <button 
                                                  className={styles.actionIcon}
                                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                                  title="Set as default"
                                                >
                                                    <MapPin size={16} />
                                                </button>
                                            )}
                                            <button 
                                              className={styles.actionIcon}
                                              onClick={() => handleEditAddress(addr)}
                                              title="Edit address"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                              className={styles.actionIcon}
                                              onClick={() => handleDeleteAddress(addr.id)}
                                              title="Delete address"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Account Actions Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                        <Shield size={20} color="#555"/>
                        Account Actions
                    </h3>
                </div>
                <div className={styles.cardBody}>
                    <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        Manage your account data and preferences
                    </p>
                    
                    <div className={styles.accountActions}>
                        <button className={styles.downloadBtn} onClick={handleDownloadData}>
                            <Download size={18} />
                            Download My Data
                        </button>
                        <button className={styles.deleteBtn} onClick={handleDeleteAccount}>
                            <AlertTriangle size={18} />
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Address Form Drawer */}
        {showAddressDrawer && (
          <AddressFormDrawer
            isOpen={showAddressDrawer}
            onClose={() => {
              setShowAddressDrawer(false);
              setEditAddressData(null);
            }}
            editData={editAddressData}
            onSuccess={() => {
              fetchAddresses();
              setShowAddressDrawer(false);
              setEditAddressData(null);
              toast.success(editAddressData ? "Address updated!" : "Address saved!");
            }}
            user={user}
          />
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <button 
                      className={styles.modalClose}
                      onClick={() => setShowDeleteModal(false)}
                    >
                      ×
                    </button>
                    
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>Delete Account</h3>
                        <p style={{ color: '#666', fontSize: '0.95rem' }}>
                            Are you sure you want to delete your account? This action cannot be undone.
                            All your data, including subscriptions and order history, will be permanently deleted.
                        </p>
                    </div>
                    
                    <div className={styles.modalActions}>
                        <button 
                          className={styles.cancelBtn}
                          onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </button>
                        <button 
                          className={styles.confirmBtn}
                          onClick={confirmDeleteAccount}
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        )}
     </div>
   );
}