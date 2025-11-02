import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Cart drawer state
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  // Loading states
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Notifications
  notification: null,
  showNotification: (message, type = 'info') => set({ 
    notification: { message, type, id: Date.now() } 
  }),
  clearNotification: () => set({ notification: null }),
}))
