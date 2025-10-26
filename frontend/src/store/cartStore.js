import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [], // This will store an array of cart items

      /**
       * Adds or replaces the item in the cart.
       */
      addToCart: (item) => {
        const newItem = { ...item, price: item.totalPrice || item.price };
        
        // This logic handles adding Lunch AND Dinner
        // It replaces any existing item of the same mealType
        set((state) => ({
          cartItems: [
            // Keep items of a *different* meal type
            ...state.cartItems.filter(i => i.mealType !== newItem.mealType),
            // Add the new item
            newItem
          ]
        }));
      },

      /**
       * Removes an item from the cart by its ID.
       */
      removeFromCart: (itemId) => {
        set((state) => ({
          cartItems: state.cartItems.filter(item => item.id !== itemId && item.subs_id !== itemId),
        }));
      },

      /**
       * Clears the entire cart.
       */
      clearCart: () => set({ cartItems: [] }),
      
      /**
       * NEW: Updates the quantity of an item in the cart
       */
      updateQuantity: (itemId, newQuantity) => {
        set((state) => ({
          cartItems: state.cartItems.map(item => {
            if (item.id === itemId || item.subs_id === itemId) {
              // Calculate the unit price (price per 1 quantity)
              const unitPrice = (item.totalPrice || item.price) / (item.quantity || 1);
              // Calculate the new total price for the new quantity
              const newTotalPrice = unitPrice * newQuantity;
              
              return { 
                ...item, 
                quantity: newQuantity,
                // Update the price fields
                price: newTotalPrice,
                totalPrice: newTotalPrice 
              };
            }
            return item;
          })
        }));
      },

      /**
       * Calculates the total price of all items in the cart.
       */
      getTotalPrice: () => {
        const { cartItems } = get();
        if (cartItems.length === 0) return 0;
        
        return cartItems.reduce((total, item) => {
          return total + (item.totalPrice || item.price || 0);
        }, 0);
      },
    }),
    {
      name: 'cart-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cartItems: state.cartItems }),
    }
  )
);