//src/utils/CookieManagement.js
import { toast } from 'sonner';

// Helper to set a cookie
export const setCookie = (token, days = 7) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = "token=" + (token || "") + expires + "; path=/";
};

// Helper to get a cookie
export const getCookie = () => {
  const nameEQ = "token=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Helper to remove a cookie
export const removeCookie = () => {
  document.cookie = 'token=; Max-Age=-99999999; path=/;';
};

// --- THIS IS THE MISSING FUNCTION ---
// A wrapper around fetch that automatically includes the auth token
export const fetchWithToken = async (url, options = {}) => {
  const token = getCookie();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers, // Allow overriding headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // This will prevent API calls if the user isn't logged in
    toast.error("Authentication required. Please log in.");
    throw new Error("Authentication token not found.");
  }

  return fetch(url, { ...options, headers });
};