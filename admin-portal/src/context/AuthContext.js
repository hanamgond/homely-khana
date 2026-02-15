//admin-portal/src/context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Create the context
const AuthContext = createContext(null);

// This is the provider component that will wrap our application
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Check for token on initial load
  const router = useRouter();

  // On component mount, try to load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      // In a real app, you'd verify this token with a /profile endpoint
      // For now, we'll just set it
      setToken(storedToken);
      // You could also store and set user details from localStorage
      // setUser(JSON.parse(localStorage.getItem('adminUser')));
    }
    setIsLoading(false);
  }, []);

  // --- THIS FUNCTION IS NOW FIXED ---
  const login = (phone, password) => { // Changed 'email' to 'phone'
    return new Promise(async (resolve, reject) => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined");
        }

        const response = await fetch(`${API_URL}/api/auth/login`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }), // Changed 'email' to 'phone'
        });

        const data = await response.json();

        if (data.success && data.user.role === 'admin') {
          // Check if user is an admin
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminUser', JSON.stringify(data.user));
          router.push('/'); // Redirect to dashboard
          resolve(data);
        } else {
          // Handle cases like "wrong password" or "user is not an admin"
          reject(new Error(data.error || 'Login failed or not an admin.'));
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  // --- END OF FIX ---

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily use the Auth Context in other components
export const useAuth = () => {
  return useContext(AuthContext);
};