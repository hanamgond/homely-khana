//admin-portal/src/context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  // Load stored token on app start
  useEffect(() => {

    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);

  }, []);

  // LOGIN
  const login = (phone, password) => {

    return new Promise(async (resolve, reject) => {

      try {

        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!API_URL) {
          throw new Error("NEXT_PUBLIC_API_URL is not defined");
        }

        const response = await fetch(`${API_URL}/api/auth/login`, {

          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            identifier: phone,   // ✅ FIX HERE
            password
          })

        });

        const data = await response.json();

        if (data.success && data.user?.role === 'admin') {

          setToken(data.token);
          setUser(data.user);

          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminUser', JSON.stringify(data.user));

          router.push('/');

          resolve(data);

        } else {

          reject(new Error(data.error || 'Login failed or not an admin.'));

        }

      } catch (error) {

        reject(error);

      }

    });

  };

  // LOGOUT
  const logout = () => {

    setUser(null);
    setToken(null);

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    router.push('/login');

  };

  return (

    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}

export const useAuth = () => {
  return useContext(AuthContext);
};