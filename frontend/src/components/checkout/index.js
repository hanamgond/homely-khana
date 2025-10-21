'use client';

// --- fetchWithToken and useEffect are now needed ---
import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import styles from './Checkout.module.css';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import { fetchWithToken } from '@/utils/CookieManagement'; // Already imported, now we'll use it

export default function CheckoutClient() {
  // Use cart, cartTotal from context
  const { cart, cartTotal, setDeliveryAddress, user } = useContext(AppContext); // Added user for potential use
  const router = useRouter();

  const [viewMode, setViewMode] = useState('select_address');

  // --- Address state is now fetched from the API ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  // --------------------------------------------------------

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    type: 'Home', // Default type to Home
    isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isLoading, setIsLoading] = useState(false); // For the main payment button

  const isCartEmpty = !cart || (cart.lunch.length === 0 && cart.dinner.length === 0);
  // --- FIX: Create a combined list of all items for the summary ---
  const allCartItems = isCartEmpty ? [] : [...cart.lunch, ...cart.dinner];


  // --- Function to fetch real addresses from our backend ---
  const fetchAddresses = async () => {
    setIsAddressLoading(true);
    try {
      const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/addresses/all`);
      const data = await response.json();
      if (data.success) {
        setSavedAddresses(data.data);
        // Automatically select the default address
        const defaultAddress = data.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (data.data.length > 0) {
          // If no default, select the first one
          setSelectedAddressId(data.data[0].id);
        }
      } else {
        toast.error("Could not load your saved addresses.");
      }
    } catch (err) {
      toast.error("Failed to connect to address server.");
    } finally {
      setIsAddressLoading(false);
    }
  };

  // --- Fetch addresses when the component loads ---
  useEffect(() => {
    // Only fetch addresses if user is logged in (token exists)
    // This check might be implicit in fetchWithToken, but added for clarity
    if (localStorage.getItem('jwtToken')) { // Or however you check for the token
        fetchAddresses();
    } else {
        setIsAddressLoading(false); // Don't show loading if not logged in
        // Optionally redirect to login if checkout requires login
        // router.push('/login');
    }
  }, []); // Empty array ensures this runs once on mount

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Save/Update Address now uses the API ---
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
        toast.error("Please fill in all required address fields.");
        return;
    }
    setIsLoading(true);
    try {
      const body = JSON.stringify({
        type: formData.type, fullName: formData.fullName, phone: formData.phone,
        addressLine1: formData.addressLine1, addressLine2: formData.addressLine2,
        city: formData.city, state: formData.state, pincode: formData.pincode,
        landmark: formData.landmark, isDefault: formData.isDefault
      });
      const url = editingAddressId ? `${process.env.NEXT_PUBLIC_URL}/api/addresses/edit/${editingAddressId}` : `${process.env.NEXT_PUBLIC_URL}/api/addresses/add`;
      const method = editingAddressId ? 'PUT' : 'POST';

      const response = await fetchWithToken(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: body
      });

       if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(editingAddressId ? "Address updated!" : "Address saved!");
        handleCancelEdit();
        await fetchAddresses(); // Refetch to update list and potentially default selection
        if (!editingAddressId && data.data.id) {
            setSelectedAddressId(data.data.id); // Select the newly added address
        }
      } else {
        toast.error(data.error || "Failed to save address.");
      }
    } catch (err) {
       console.error("Error saving address:", err);
       toast.error(err.message || "An error occurred while saving the address.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleEditAddress = (address) => {
    setFormData({
      fullName: address.full_name, phone: address.phone, addressLine1: address.address_line_1,
      addressLine2: address.address_line_2 || '', city: address.city, state: address.state,
      pincode: address.pincode, landmark: address.landmark || '', type: address.type,
      isDefault: address.is_default
    });
    setEditingAddressId(address.id);
    setViewMode('add_new_address');
  };

  const handleCancelEdit = () => {
    setFormData({
      fullName: '', phone: '', addressLine1: '', addressLine2: '',
      city: '', state: '', pincode: '', landmark: '',
      type: 'Home', isDefault: false
    });
    setEditingAddressId(null);
    setViewMode('select_address');
  };

  // --- THE UNIFIED PAYMENT FUNCTION ---
  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      toast.error("Please select or add a delivery address.");
      return;
    }
    const finalAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
     if (!finalAddress) {
      toast.error("Selected address not found. Please try again.");
      return;
    }
    // Update context immediately if needed elsewhere, though backend uses ID
    if(setDeliveryAddress) setDeliveryAddress(finalAddress);

    setIsLoading(true);

    try {
      const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/bookings/create`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart, // Send the cart object { lunch: [...], dinner: [...] }
          cartTotal: cartTotal,
          addressId: selectedAddressId,
          paymentMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Booking creation failed: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create booking.");
      }

      if (data.payment_session_id) {
        // --- ONLINE PAYMENT FLOW ---
        const cashfree = await load({ mode: "sandbox" }); // Or "production"
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_self"
        });
        // Don't set isLoading(false) as page redirects

      } else {
        // --- COD FLOW ---
        toast.success("Order placed successfully!");
        // TODO: Implement cart clearing logic in AppContext
        // clearCart();
        router.push('/order-success');
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error(error.message || "An error occurred while placing the order.");
      setIsLoading(false);
    }
  };


  // Render Empty Cart message if applicable
  if (isCartEmpty) {
    return (
      <div className={styles.pageContainer}>
        <h2 style={{ textAlign: 'center', margin: '4rem 0' }}>Your cart is empty.</h2>
        <Link href="/subscribe" className={styles.backLink} style={{ justifyContent: 'center' }}>
            ← Build a Subscription
        </Link>
      </div>
    );
  }

  // Main component render
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
                <div className={styles.addressList}>
                  {isAddressLoading && <p>Loading addresses...</p>}
                  {!isAddressLoading && savedAddresses.length === 0 && (
                    <p>You have no saved addresses. Please add one.</p>
                  )}
                  {!isAddressLoading && savedAddresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.active : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div className={styles.addressCardHeader}>
                        <span className={styles.addressType}>{addr.type}</span>
                        <button type="button" className={styles.editAddressButton} onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}>
                          Edit
                        </button>
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
                {/* Address Lines */}
                <div className={styles.formGroup}>
                  <label htmlFor="addressLine1">Address Line 1 *</label>
                  <input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className={styles.inputField} placeholder="House No., Building Name" required />
                </div>
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
                {/* Form Actions (Buttons) */}
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
          </div>

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
          </div>
        </div>

        {/* --- Right Column: Order Summary --- */}
        <div className={styles.summaryColumn}>
          <div className={styles.summaryBox}>
            <div className={styles.summaryHeader}>
              <h2>Order Summary</h2>
              <Link href="/subscribe" className={styles.editButton}>Edit</Link>
            </div>

            {/* --- Updated Loop for All Cart Items --- */}
            {allCartItems.map((item, index) => (
              <div key={item.subs_id || item.id || index}> {/* Use subs_id or id if available */}
                {/* Add a divider if showing multiple items (e.g., lunch + dinner) */}
                {index > 0 && <div className={styles.summaryDivider}></div>}

                <div className={styles.summaryGrid}>
                  <span className={styles.summaryLabel}>Meal Type:</span>
                  <span className={styles.summaryValue}>{item.mealType}</span>

                  <span className={styles.summaryLabel}>Selected Meal:</span>
                  {/* Use 'name' if available (from product fetch), otherwise 'selectedMeal' */}
                  <span className={styles.summaryValue}>{item.name || item.selectedMeal}</span>

                  <span className={styles.summaryLabel}>Quantity/Day:</span>
                  <span className={styles.summaryValue}>{item.quantity}</span>

                  <span className={styles.summaryLabel}>Subscription:</span>
                  {/* Use plan object if available, otherwise fallback to plan name string */}
                  <span className={styles.summaryValue}>{item.plan?.plan_name || item.plan || 'N/A'}</span>

                  <span className={styles.summaryLabel}>Delivery Days:</span>
                  <span className={styles.summaryValue}>{item.frequency || 'N/A'}</span>

                  <span className={styles.summaryLabel}>Start Date:</span>
                  <span className={styles.summaryValue}>{item.startDate || 'N/A'}</span>

                  <span className={styles.summaryLabel}>Total Meals:</span>
                  <span className={styles.summaryValue}>{item.totalMeals || 'N/A'}</span>
                </div>
              </div>
            ))}
            {/* --- End Updated Loop --- */}

            {/* Total Amount */}
            <div className={styles.totalAmountRow}>
              <span className={styles.summaryTotalLabel}>Total Amount:</span>
              <span className={styles.summaryTotalPrice}>₹{(cartTotal || 0).toLocaleString('en-IN')}/-</span>
            </div>

            {/* Payment Button */}
            <button className={styles.paymentButton} disabled={!selectedAddressId || isLoading} onClick={handleProceedToPayment}>
              {isLoading ? 'Processing...' : (paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Payment')}
            </button>
            <p className={styles.terms}>By placing this order, you agree to our Terms & Conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}