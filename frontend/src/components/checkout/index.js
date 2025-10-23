'use client';

// --- Imports ---
import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import styles from './Checkout.module.css';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import { fetchWithToken, getCookie } from '@/utils/CookieManagement';
import { Trash2, Pencil } from 'lucide-react'; // Icons for action buttons

export default function CheckoutClient() {
  // --- Deconstruct context ---
  const {
    cart,
    cartTotal,
    setDeliveryAddress,
    clearCart, // Function to clear the cart
    removeSubscription // Function to remove an item
  } = useContext(AppContext);
  const router = useRouter();

  // --- State Variables ---
  const [viewMode, setViewMode] = useState('select_address'); // 'select_address' or 'add_new_address'
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({ // State for the address form
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', landmark: '', type: 'Home', isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null); // ID of address being edited
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [isLoading, setIsLoading] = useState(false); // For disabling buttons during API calls

  // --- Calculated Values ---
  const isCartEmpty = !cart || (cart.lunch.length === 0 && cart.dinner.length === 0);

  // --- Data Fetching & Handlers ---

  // Fetches saved addresses for the logged-in user
  const fetchAddresses = async () => {
    setIsAddressLoading(true);
    try {
      const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/addresses/all`);
      const data = await response.json();
      if (data.success) {
        setSavedAddresses(data.data);
        const defaultAddress = data.data.find(addr => addr.is_default);
        // Pre-select default address or the first one
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (data.data.length > 0) {
          setSelectedAddressId(data.data[0].id);
        }
      } else {
        toast.error("Could not load your saved addresses.");
      }
    } catch (err) {
      console.error("Fetch Address Error:", err);
      toast.error("Failed to connect to address server.");
    } finally {
      setIsAddressLoading(false);
    }
  };

  // Fetch addresses on component mount if user is logged in
  useEffect(() => {
    const token = getCookie(); // Check if login cookie exists
    if (token) {
      fetchAddresses();
    } else {
      setIsAddressLoading(false); // No addresses to load if not logged in
      // Optional: Redirect to login if checkout requires it
      // router.push('/login');
    }
  }, []); // Run only once on mount

  // Handles input changes for the address form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Handles saving a new address or updating an existing one via API
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
        toast.error("Please fill in all required address fields."); return;
    }
    setIsLoading(true); // Disable buttons
    try {
      // Prepare data and API endpoint based on adding or editing
      const body = JSON.stringify({
        type: formData.type, fullName: formData.fullName, phone: formData.phone,
        addressLine1: formData.addressLine1, addressLine2: formData.addressLine2,
        city: formData.city, state: formData.state, pincode: formData.pincode,
        landmark: formData.landmark, isDefault: formData.isDefault
      });
      const url = editingAddressId
        ? `${process.env.NEXT_PUBLIC_URL}/api/addresses/edit/${editingAddressId}`
        : `${process.env.NEXT_PUBLIC_URL}/api/addresses/add`;
      const method = editingAddressId ? 'PUT' : 'POST';

      // Make the API call
      const response = await fetchWithToken(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      if (!response.ok) { // Check for network errors first
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }
      const data = await response.json(); // Parse the JSON response

      // Handle success or failure based on API response
      if (data.success) {
        toast.success(editingAddressId ? "Address updated!" : "Address saved!");
        handleCancelEdit(); // Close form, reset state
        await fetchAddresses(); // Refresh the list of addresses
        // Automatically select the newly added/updated address
        if (!editingAddressId && data.data.id) {
            setSelectedAddressId(data.data.id);
        } else if (editingAddressId) {
            setSelectedAddressId(editingAddressId); // Keep the edited one selected
        }
      } else {
        toast.error(data.error || "Failed to save address.");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error(err.message || "An error occurred while saving the address.");
    } finally {
      setIsLoading(false); // Re-enable buttons
    }
  };

  // Pre-fills the form when the 'Edit' button on an address card is clicked
  const handleEditAddress = (address) => {
    setFormData({
      fullName: address.full_name, phone: address.phone, addressLine1: address.address_line_1,
      addressLine2: address.address_line_2 || '', city: address.city, state: address.state,
      pincode: address.pincode, landmark: address.landmark || '', type: address.type, isDefault: address.is_default
    });
    setEditingAddressId(address.id); // Set the ID of the address being edited
    setViewMode('add_new_address'); // Switch to the form view
  };

  // Resets the form and switches back to the address selection view
  const handleCancelEdit = () => {
    setFormData({ // Clear form fields
      fullName: '', phone: '', addressLine1: '', addressLine2: '',
      city: '', state: '', pincode: '', landmark: '', type: 'Home', isDefault: false
    });
    setEditingAddressId(null); // Clear editing ID
    setViewMode('select_address'); // Go back to address list
  };

  // Handles the main "Place Order" or "Proceed to Payment" action
  const handleProceedToPayment = async () => {
    // Validate that an address is selected
    if (!selectedAddressId) { toast.error("Please select or add a delivery address."); return; }
    const finalAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
    if (!finalAddress) { toast.error("Selected address not found. Please try again."); return; }
    // Update context if needed (might not be necessary if backend only uses ID)
    if(setDeliveryAddress) setDeliveryAddress(finalAddress);

    setIsLoading(true); // Disable buttons

    try {
      // Call the backend endpoint to create the booking
      const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/bookings/create`, {
        method: "POST", headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, cartTotal, addressId: selectedAddressId, paymentMethod }),
      });
      // Handle API errors
      if (!response.ok) { const errorText = await response.text(); throw new Error(`Booking creation failed: ${errorText}`); }
      const data = await response.json();
      if (!data.success) { throw new Error(data.error || "Failed to create booking."); }

      // --- Success: Clear cart and redirect based on payment method ---
      if (data.payment_session_id) {
        // ONLINE PAYMENT: Redirect to Cashfree
        const cashfree = await load({ mode: "sandbox" }); // Use "production" in live mode
        clearCart(); // Clear the cart state and localStorage
        cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: "_self" });
        // No need to set isLoading(false) because the page redirects
      } else {
        // COD (Cash On Delivery): Redirect to success page
        toast.success("Order placed successfully!");
        clearCart(); // Clear the cart state and localStorage
        router.push('/order-success');
        // No need to set isLoading(false) because the page redirects
      }
    } catch (error) {
      // Handle errors during the process
      console.error("Payment Error:", error);
      toast.error(error.message || "An error occurred while placing the order.");
      setIsLoading(false); // Re-enable buttons only on error
    }
  };

  // --- NEW: Handles removing an item from the cart summary ---
  const handleRemoveItem = (mealType, subs_id) => {
      if (!mealType || !subs_id) return; // Basic check
      // Call the remove function from AppContext
      removeSubscription(mealType, subs_id);
      toast.info(`${mealType} item removed from cart.`);
  };

  // --- NEW: Handles editing an item - navigates back to subscribe page ---
  const handleEditItem = (item) => {
    // Create URLSearchParams to pass item details back to the subscribe page
    const params = new URLSearchParams();
    params.set('edit', 'true'); // Flag to indicate edit mode
    params.set('mealType', item.mealType);
    params.set('productId', item.id); // Product ID
    if (item.plan) params.set('planId', item.plan.id); // Plan ID
    params.set('quantity', item.quantity);

    // Reconstruct frequency parameters based on the text
    if (item.frequency) {
        const freqMap = {'Mon - Fri': 'mon-fri', 'Mon - Sat': 'mon-sat', 'Mon - Sun': 'mon-sun'};
        const customDays = item.frequency.split(', '); // Check if it's custom days
        if (customDays.length > 1 && customDays.every(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(d))) {
            params.set('frequencyId', 'custom');
            customDays.forEach(day => params.set(day.toLowerCase(), 'true')); // Set individual day params
        } else {
            // Find the matching preset frequency ID
            params.set('frequencyId', freqMap[item.frequency] || 'mon-fri'); // Default if not found
        }
    }
    // Pass start date (should be YYYY-MM-DD format already)
    if (item.startDate) params.set('startDate', item.startDate);

    // Navigate to the subscribe page with the parameters
    router.push(`/subscribe?${params.toString()}`);
  };

  // --- RENDER ---

  // Render message if cart is empty (and addresses are done loading)
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
      {/* Back Link */}
      <Link href="/subscribe" className={styles.backLink}>
        ← Back to Subscription Builder
      </Link>
      {/* Page Title */}
      <h1 className={styles.pageTitle}>Checkout</h1>

      {/* Main Grid Layout */}
      <div className={styles.layoutGrid}>
        {/* --- Left Column: Address & Payment --- */}
        <div className={styles.formColumn}>

          {/* Delivery Address Box */}
          <div className={styles.formBox}>
            <h2>Delivery Address</h2>
            {/* Conditional rendering based on viewMode */}
            {viewMode === 'select_address' ? (
              <>
                {/* Address List */}
                <div className={styles.addressList}>
                  {isAddressLoading && <p>Loading addresses...</p>}
                  {!isAddressLoading && savedAddresses.length === 0 && (
                    <p>You have no saved addresses. Please add one.</p>
                  )}
                  {/* Map through saved addresses */}
                  {!isAddressLoading && savedAddresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.active : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)} // Select address on click
                    >
                      <div className={styles.addressCardHeader}>
                        <span className={styles.addressType}>{addr.type}</span>
                        {/* Edit button for each address */}
                        <button
                          type="button"
                          className={styles.editAddressButton}
                          onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} // Prevent card selection when clicking edit
                        >
                          Edit
                        </button>
                      </div>
                      {/* Address details */}
                      <p>
                        <strong>{addr.full_name}</strong> - {addr.phone}<br/>
                        {addr.address_line_1}, {addr.address_line_2 ? `${addr.address_line_2},` : ''}<br/>
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Button to switch to add address form */}
                <button className={styles.addNewButton} onClick={() => setViewMode('add_new_address')}>
                  + Add a New Address
                </button>
              </>
            ) : (
              // Address Add/Edit Form
              <form onSubmit={handleSaveAddress}>
                {/* Type Select */}
                <div className={styles.formGroup}>
                  <label htmlFor="type">Address Type</label>
                  <select id="type" name="type" value={formData.type} onChange={handleInputChange} className={styles.inputField}>
                    <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
                  </select>
                </div>
                {/* Name & Phone Row */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">Full Name *</label>
                    <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} className={styles.inputField} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number *</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className={styles.inputField} required maxLength="10" />
                  </div>
                </div>
                {/* Address Line 1 */}
                <div className={styles.formGroup}>
                  <label htmlFor="addressLine1">Address Line 1 *</label>
                  <input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className={styles.inputField} placeholder="House No., Building Name" required />
                </div>
                {/* Address Line 2 */}
                <div className={styles.formGroup}>
                    <label htmlFor="addressLine2">Address Line 2</label>
                    <input type="text" id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className={styles.inputField} placeholder="Road Name, Area, Colony" />
                </div>
                {/* City & State Row */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="city">City *</label>
                      <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} className={styles.inputField} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="state">State *</label>
                      <input type="text" id="state" name="state" value={formData.state} onChange={handleInputChange} className={styles.inputField} required />
                    </div>
                </div>
                {/* Pincode & Landmark Row */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="pincode">Pincode *</label>
                      <input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} className={styles.inputField} placeholder="6-digit pincode" required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="landmark">Landmark</label>
                      <input type="text" id="landmark" name="landmark" value={formData.landmark} onChange={handleInputChange} className={styles.inputField} placeholder="Nearby landmark" />
                    </div>
                </div>
                {/* Default Address Checkbox */}
                <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} style={{ width: 'auto' }} />
                    <label htmlFor="isDefault" style={{ marginBottom: 0 }}>Set as default address</label>
                </div>
                {/* Form Action Buttons */}
                <div className={styles.formActions}>
                  <button type="button" className={styles.backButton} onClick={handleCancelEdit}>
                    ← {editingAddressId ? 'Cancel Edit' : 'Back to Selection'}
                  </button>
                  <button type="submit" className={styles.confirmButton} disabled={isLoading}>
                    {isLoading ? 'Saving...' : (editingAddressId ? 'Update Address' : 'Save and Use Address')}
                  </button>
                </div>
              </form>
            )}
          </div> {/* End Address Box */}

          {/* Payment Method Box */}
          <div className={styles.formBox}>
            <h2>Payment Method</h2>
            <div className={styles.paymentOptionsList}>
               {/* Online Payment Option */}
               <label className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.active : ''}`}>
                <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                <div className={styles.paymentDetails}>
                  <span className={styles.paymentTitle}>Online Payment</span>
                  <span className={styles.paymentDesc}>Pay securely using UPI, Cards, or Net Banking</span>
                </div>
              </label>
              {/* COD Option */}
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

        {/* --- Right Column: UPDATED Order Summary --- */}
        <div className={styles.summaryColumn}>
          <div className={styles.summaryBox}>
            {/* Summary Header */}
            <div className={styles.summaryHeader}>
              <h2>Order Summary</h2>
              {/* Removed global Edit Cart link */}
            </div>

            {/* Loop through LUNCH items */}
            {cart.lunch.map((item, index) => (
              <div key={`lunch-${item.subs_id || index}`} className={styles.summaryItem}>
                <div className={styles.summaryItemHeader}>
                  <span className={styles.summaryMealTypeLabel}>LUNCH</span>
                  {/* Item-specific actions */}
                  <div className={styles.itemActions}>
                    <button onClick={() => handleEditItem(item)} className={styles.editItemButton} aria-label="Edit lunch item" disabled={isLoading}><Pencil size={16} /> Edit</button>
                    <button onClick={() => handleRemoveItem(item.mealType, item.subs_id)} className={styles.removeItemButton} aria-label="Remove lunch item" disabled={isLoading}><Trash2 size={16} /> Remove</button>
                  </div>
                </div>
                {/* Item Details Grid */}
                <div className={styles.summaryGrid}>
                  <span className={styles.summaryLabel}>Selected Meal:</span><span className={styles.summaryValue}>{item.name || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Quantity/Day:</span><span className={styles.summaryValue}>{item.quantity}</span>
                  <span className={styles.summaryLabel}>Subscription:</span><span className={styles.summaryValue}>{item.plan?.plan_name || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Delivery Days:</span><span className={styles.summaryValue}>{item.frequency || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Start Date:</span><span className={styles.summaryValue}>{item.startDate ? new Date(item.startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}</span>
                  <span className={styles.summaryLabel}>Total Meals:</span><span className={styles.summaryValue}>{item.totalMeals || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Price:</span><span className={styles.summaryValue}>₹{(item.totalPrice || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}

            {/* Divider if both lunch and dinner exist */}
            {cart.lunch.length > 0 && cart.dinner.length > 0 && <div className={styles.summaryDivider}></div>}

            {/* Loop through DINNER items */}
            {cart.dinner.map((item, index) => (
              <div key={`dinner-${item.subs_id || index}`} className={styles.summaryItem}>
                 <div className={styles.summaryItemHeader}>
                  <span className={styles.summaryMealTypeLabel}>DINNER</span>
                   {/* Item-specific actions */}
                   <div className={styles.itemActions}>
                    <button onClick={() => handleEditItem(item)} className={styles.editItemButton} aria-label="Edit dinner item" disabled={isLoading}><Pencil size={16} /> Edit</button>
                    <button onClick={() => handleRemoveItem(item.mealType, item.subs_id)} className={styles.removeItemButton} aria-label="Remove dinner item" disabled={isLoading}><Trash2 size={16} /> Remove</button>
                  </div>
                </div>
                {/* Item Details Grid */}
                <div className={styles.summaryGrid}>
                  <span className={styles.summaryLabel}>Selected Meal:</span><span className={styles.summaryValue}>{item.name || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Quantity/Day:</span><span className={styles.summaryValue}>{item.quantity}</span>
                  <span className={styles.summaryLabel}>Subscription:</span><span className={styles.summaryValue}>{item.plan?.plan_name || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Delivery Days:</span><span className={styles.summaryValue}>{item.frequency || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Start Date:</span><span className={styles.summaryValue}>{item.startDate ? new Date(item.startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}</span>
                  <span className={styles.summaryLabel}>Total Meals:</span><span className={styles.summaryValue}>{item.totalMeals || 'N/A'}</span>
                  <span className={styles.summaryLabel}>Price:</span><span className={styles.summaryValue}>₹{(item.totalPrice || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}

            {/* Total Amount Row */}
            <div className={styles.totalAmountRow}>
              <span className={styles.summaryTotalLabel}>Total Amount:</span>
              <span className={styles.summaryTotalPrice}>₹{(cartTotal || 0).toLocaleString('en-IN')}/-</span>
            </div>

            {/* Payment Button */}
            <button className={styles.paymentButton} disabled={!selectedAddressId || isLoading || isCartEmpty} onClick={handleProceedToPayment}>
              {isLoading ? 'Processing...' : (paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Payment')}
            </button>
            {/* Terms Text */}
            <p className={styles.terms}>By placing this order, you agree to our Terms & Conditions</p>
          </div> {/* End Summary Box */}
        </div> {/* End Right Column */}

      </div> {/* End Layout Grid */}
    </div> // End Page Container
  );
}