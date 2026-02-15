//admin-portal/src/lib/api.js
// admin-portal/src/lib/api.js

export const createApiClient = (token) => {

  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not defined. Check Vercel environment variables."
    );
  }

  const baseURL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

  const apiClient = async (endpoint, options = {}) => {
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch(`${baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

  return apiClient;
};
