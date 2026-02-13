//frtonend/src/modules/dashboard/components/profile/index.js
'use client';

import { useState, useContext, useEffect } from 'react';
import { toast } from "sonner";
import { AppContext } from "@/shared/lib/AppContext";
import { 
  User, Mail, Phone, Lock, MapPin, Home, 
  Briefcase, ChevronDown, ChevronUp, 
  Plus, Edit, Trash2, Download, AlertTriangle,
  Bell, Package, Truck, Tag, Shield
} from 'lucide-react';
import styles from './Profile.module.css';
import AddressFormDrawer from '@/shared/components/AddressFormDrawer';
import { dashboardAPI } from '@/shared/lib/api';

export default function ProfileClient() {
   const { user, logout } = useContext(AppContext);
   const [addresses, setAddresses] = useState([]);
   const [showAddressDrawer, setShowAddressDrawer] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [editAddressData, setEditAddressData] = useState(null);
   const [loading, setLoading] = useState(false);
   
   const [activeSection, setActiveSection] = useState('address');
   const [notifications, setNotifications] = useState({
     mealReminders: true,
     subscriptionUpdates: true,
     promotionalOffers: true,
     newsletter: false
   });

   const fetchAddresses = useCallback(async () => {
  if (!user) return;
  setLoading(true);
  try {
    const data = await dashboardAPI.getAddresses();
    setAddresses(data.data);
  } catch (err) { 
    console.error("Address Fetch Error:", err);
    toast.error("Could not load addresses from server");
  } finally {
    setLoading(false);
  }
}, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

   const toggleSection = (section) => {
      setActiveSection(activeSection === section ? null : section);
   };

   const handleEditProfile = () => {
     toast.info("Edit profile feature coming soon!");
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
       const data = await dashboardAPI.setDefaultAddress(addressId);
       setAddresses(addresses.map(addr => ({
         ...addr,
         is_default: addr.id === addressId
       })));
       toast.success("Default address updated");
     } catch (error) {
       console.error("Set default address error:", error);
       toast.error(error.message || "Failed to update default address");
     }
   };

   const handleDeleteAddress = async (addressId) => {
     if (!confirm("Are you sure you want to delete this address?")) return;
     
     try {
       const data = await dashboardAPI.deleteAddress(addressId);
       setAddresses(prev => prev.filter(addr => addr.id !== addressId));
       toast.success("Address deleted successfully");
     } catch (error) {
       console.error("Delete address error:", error);
       toast.error(error.message || "Delete failed");
     }
   };

   const handleNotificationToggle = (key) => {
     setNotifications(prev => ({
       ...prev,
       [key]: !prev[key]
     }));
   };

   const handleDownloadData = async () => {
     toast.info("Data download feature coming soon!");
   };

   const handleDeleteAccount = () => {
     setShowDeleteModal(true);
   };

   const confirmDeleteAccount = async () => {
     try {
       // TODO: Implement actual delete account API
       toast.info("Account deletion feature coming soon!");
     } catch (error) {
       toast.error("Failed to delete account");
     } finally {
       setShowDeleteModal(false);
     }
   };

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
                                <p className={styles.infoValue}>{user?.email || 'No email'}</p>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.iconBox}>
                                <Phone size={20} color="#2c1810" />
                            </div>
                            <div>
                                <span className={styles.infoLabel}>Phone Number</span>
                                <p className={styles.infoValue}>{user?.phone || 'No phone'}</p>
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