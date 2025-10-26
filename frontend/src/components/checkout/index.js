'use client';

// --- Imports ---
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Checkout.module.css'; // Make sure this path is correct
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import { Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns'; // Import date-fns for formatting

// --- Zustand & React Query Imports ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore'; // Adjusted path
import { useCartStore } from '../../store/cartStore'; // Adjusted path
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  createBooking
} from '../../lib/api'; // Adjusted path

export default function CheckoutClient() {
  // --- STATE MANAGEMENT & HOOKS ---
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const isLoggedIn = !!token;
  // Get cart state from Zustand store
  const { cartItems, clearCart, removeFromCart, getTotalPrice } = useCartStore();

  // --- LOCAL UI STATE ---
  const [viewMode, setViewMode] = useState('select_address');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', landmark: '', type: 'Home', isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');

  // --- CALCULATED VALUES ---
  const isCartEmpty = cartItems.length === 0; // Use cartItems from Zustand
  const cartTotal = getTotalPrice(); // Use function from Zustand

  // --- DERIVED STATE ---
  // Derive lunch/dinner items from the flat cartItems array
  const { lunchItems, dinnerItems } = useMemo(() => {
     const lunch = cartItems.filter(item => item.mealType?.toLowerCase() === 'lunch');
     const dinner = cartItems.filter(item => item.mealType?.toLowerCase() === 'dinner');
     return { lunchItems: lunch, dinnerItems: dinner };
  }, [cartItems]);

  // --- DATA FETCHING ---
  const {
    data: savedAddresses = [],
    isLoading: isAddressLoading,
    // --- CORRECTED: Added error variable ---
    error: addressesError
    // ------------------------------------
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: isLoggedIn,
    onSuccess: (data) => {
       if (selectedAddressId) return;
       const defaultAddress = data.find(addr => addr.is_default);
       if (defaultAddress) {
         setSelectedAddressId(defaultAddress.id);
       } else if (data && data.length > 0) { // Added check for data existence
         setSelectedAddressId(data[0].id); // Select the first one
       }
    },
    onError: (err) => {
      // toast.error(`Could not load addresses: ${err.message}`); // Error is handled in JSX now
      console.error("Error fetching addresses:", err); // Log error for debugging
    }
  });

  // --- MUTATIONS ---
  const { mutate: saveAddress, isPending: isSavingAddress } = useMutation({
     mutationFn: (addressData) => {
       if (editingAddressId) {
         return updateAddress({ addressId: editingAddressId, ...addressData });
       } else {
         return addAddress(addressData);
       }
     },
     onSuccess: (data) => {
       toast.success(editingAddressId ? "Address updated!" : "Address saved!");
       queryClient.invalidateQueries({ queryKey: ['addresses'] });
       const newAddressId = editingAddressId || data?.id; // Safely access id
       if (newAddressId) setSelectedAddressId(newAddressId);
       handleCancelEdit();
     },
     onError: (err) => {
       toast.error(`Failed to save address: ${err.message}`);
     }
  });

  const { mutate: placeOrder, isPending: isPlacingOrder } = useMutation({
     mutationFn: createBooking,
     onSuccess: async (data) => {
       if (data.payment_session_id) {
         toast.loading("Redirecting to payment...");
         clearCart();
         const cashfree = await load({
           mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
          });
         cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: "_self" });
       } else {
         clearCart();
         toast.success("Order placed successfully!");
         router.push('/order-success');
       }
     },
     onError: (err) => {
       toast.error(`Order failed: ${err.message}`);
     }
  });

  // --- HANDLERS ---
  const handleInputChange = (e) => {
     const { name, value, type, checked } = e.target;
     setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveAddress = async (e) => {
     e.preventDefault();
     if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
         toast.error("Please fill in all required address fields."); return;
     }
     // Use camelCase keys to match backend
     const addressData = {
         type: formData.type,
         fullName: formData.fullName,
         phone: formData.phone,
         addressLine1: formData.addressLine1,
         addressLine2: formData.addressLine2,
         city: formData.city,
         state: formData.state,
         pincode: formData.pincode,
         landmark: formData.landmark,
         isDefault: formData.isDefault
     };
     saveAddress(addressData);
  };

  const handleEditAddress = (address) => {
     setFormData({
       fullName: address.full_name, phone: address.phone, addressLine1: address.address_line_1,
       addressLine2: address.address_line_2 || '', city: address.city, state: address.state,
       pincode: address.pincode, landmark: address.landmark || '', type: address.type, isDefault: address.is_default
     });
     setEditingAddressId(address.id);
     setViewMode('add_new_address');
  };

  const handleCancelEdit = () => {
     setFormData({
       fullName: '', phone: '', addressLine1: '', addressLine2: '',
       city: '', state: '', pincode: '', landmark: '', type: 'Home', isDefault: false
     });
     setEditingAddressId(null);
     setViewMode('select_address');
  };

  const handleProceedToPayment = async () => {
     if (!selectedAddressId) {
       toast.error("Please select or add a delivery address.");
       return;
     }
     // Use nested structure expected by backend
     const bookingData = {
       cart: {
         lunch: lunchItems, // Use derived array
         dinner: dinnerItems // Use derived array
       },
       cartTotal: cartTotal,
       addressId: selectedAddressId,
       paymentMethod: paymentMethod
     };
     placeOrder(bookingData);
  };

  const handleRemoveItem = (itemId) => {
     const itemExists = cartItems.some(item => item.id === itemId);
     if (!itemId || !itemExists) {
         console.warn("Attempted to remove item with invalid ID:", itemId);
         return;
     }
     removeFromCart(itemId); // Use function from Zustand store
     toast.info(`Item removed from cart.`);
  };


  const handleEditItem = (item) => {
     const params = new URLSearchParams();
     params.set('edit', 'true');
     params.set('mealType', item.mealType);
     params.set('productId', item.id);
     if (item.plan) params.set('planId', item.plan.id);
     params.set('quantity', item.quantity);
     if (item.frequency) {
        const freqMap = {'Mon - Fri': 'mon-fri', 'Mon - Sat': 'mon-sat', 'Mon - Sun': 'mon-sun'};
        const customDays = item.frequency.split(', ');
        if (customDays.length > 1 && customDays.every(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(d))) {
            params.set('frequencyId', 'custom');
            customDays.forEach(day => params.set(day.toLowerCase(), 'true'));
        } else {
            params.set('frequencyId', freqMap[item.frequency] || 'mon-fri');
        }
     }
     if (item.startDate) params.set('startDate', item.startDate);
     router.push(`/subscribe?${params.toString()}`);
  };

  // --- Derived State ---
  const canProceedToPayment = useMemo(() =>
    selectedAddressId && !isPlacingOrder && !isCartEmpty && !isAddressLoading,
    [selectedAddressId, isPlacingOrder, isCartEmpty, isAddressLoading]
  );

  // --- RENDER ---

  // Empty Cart Message
  if (isCartEmpty && !isAddressLoading) {
    return (
      <div className={styles.pageContainer}>
        <h2 style={{ textAlign: 'center', margin: '4rem 0' }}>Your cart is empty.</h2>
        <Link href="/subscribe" className={styles.backLink} style={{ justifyContent: 'center' }}>
            ← Build a Subscription
        </Link>
      </div>
    );
  }

  // --- Main Render Logic ---
  return (
    <div className={styles.pageContainer}>
      <Link href="/subscribe" className={styles.backLink}>
        ← Back to Subscription Builder
      </Link>
      <h1 className={styles.pageTitle}>Checkout</h1>

      <div className={styles.layoutGrid}>
        {/* --- Left Column: Address & Payment --- */}
        <div className={styles.formColumn}>

          {/* Delivery Address Box */}
          <div className={styles.formBox}>
            <h2>Delivery Address</h2>
            {viewMode === 'select_address' ? (
              <>
                {/* Address List */}
                <div className={styles.addressList}>
                   {isAddressLoading && <p>Loading addresses...</p>}
                   {/* --- CORRECTED: Use addressesError variable --- */}
                   {!isAddressLoading && addressesError && <p style={{color: 'red'}}>Error loading addresses: {addressesError.message}</p>}
                   {/* ------------------------------------------- */}
                   {!isAddressLoading && !addressesError && savedAddresses.length === 0 && (
                     <p>You have no saved addresses. Please add one.</p>
                   )}
                   {!isAddressLoading && !addressesError && savedAddresses.map(addr => (
                     <div
                       key={addr.id}
                       className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.active : ''}`}
                       onClick={() => setSelectedAddressId(addr.id)}
                     >
                       <div className={styles.addressCardHeader}>
                         <span className={styles.addressType}>{addr.type}</span>
                         <button type="button" className={styles.editAddressButton} onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}>Edit</button>
                       </div>
                       <p>
                         <strong>{addr.full_name}</strong> - {addr.phone}<br/>
                         {addr.address_line_1}, {addr.address_line_2 ? `${addr.address_line_2},` : ''}<br/>
                         {addr.city}, {addr.state} - {addr.pincode}
                       </p>
                     </div>
                   ))}
                </div>
                <button className={styles.addNewButton} onClick={() => setViewMode('add_new_address')}>
                  + Add a New Address
                </button>
              </>
            ) : (
              // Address Add/Edit Form
              <form onSubmit={handleSaveAddress}>
                 <div className={styles.formGroup}>
                   <label htmlFor="type">Address Type</label>
                   <select id="type" name="type" value={formData.type} onChange={handleInputChange} className={styles.inputField}>
                     <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
                   </select>
                 </div>
                 <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">Full Name *</label>
                    <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} className={styles.inputField} placeholder="Enter your full name" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number *</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className={styles.inputField} placeholder="10-digit mobile number" required maxLength={10} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="addressLine1">Address Line 1 *</label>
                  <input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className={styles.inputField} placeholder="House No., Building Name" required />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="addressLine2">Address Line 2</label>
                    <input type="text" id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className={styles.inputField} placeholder="Road Name, Area, Colony" />
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="city">City *</label>
                      <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} className={styles.inputField} placeholder="Enter city" required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="state">State *</label>
                      <input type="text" id="state" name="state" value={formData.state} onChange={handleInputChange} className={styles.inputField} placeholder="Enter state" required />
                    </div>
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="pincode">Pincode *</label>
                      <input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} className={styles.inputField} placeholder="6-digit pincode" required maxLength={6}/>
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="landmark">Landmark</label>
                      <input type="text" id="landmark" name="landmark" value={formData.landmark} onChange={handleInputChange} className={styles.inputField} placeholder="Nearby landmark" />
                    </div>
                </div>
                <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} style={{ width: 'auto' }} />
                    <label htmlFor="isDefault" style={{ marginBottom: 0 }}>Set as default address</label>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.backButton} onClick={handleCancelEdit}>
                    ← Back to Selection
                  </button>
                  <button type="submit" className={styles.confirmButton} disabled={isSavingAddress}>
                    {isSavingAddress ? 'Saving...' : 'Save and Use Address'}
                  </button>
                </div>
              </form>
            )}
          </div> {/* End Address Box */}

          {/* Payment Method Box */}
          <div className={styles.formBox}>
            <h2>Payment Method</h2>
            <div className={styles.paymentOptionsList}>
               <label className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.active : ''}`}>
                 <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                 <div className={styles.paymentDetails}>
                   <span className={styles.paymentTitle}>Online Payment</span>
                   <span className={styles.paymentDesc}>Pay securely using UPI, Cards, or Net Banking</span>
                 </div>
               </label>
               <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.active : ''}`}>
                 <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                 <div className={styles.paymentDetails}>
                   <span className={styles.paymentTitle}>Cash on Delivery</span>
                   <span className={styles.paymentDesc}>Pay when you receive your first meal</span>
                 </div>
               </label>
            </div>
          </div> {/* End Payment Box */}

        </div> {/* End Left Column */}

        {/* --- Right Column: FINAL CORRECTED Order Summary for MULTIPLE ITEMS --- */}
        <div className={styles.summaryColumn}>
          <div className={styles.summaryBox}>
            {/* Summary Header */}
            <div className={styles.summaryHeader}>
              <h2>Order Summary</h2>
              {/* No global edit button */}
            </div>

            {/* --- Loop through LUNCH items --- */}
            {lunchItems.map((item, index) => (
              // Make sure item has a unique ID, fallback to index if needed
              <div key={`lunch-${item.id || index}`} className={styles.summaryItem}>
                <div className={styles.summaryItemHeader}>
                  <span className={styles.summaryMealTypeLabel}>LUNCH</span>
                  {/* Item-specific actions */}
                  <div className={styles.itemActions}>
                    <button onClick={() => handleEditItem(item)} className={styles.editItemButton} aria-label="Edit lunch item" disabled={isPlacingOrder}><Pencil size={16} /> Edit</button>
                    {/* --- Remove button is included --- */}
                    <button onClick={() => handleRemoveItem(item.id)} className={styles.removeItemButton} aria-label="Remove lunch item" disabled={isPlacingOrder}><Trash2 size={16} /> Remove</button>
                  </div>
                </div>
                {/* Item Details Grid */}
                <div className={styles.summaryGrid}>
                    <span className={styles.summaryLabel}>Selected Meal:</span><span className={styles.summaryValue}>{item.name || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Quantity/Day:</span><span className={styles.summaryValue}>{item.quantity || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Subscription:</span><span className={styles.summaryValue}>{item.plan?.plan_name || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Delivery Days:</span><span className={styles.summaryValue}>{item.frequency || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Start Date:</span><span className={styles.summaryValue}>{item.startDate ? format(new Date(item.startDate + 'T00:00:00Z'), 'do MMMM, yyyy') : 'N/A'}</span>
                    <span className={styles.summaryLabel}>Total Meals:</span><span className={styles.summaryValue}>{item.totalMeals || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Price:</span><span className={styles.summaryValue}>₹{(item.totalPrice || item.price || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}

            {/* Divider if both lunch and dinner exist */}
            {lunchItems.length > 0 && dinnerItems.length > 0 && <div className={styles.summaryDivider}></div>}

            {/* --- Loop through DINNER items --- */}
            {dinnerItems.map((item, index) => (
              // Make sure item has a unique ID, fallback to index if needed
              <div key={`dinner-${item.id || index}`} className={styles.summaryItem}>
                 <div className={styles.summaryItemHeader}>
                  <span className={styles.summaryMealTypeLabel}>DINNER</span>
                   {/* Item-specific actions */}
                   <div className={styles.itemActions}>
                    <button onClick={() => handleEditItem(item)} className={styles.editItemButton} aria-label="Edit dinner item" disabled={isPlacingOrder}><Pencil size={16} /> Edit</button>
                    {/* --- Remove button is included --- */}
                    <button onClick={() => handleRemoveItem(item.id)} className={styles.removeItemButton} aria-label="Remove dinner item" disabled={isPlacingOrder}><Trash2 size={16} /> Remove</button>
                  </div>
                </div>
                {/* Item Details Grid */}
                <div className={styles.summaryGrid}>
                    <span className={styles.summaryLabel}>Selected Meal:</span><span className={styles.summaryValue}>{item.name || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Quantity/Day:</span><span className={styles.summaryValue}>{item.quantity || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Subscription:</span><span className={styles.summaryValue}>{item.plan?.plan_name || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Delivery Days:</span><span className={styles.summaryValue}>{item.frequency || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Start Date:</span><span className={styles.summaryValue}>{item.startDate ? format(new Date(item.startDate + 'T00:00:00Z'), 'do MMMM, yyyy') : 'N/A'}</span>
                    <span className={styles.summaryLabel}>Total Meals:</span><span className={styles.summaryValue}>{item.totalMeals || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Price:</span><span className={styles.summaryValue}>₹{(item.totalPrice || item.price || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}

            {/* Total Amount Row */}
            <div className={styles.totalAmountRow}>
              <span className={styles.summaryTotalLabel}>Total Amount:</span>
              <span className={styles.summaryTotalPrice}>₹{(cartTotal || 0).toLocaleString('en-IN')}/-</span>
            </div>

            {/* Payment Button */}
            <button
              className={styles.paymentButton}
              disabled={!canProceedToPayment} // Use derived state for clarity
              onClick={handleProceedToPayment}
            >
              {isPlacingOrder ? 'Processing...' : (
                paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Payment'
              )}
            </button>
            <p className={styles.terms}>By placing this order, you agree to our Terms & Conditions</p>
          </div> {/* End Summary Box */}
        </div> {/* End Right Column */}

      </div> {/* End Layout Grid */}
    </div> // End Page Container
  );
}