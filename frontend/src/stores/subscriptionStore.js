import { create } from 'zustand'

export const useSubscriptionStore = create((set, get) => ({
  // Subscription editing state
  editSubId: null,
  subStep: 0,
  
  // Subscription actions
  setEditSubId: (editSubId) => set({ editSubId }),
  setSubStep: (subStep) => set({ subStep }),
  
  removeSubscription: (mealType, subsId) => {
    console.log('Remove subscription:', { mealType, subsId });
    // Add your subscription removal logic here
  },
  
  updateQuantity: (mealType, subsId, quantity) => {
    console.log('Update quantity:', { mealType, subsId, quantity });
    // Add your quantity update logic here
  },
  
  // Clear subscription state
  clearSubscriptionState: () => set({ editSubId: null, subStep: 0 }),
}))
