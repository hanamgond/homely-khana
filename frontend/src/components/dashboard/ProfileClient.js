'use client';

import { useState, useContext, useEffect } from 'react';
import { toast } from "sonner";
import { AppContext } from "@/utils/AppContext";
import { fetchWithToken } from "@/utils/CookieManagement";
import AddNewDrawer from "@/components/drawers/AddNewDrawer";
import { User, Mail, Phone, Lock, MapPin, Home, Briefcase, Eye, EyeOff, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export default function ProfileClient() {
   const { user } = useContext(AppContext);
   const [addresses, setAddresses] = useState([]);
   const [showAddNewDiv, setShowAddNewDiv] = useState(false);
   
   // Toggle State: 'security', 'address', or null (closed)
   const [activeSection, setActiveSection] = useState('address'); 

   // Consolidated Password State
   const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
   const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });

  useEffect(() => {
      const fetchAddresses = async () => {
         try {
            // FIX: Changed 'address' to 'addresses' (Plural)
            const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/addresses/all`);
            
            // Check if the response is actually OK before trying to parse it
            if (!response.ok) throw new Error("Failed to fetch addresses");
            
            const res = await response.json();
            if(res.success) setAddresses(res.data);
         } catch (err) { 
             console.error("Address Fetch Error:", err); 
             // Optional: toast.error("Could not load addresses");
         }
      };
      fetchAddresses();
   }, []);

   const toggleSection = (section) => {
      setActiveSection(activeSection === section ? null : section);
   };

   const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match.");
        if (!passwords.old || !passwords.new) return toast.error("All fields are required.");
        
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(passwords.new)) {
             return toast.error("Password must be 6+ chars with letters & numbers");
        }

        try {
            const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/users/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new })
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Password updated successfully");
                setPasswords({ old: "", new: "", confirm: "" });
                setActiveSection(null); 
            } else {
                toast.error(data.error || "Failed to change password");
            }
        } catch (err) {
            toast.error("An error occurred.");
        }
   };

   // Reusable Input Component to fix the "Giant Eye" issue
   const PasswordInput = ({ label, valueKey, showKey, placeholder }) => (
     <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>{label}</label>
        <div style={styles.inputWrapper}>
            <input 
                type={showPass[showKey] ? "text" : "password"} 
                placeholder={placeholder}
                value={passwords[valueKey]}
                onChange={(e) => setPasswords({ ...passwords, [valueKey]: e.target.value })}
                style={styles.input}
            />
            <button 
                type="button"
                onClick={() => setShowPass({ ...showPass, [showKey]: !showPass[showKey] })}
                style={styles.eyeButton}
            >
                {showPass[showKey] ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
            </button>
        </div>
     </div>
   );

   return (
     <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom:'2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '0.5rem' }}>Profile Settings</h2>
            <p style={{ color: '#666' }}>Manage your account details and preferences</p>
        </div>

        {/* --- SECTION 1: USER DETAILS (Always Visible) --- */}
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Personal Information</h3>
            </div>
            <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                    <div style={styles.iconBox}><User size={20} color="#FF9801" /></div>
                    <div>
                        <p style={styles.infoLabel}>Full Name</p>
                        <p style={styles.infoValue}>{user?.name || 'Guest'}</p>
                    </div>
                </div>
                <div style={styles.infoItem}>
                    <div style={styles.iconBox}><Mail size={20} color="#FF9801" /></div>
                    <div>
                        <p style={styles.infoLabel}>Email Address</p>
                        <p style={styles.infoValue}>{user?.email || 'N/A'}</p>
                    </div>
                </div>
                <div style={styles.infoItem}>
                    <div style={styles.iconBox}><Phone size={20} color="#FF9801" /></div>
                    <div>
                        <p style={styles.infoLabel}>Phone Number</p>
                        <p style={styles.infoValue}>{user?.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SECTION 2: SECURITY (Collapsible) --- */}
        <div style={styles.card}>
            <div style={styles.cardHeaderClickable} onClick={() => toggleSection('security')}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Lock size={20} color="#555"/>
                    <h3 style={styles.cardTitle}>Login & Security</h3>
                </div>
                {activeSection === 'security' ? <ChevronUp size={20} color="#777" /> : <ChevronDown size={20} color="#777" />}
            </div>
            
            {activeSection === 'security' && (
                <div style={styles.cardBody}>
                    <PasswordInput label="Current Password" valueKey="old" showKey="old" placeholder="Enter current password" />
                    <div style={styles.gridRow}>
                        <PasswordInput label="New Password" valueKey="new" showKey="new" placeholder="Min. 6 chars" />
                        <PasswordInput label="Confirm Password" valueKey="confirm" showKey="confirm" placeholder="Re-enter new password" />
                    </div>
                    <button style={styles.saveBtn} onClick={handleChangePassword}>Update Password</button>
                </div>
            )}
        </div>

        {/* --- SECTION 3: ADDRESS BOOK (Collapsible) --- */}
        <div style={styles.card}>
            <div style={styles.cardHeaderClickable} onClick={() => toggleSection('address')}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <MapPin size={20} color="#555"/>
                    <h3 style={styles.cardTitle}>Saved Addresses</h3>
                </div>
                {activeSection === 'address' ? <ChevronUp size={20} color="#777" /> : <ChevronDown size={20} color="#777" />}
            </div>

            {activeSection === 'address' && (
                <div style={styles.cardBody}>
                    <button style={styles.addBtn} onClick={() => setShowAddNewDiv(true)}>
                        <Plus size={18} /> Add New Address
                    </button>
                    
                    {addresses.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic', textAlign:'center', padding:'1rem' }}>No addresses saved yet.</p>
                    ) : (
                        <div style={styles.addressList}>
                            {addresses.map((addr) => (
                                <div key={addr.id} style={styles.addressItem}>
                                    <div style={styles.addressIcon}>
                                        {addr.address_type === 1 ? <Home size={20} /> : addr.address_type === 2 ? <Briefcase size={20} /> : <MapPin size={20} />}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom:'2px', color:'#333' }}>
                                            {addr.address_type === 1 ? "Home" : addr.address_type === 2 ? "Work" : "Other"}
                                        </p>
                                        <p style={{ fontSize: '0.9rem', color: '#555', lineHeight:'1.4' }}>
                                            {addr.content || `${addr.address_line_1}, ${addr.city}`}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop:'2px' }}>
                                            {addr.rec_name} • {addr.number}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {showAddNewDiv && (
            <AddNewDrawer 
                addresses={addresses} 
                setAddresses={setAddresses} 
                showAddNewDiv={showAddNewDiv} 
                setShowAddNewDiv={setShowAddNewDiv} 
            />
        )}
     </div>
   );
}

const styles = {
    card: { background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '1.5rem', overflow: 'hidden', border: '1px solid #f0f0f0' },
    cardHeader: { padding: '1.5rem', borderBottom: '1px solid #f5f5f5', background: '#fff' },
    cardHeaderClickable: { padding: '1.5rem', borderBottom: '1px solid #f5f5f5', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#333', margin: 0 },
    cardBody: { padding: '1.5rem', background: '#fff' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', padding: '1.5rem' },
    infoItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fffaf0', borderRadius: '12px', border: '1px solid #ffe8cc' },
    iconBox: { background: 'white', padding: '8px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    infoLabel: { fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '600' },
    infoValue: { fontWeight: '600', color: '#333', fontSize: '1rem' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    label: { display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#444' },
    input: { width: '100%', padding: '0.8rem 1rem', paddingRight: '3rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.95rem', outline: 'none', backgroundColor: '#f9fafb' },
    eyeButton: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' },
    gridRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1rem' },
    saveBtn: { background: '#FF9801', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' },
    addBtn: { background: 'white', border: '1px dashed #FF9801', color: '#FF9801', padding: '1rem', width: '100%', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom:'1.5rem' },
    addressList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
    addressItem: { display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.2rem', border: '1px solid #eee', borderRadius: '12px', backgroundColor: 'white' },
    addressIcon: { background: '#f3f4f6', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }
};