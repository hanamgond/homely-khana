'use client';

import { useState, useEffect } from 'react';
import { fetchWithToken } from "@/utils/CookieManagement";
import { toast } from "sonner";
import { X, Home, Briefcase, MapPin } from 'lucide-react';
import GoogleAddressInput from '@/components/checkout/GoogleAddressInput';
import styles from './AddressFormDrawer.module.css';

export default function AddressFormDrawer({ isOpen, onClose, editData, onSuccess, user }) {
  const [formData, setFormData] = useState({
    fullName: '', 
    phone: '', 
    addressLine1: '', 
    addressLine2: '',
    city: '', 
    state: '', 
    pincode: '', 
    landmark: '', 
    type: 'home', 
    isDefault: false,
    lat: null, 
    lng: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderingForSelf, setIsOrderingForSelf] = useState(true);

  const addressTypes = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'work', label: 'Work', icon: <Briefcase size={18} /> },
    { id: 'other', label: 'Other', icon: <MapPin size={18} /> }
  ];

  useEffect(() => {
    if (editData) {
      setFormData({
        fullName: editData.full_name || '',
        phone: editData.phone || '',
        addressLine1: editData.address_line_1 || '',
        addressLine2: editData.address_line_2 || '',
        city: editData.city || '',
        state: editData.state || '',
        pincode: editData.pincode || '',
        landmark: editData.landmark || '',
        type: editData.type || 'home',
        isDefault: editData.is_default || false,
        lat: editData.latitude || null,
        lng: editData.longitude || null
      });
      setIsOrderingForSelf(false);
    } else {
      resetForm();
    }
  }, [editData, user]);

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      type: 'home',
      isDefault: false,
      lat: null,
      lng: null
    });
    setIsOrderingForSelf(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleGoogleAddressSelect = (geoData) => {
    setFormData(prev => ({
      ...prev,
      addressLine2: geoData.addressLine1,
      city: geoData.city,
      state: geoData.state,
      pincode: geoData.pincode,
      lat: geoData.lat,
      lng: geoData.lng
    }));
    toast.success("Address details fetched! Please add your Flat/Floor number.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    // Construct final payload
    const finalPayload = {
      ...formData,
      fullName: isOrderingForSelf ? (user?.name || "Self") : formData.fullName,
      phone: isOrderingForSelf 
        ? (user?.phone?.replace(/\D/g, '').slice(-10) || "") 
        : formData.phone
    };

    setIsLoading(true);
    try {
      const body = JSON.stringify(finalPayload);
      const url = editData
        ? `${process.env.NEXT_PUBLIC_URL}/api/address/edit/${editData.id}`
        : `${process.env.NEXT_PUBLIC_URL}/api/address/add`;
      
      const method = editData ? 'PUT' : 'POST';

      const response = await fetchWithToken(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body 
      });
      
      const data = await response.json();

      if (data.success) {
        onSuccess();
        resetForm();
      } else {
        toast.error(data.error || "Failed to save address.");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error("An error occurred while saving the address.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editData ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.typeSelector}>
            {addressTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.typeBtn} ${formData.type === t.id ? styles.activeType : ''}`}
                onClick={() => setFormData({ ...formData, type: t.id })}
              >
                {t.icon} <span>{t.label}</span>
              </button>
            ))}
          </div>

          <GoogleAddressInput onAddressSelect={handleGoogleAddressSelect} />

          <div className={styles.sectionHeader}>
            Delivery Details
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.selfToggle}>
              <input 
                type="checkbox" 
                id="forSelf" 
                checked={isOrderingForSelf} 
                onChange={(e) => setIsOrderingForSelf(e.target.checked)} 
              />
              <label htmlFor="forSelf">Use my profile information</label>
            </div>

            {!isOrderingForSelf && (
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Receiver&apos;s Name *</label>
                  <input 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Full name"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Receiver&apos;s Phone *</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    required 
                    maxLength="10"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            )}

            <div className={styles.formGrid}>
              <div className={styles.inputGroupFull}>
                <label>Flat / Building / Floor *</label>
                <input 
                  name="addressLine1" 
                  value={formData.addressLine1} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. Flat 401, A-Wing"
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Street / Area (From Google)</label>
                <input 
                  name="addressLine2" 
                  value={formData.addressLine2} 
                  onChange={handleInputChange} 
                  placeholder="Street and area name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>City *</label>
                <input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="City"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Pincode *</label>
                <input 
                  name="pincode" 
                  value={formData.pincode} 
                  onChange={handleInputChange} 
                  required 
                  maxLength="6"
                  placeholder="6-digit pincode"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>State *</label>
                <input 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="State"
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Landmark (Optional)</label>
                <input 
                  name="landmark" 
                  value={formData.landmark} 
                  onChange={handleInputChange} 
                  placeholder="Nearby landmark for easy location"
                />
              </div>
            </div>
            
            <div className={styles.checkboxRow}>
              <input 
                type="checkbox" 
                id="def" 
                name="isDefault" 
                checked={formData.isDefault} 
                onChange={handleInputChange} 
              />
              <label htmlFor="def">Set as default address</label>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.saveBtn} 
                disabled={isLoading}
              >
                {isLoading 
                  ? 'Saving...' 
                  : editData 
                    ? 'Update Address' 
                    : 'Save Address'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}