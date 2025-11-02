import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product) => set((state) => ({
        items: [...state.items, { ...product, id: Date.now() }]
      })),
      removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(item => item.id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item => 
          item.id === productId ? { ...item, quantity } : item
        )
      })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + (item.quantity || 1), 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0),
    }),
    {
      name: 'cart-storage',
      skipHydration: true
    }
  )
)