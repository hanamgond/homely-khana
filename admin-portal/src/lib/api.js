//admin-portal/src/lib/api.js
// This function creates a helper to make authenticated API calls
export const createApiClient = (token) => {
  // Base URL for your backend
  const baseURL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : 'http://localhost:5000/api';

  const apiClient = async (endpoint, options = {}) => {
    // Merge default options with any custom options
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        // Add the JWT token to the Authorization header
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