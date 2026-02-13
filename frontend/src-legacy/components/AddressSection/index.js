import { useState } from 'react';
import styles from './AddressSection.module.css';

// We'll use dummy data for now. Later, this will come from your API.
const dummySavedAddresses = [
  { id: 1, address: '123 Dream Apartments, Indiranagar, Bangalore', type: 'Home' },
  { id: 2, address: '456 Work Towers, Koramangala, Bangalore', type: 'Work' },
];

const AddressSection = ({ onAddressSelect }) => {
  const [view, setView] = useState('view_addresses'); // 'view_addresses' or 'add_new'
  const [savedAddresses, setSavedAddresses] = useState(dummySavedAddresses);
  const [selectedAddress, setSelectedAddress] = useState(dummySavedAddresses[0]);

  const handleSelectAndContinue = () => {
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
    }
  };

  if (view === 'add_new') {
    return (
      <div className={styles.stepBox}>
        <div className={styles.stepHeader}>
          <h2>Add New Delivery Address</h2>
        </div>
        {/* We will build the map search and form here in the next step */}
        <p>Map and address form will go here.</p>
        <button className={styles.backButton} onClick={() => setView('view_addresses')}>← Back to Saved Addresses</button>
      </div>
    );
  }

  return (
    <div className={styles.stepBox}>
      <div className={styles.stepHeader}>
        <h2>Select Delivery Address</h2>
      </div>
      <div className={styles.addressList}>
        {savedAddresses.map(addr => (
          <div
            key={addr.id}
            className={`${styles.addressCard} ${selectedAddress?.id === addr.id ? styles.active : ''}`}
            onClick={() => setSelectedAddress(addr)}
          >
            <span className={styles.addressType}>{addr.type}</span>
            <p>{addr.address}</p>
          </div>
        ))}
      </div>
      <button className={styles.addNewButton} onClick={() => setView('add_new')}>
        + Add a New Address
      </button>
      <button className={styles.continueButton} onClick={handleSelectAndContinue}>
        Save and Continue
      </button>
    </div>
  );
};

export default AddressSection;