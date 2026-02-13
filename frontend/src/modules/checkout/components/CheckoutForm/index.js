//frontend/src/modules/checkout/components/CheckoutClient.js

'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/shared/lib/AppContext';
import styles from './Checkout.module.css';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import { fetchWithToken, getCookie } from '@/shared/lib/CookieManagement';
// Added Home, Briefcase, MapPin for the new Type Selector
import { Trash2, Pencil, CreditCard, Banknote, ShieldCheck, Lock, Plus, Home, Briefcase, MapPin } from 'lucide-react';
import GoogleAddressInput from '@/shared/components/GoogleAddressInput';

export default function CheckoutClient() {
  const { user,cart, cartTotal, setDeliveryAddress, clearCart, removeSubscription } = useContext(AppContext);
  const router = useRouter();

  // --- STATE VARIABLES ---
  const [viewMode, setViewMode] = useState('select_address');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  // New: Track if ordering for self to hide Name/Phone fields
  const [isOrderingForSelf, setIsOrderingForSelf] = useState(true);

  // Address Type Config
  const addressTypes = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'work', label: 'Work', icon: <Briefcase size={18} /> },
    { id: 'other', label: 'Other', icon: <MapPin size={18} /> }
  ];
  
  const [formData, setFormData] = useState({
    fullName: '', phone: '', 
    addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', 
    landmark: '', type: 'Home', isDefault: false,
    lat: null, lng: null 
  });
  
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isLoading, setIsLoading] = useState(false);

  const isCartEmpty = !cart || (cart.lunch.length === 0 && cart.dinner.length === 0);
  const allItems = [...(cart?.lunch || []), ...(cart?.dinner || [])];
  const totalOriginalPrice = allItems.reduce((acc, item) => acc + (item.originalAmount || item.totalPrice), 0);
  const totalDiscount = totalOriginalPrice - cartTotal;

  const fetchAddresses = async () => {
    setIsAddressLoading(true);
    try {
      const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/addresses/all`);
      const data = await response.json();
      if (data.success) {
        setSavedAddresses(data.data);
        const defaultAddress = data.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (data.data.length > 0) {
          setSelectedAddressId(data.data[0].id);
        }
      } else {
        toast.error("Could not load addresses.");
      }
    } catch (err) {
      console.error("Fetch Address Error:", err);
      toast.error("Failed to connect to address server.");
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleGoogleAddressSelect = (geoData) => {
    setFormData(prev => ({
        ...prev,
        addressLine2: geoData.addressLine1, 
        city: geoData.city,
        state: geoData.state,
        pincode: geoData.pincode,
        lat: geoData.lat, // Background storage
        lng: geoData.lng  // Background storage
    }));
    toast.success("Address details fetched! Please add your Flat/Floor number.");
  };

  useEffect(() => {
    if (getCookie()) {
      fetchAddresses();
    } else {
      setIsAddressLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    
    // Construct final payload including background coordinates
    const finalPayload = {
      ...formData,
      type: formData.type.toLowerCase(),
      fullName: isOrderingForSelf ? (user?.name || "Self") : formData.fullName,
    // This logic cleans the login phone number to exactly 10 digits to pass Zod validation
      phone: isOrderingForSelf 
      ? (user?.phone?.replace(/\D/g, '').slice(-10) || "") 
      : formData.phone 
    };

    if (!finalPayload.addressLine1 || !finalPayload.city || !finalPayload.state || !finalPayload.pincode) {
        toast.error("Please fill in all required address fields.");
        return;
    }

    setIsLoading(true);
    try {
      const body = JSON.stringify(finalPayload);
      const url = editingAddressId
        ? `${process.env.NEXT_PUBLIC_URL}/api/addresses/edit/${editingAddressId}`
        : `${process.env.NEXT_PUBLIC_URL}/api/addresses/add`;
      const method = editingAddressId ? 'PUT' : 'POST';

      const response = await fetchWithToken(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      const data = await response.json();

      if (data.success) {
        toast.success(editingAddressId ? "Address updated!" : "Address saved!");
        handleCancelEdit();
        await fetchAddresses();
        if (!editingAddressId && data.data?.id) setSelectedAddressId(data.data.id);
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

  const handleEditAddress = (address) => {
    setFormData({
      fullName: address.full_name, phone: address.phone, addressLine1: address.address_line_1,
      addressLine2: address.address_line_2 || '', city: address.city, state: address.state,
      pincode: address.pincode, landmark: address.landmark || '', type: address.type, isDefault: address.is_default,
      lat: address.latitude || null, lng: address.longitude || null
    });
    setEditingAddressId(address.id);
    setViewMode('add_new_address');
  };

  const handleCancelEdit = () => {
    setFormData({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', landmark: '', type: 'Home', isDefault: false, lat: null, lng: null });
    setEditingAddressId(null);
    setViewMode('select_address');
  };

  const handleRemoveItem = (mealType, subs_id) => {
      if (!mealType || !subs_id) return;
      removeSubscription(mealType, subs_id);
      toast.info("Item removed from cart.");
  };

  const handleEditItem = (item) => {
    const params = new URLSearchParams();
    params.set('edit', 'true');
    params.set('mealType', item.mealType);
    params.set('productId', item.id);
    params.set('quantity', item.quantity);
    if (item.plan) params.set('planId', item.plan.id);
    if (item.startDate) params.set('startDate', item.startDate);
    
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
    router.push(`/subscribe?${params.toString()}`);
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddressId) return toast.error("Please select a delivery address.");
    const finalAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
    if (!finalAddress) return toast.error("Selected address invalid.");
    if(setDeliveryAddress) setDeliveryAddress(finalAddress);

    setIsLoading(true);
    try {
      const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/bookings/create`, {
        method: "POST", headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, cartTotal, addressId: selectedAddressId, paymentMethod }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      if (data.payment_session_id) {
        const cashfree = await load({ mode: "sandbox" });
        clearCart();
        cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: "_self" });
      } else {
        toast.success("Order placed successfully!");
        clearCart();
        router.push('/order-success');
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error(error.message || "Order placement failed.");
      setIsLoading(false);
    }
  };

  if (isCartEmpty && !isAddressLoading) {
    return (
        <div className={styles.emptyContainer}>
            <div className={styles.emptyContent}>
                <h2>Your cart is empty</h2>
                <p>Start your healthy journey today.</p>
                <Link href="/subscribe" className={styles.primaryBtn}>Build Subscription</Link>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidthWrapper}>
        <div className={styles.header}>
            <h1 className={styles.pageTitle}>Secure Checkout</h1>
            <div className={styles.secureBadge}><Lock size={12}/> 256-Bit SSL Encrypted</div>
        </div>

        <div className={styles.grid}>
            <div className={styles.leftColumn}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.stepNum}>1</div>
                        <h3>Delivery Address</h3>
                    </div>
                    <div className={styles.cardBody}>
                        {viewMode === 'select_address' ? (
                            <div className={styles.addressList}>
                                {isAddressLoading && <p>Loading...</p>}
                                {!isAddressLoading && savedAddresses.length === 0 && <p className={styles.emptyText}>No addresses found.</p>}
                                
                                {savedAddresses.map(addr => (
                                    <div 
                                        key={addr.id} 
                                        className={`${styles.addressItem} ${selectedAddressId === addr.id ? styles.selectedAddress : ''}`}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                    >
                                        <div className={styles.radioBox}><div className={styles.radioInner}></div></div>
                                        <div className={styles.addressContent}>
                                            <div className={styles.addrHeader}>
                                                <span className={styles.addrType}>{addr.type}</span>
                                                <span className={styles.addrName}>{addr.full_name}</span>
                                            </div>
                                            <p className={styles.addrText}>
                                                {addr.address_line_1}, {addr.address_line_2 && `${addr.address_line_2}, `}
                                                {addr.city} - <strong>{addr.pincode}</strong><br/>
                                                Ph: {addr.phone}
                                            </p>
                                        </div>
                                        <button className={styles.editIconBtn} onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}>
                                            <Pencil size={16}/>
                                        </button>
                                    </div>
                                ))}
                                <button className={styles.addNewBtn} onClick={() => setViewMode('add_new_address')}>
                                    <Plus size={18}/> Add New Address
                                </button>
                            </div>
                        ) : (
                            <div className={styles.addressFormWrapper}>
                                <div className={styles.typeSelectorGrid}>
                                    {addressTypes.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`${styles.typeBtn} ${formData.type.toLowerCase() === t.id ? styles.activeType : ''}`}
                                            onClick={() => setFormData({ ...formData, type: t.id })}
                                        >
                                            {t.icon} <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <GoogleAddressInput onAddressSelect={handleGoogleAddressSelect} />
                                
                                <div className={styles.manualSectionHeader}>Delivery Details</div>

                                <form onSubmit={handleSaveAddress} className={styles.addressForm}>
                                    <div className={styles.selfToggleRow}>
                                        <input 
                                            type="checkbox" 
                                            id="forSelf" 
                                            checked={isOrderingForSelf} 
                                            onChange={(e) => setIsOrderingForSelf(e.target.checked)} 
                                        />
                                        <label htmlFor="forSelf">Ordering for myself</label>
                                    </div>

                                    {!isOrderingForSelf && (
                                        <div className={styles.formGrid}>
                                            <div className={styles.inputGroup}><label>Receiver&apos;s Name</label><input name="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>
                                            <div className={styles.inputGroup}><label>Receiver&apos;s Phone</label><input name="phone" value={formData.phone} onChange={handleInputChange} required maxLength="10" /></div>
                                        </div>
                                    )}

                                    <div className={styles.formGrid}>
                                        <div className={styles.inputGroupFull}><label>Flat / Building / Floor</label><input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} required placeholder="e.g. Flat 401, A-Wing" /></div>
                                        <div className={styles.inputGroupFull}><label>Street / Area (From Google)</label><input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} /></div>
                                        <div className={styles.inputGroup}><label>City</label><input name="city" value={formData.city} onChange={handleInputChange} required /></div>
                                        <div className={styles.inputGroup}><label>Pincode</label><input name="pincode" value={formData.pincode} onChange={handleInputChange} required maxLength="6" /></div>
                                        <div className={styles.inputGroup}><label>State</label><input name="state" value={formData.state} onChange={handleInputChange} required /></div>
                                    </div>
                                    
                                    <div className={styles.checkboxRow}>
                                        <input type="checkbox" id="def" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} />
                                        <label htmlFor="def">Set as default address</label>
                                    </div>

                                    <div className={styles.formActions}>
                                        <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>Cancel</button>
                                        <button type="submit" className={styles.saveBtn} disabled={isLoading}>
                                            {editingAddressId ? 'Update Address' : 'Save Address'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.stepNum}>2</div>
                        <h3>Payment Method</h3>
                    </div>
                    <div className={styles.cardBody}>
                        <label className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.selectedPayment : ''}`}>
                            <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                            <div className={styles.payIconBox}><CreditCard size={20} color="#d97706"/></div>
                            <div className={styles.payInfo}><span className={styles.payTitle}>Pay Online</span><span className={styles.paySub}>UPI, Cards, Netbanking</span></div>
                        </label>
                        <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.selectedPayment : ''}`}>
                            <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                            <div className={styles.payIconBox}><Banknote size={20} color="#15803d"/></div>
                            <div className={styles.payInfo}><span className={styles.payTitle}>Cash on Delivery</span><span className={styles.paySub}>Pay on delivery</span></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.rightColumn}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                        <h3>Order Summary</h3>
                    </div>
                    
                    <div className={styles.cartItems}>
                        {allItems.map((item, i) => (
                            <div key={i} className={styles.cartItem}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemTag}>{item.mealType.toUpperCase()}</span>
                                    <div className={styles.itemActions}>
                                        <button onClick={() => handleEditItem(item)} aria-label="Edit"><Pencil size={14}/></button>
                                        <button onClick={() => handleRemoveItem(item.mealType, item.subs_id)} aria-label="Remove"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                <h4 className={styles.itemTitle}>{item.name}</h4>
                                <div className={styles.itemMetaGrid}>
                                    <span className={styles.label}>Plan</span>
                                    <span className={styles.value}>{item.plan?.plan_name}</span>
                                    <span className={styles.label}>Frequency</span>
                                    <span className={styles.value}>{item.frequency}</span>
                                    <span className={styles.label}>Start Date</span>
                                    <span className={styles.value}>{item.startDate}</span>
                                    <span className={styles.label}>Total Meals</span>
                                    <span className={styles.value}>{item.totalMeals}</span>
                                </div>
                                <div className={styles.itemPriceRow}>
                                    <span className={styles.label}>Price</span>
                                    <span>
                                        {item.originalAmount > item.totalPrice && (
                                            <span className={styles.originalPrice}>₹{item.originalAmount.toLocaleString('en-IN')}</span>
                                        )}
                                        <strong className={styles.finalPrice}>₹{item.totalPrice.toLocaleString('en-IN')}</strong>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.billDetails}>
                        <div className={styles.billRow}>
                            <span>Subtotal</span>
                            <span>₹{totalOriginalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className={`${styles.billRow} ${styles.discountRow}`}>
                                <span>Discount</span>
                                <span>- ₹{totalDiscount.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className={styles.billRow}>
                            <span>Delivery & Packing</span>
                            <span className={styles.freeText}>FREE</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>To Pay</span>
                            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className={styles.paySection}>
                        <button 
                            className={styles.payBtn} 
                            disabled={!selectedAddressId || isLoading} 
                            onClick={handleProceedToPayment}
                        >
                            {isLoading ? 'Processing...' : (
                                paymentMethod === 'cod' 
                                ? `Place Order` 
                                : `Pay ₹${cartTotal.toLocaleString('en-IN')}`
                            )}
                        </button>
                    </div>

                    <div className={styles.trustBadge}>
                        <ShieldCheck size={14} /> 100% Safe & Secure Payments
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}