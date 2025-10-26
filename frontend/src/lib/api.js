import { useAuthStore } from '@/store/authStore'; // Using alias path

// Get the base URL from your environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`; // Ensures /api prefix is always added

/**
 * A helper function to get authenticated headers.
 * It pulls the token directly from the Zustand store.
 */
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

/**
 * A helper function to handle API responses.
 * It centralizes error handling and unwraps common API response structures.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json(); // Try to parse error JSON
    } catch (e) {
      // If JSON parsing fails, use status text
    }
    // Use error message from API if available, otherwise use status text
    throw new Error(errorData.error || errorData.message || `Error: ${response.status} ${response.statusText}`);
  }

  // Try to parse the successful response as JSON
  const data = await response.json();

  // Check for the API's success wrapper (used by most endpoints)
  if (data.success === false) {
    throw new Error(data.error || 'API returned an error');
  }

  // Return the actual data content.
  return data.data ?? data;
};


// ==================================================================
// --- QUERIES (GET requests) ---
// ==================================================================

/**
 * Fetches products, with an optional type filter
 */
export const fetchProducts = async (type = null) => {
  const url = new URL(`${API_URL}/products`);
  if (type) {
    url.searchParams.append('type', type);
  }
  const response = await fetch(url.toString());
  return handleResponse(response); // Expects { success: true, data: [...] } -> returns product array
};

/**
 * Fetches the user's profile
 */
export const fetchProfile = async () => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response); // Expects { success: true, user: {...} } -> returns user object
};

/**
 * Fetches the user's saved addresses
 */
export const fetchAddresses = async () => {
  // --- CORRECTED PATH: Use /all ---
  const response = await fetch(`${API_URL}/addresses/all`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response); // Expects { success: true, data: [...] } -> returns address array
};

/**
 * Fetches a user's booking history
 */
export const fetchMyBookings = async () => {
  const response = await fetch(`${API_URL}/bookings/my-bookings`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response); // Expects { success: true, data: [...] } -> returns booking array
};

// ==================================================================
// --- MUTATIONS (POST, PUT, DELETE requests) ---
// ==================================================================

/**
 * Logs a user in
 * @param {object} credentials - { phone, password }
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response); // Expects { success: true, token: '...', user: {...} } -> returns { token, user }
};

/**
 * Registers a new user (via the /signup endpoint)
 * @param {object} userData - { name, email, phone, password }
 */
export const signupUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  // Expects { success: true, message: '...', user: {...} } -> returns user object
  return handleResponse(response);
};


/**
 * Creates a new booking
 * @param {object} bookingData - { items, total, paymentMethod, addressId }
 */
export const createBooking = async (bookingData) => {
  const response = await fetch(`${API_URL}/bookings/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bookingData),
  });
  // Expects { success: true, data: { booking: {...}, payment_session_id?: '...' } } -> returns { booking, payment_session_id }
  return handleResponse(response);
};

/**
 * Adds a new address
 * @param {object} addressData - API expected shape { type, full_name, phone, address_line_1, ... }
 */
export const addAddress = async (addressData) => {
  // --- CORRECTED PATH: Use /add ---
  const response = await fetch(`${API_URL}/addresses/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(addressData),
  });
  // Expects { success: true, data: { id: '...' } } -> returns { id: '...' }
  return handleResponse(response);
};

/**
 * Updates an existing address
 * @param {object} params - { addressId, ...addressData }
 */
export const updateAddress = async ({ addressId, ...addressData }) => {
  // --- CORRECTED PATH: Use /edit/:id ---
  const response = await fetch(`${API_URL}/addresses/edit/${addressId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(addressData),
  });
  // Expects { success: true, data: { updatedAddress } } -> returns { updatedAddress }
  return handleResponse(response);
};

/**
 * Changes the user's password
 * @param {object} passwordData - { oldPassword, newPassword }
 */
export const changePassword = async (passwordData) => {
  // *** Double-check this path (/auth/change-password) with your backend implementation ***
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(passwordData),
  });
  // Expects { success: true, message: '...' } -> returns { success: true, message: '...' }
  return handleResponse(response);
};