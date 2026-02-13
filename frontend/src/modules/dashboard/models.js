import { z } from 'zod';

// --- SHARED SUB-SCHEMAS ---
const AddressSchema = z.object({
  address_line_1: z.string().optional(),
  city: z.string().optional(),
  // Add other fields if needed, but keep it loose for now if data varies
}).or(z.string()); // Handle case where address might be a JSON string or object

// --- 1. NEXT DELIVERY SCHEMA ---
export const NextDeliverySchema = z.object({
  delivery_id: z.number().optional(),
  // Make date optional or nullable because sometimes there is no next delivery
  delivery_date: z.string().nullable().optional(), 
  delivery_slot: z.string().nullable().optional(),
  status: z.string().optional(),
  meal_type: z.string().optional(),
  product_name: z.string().optional(),
  image_url: z.string().nullable().optional(),
  items_description: z.string().nullable().optional(),
  delivery_address: z.any().optional(), // Loosen strictness for now
});

// --- 2. SUBSCRIPTION SCHEMA ---
export const SubscriptionSchema = z.object({
  id: z.number().or(z.string()), // Handle ID being int or string
  booking_item_id: z.number().optional(),
  product_name: z.string(),
  plan_name: z.string().nullable().optional(),
  meal_type: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  
  // Stats
  remaining_meals: z.union([z.string(), z.number()]).transform((val) => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ), // Auto-convert string numbers to real numbers
  
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  
  delivery_address: AddressSchema.optional().nullable(),
});

// --- 3. ORDER HISTORY SCHEMA ---
export const OrderHistorySchema = z.object({
  id: z.string().or(z.number()),
  created_at: z.string(),
  total_amount: z.union([z.string(), z.number()]),
  payment_method: z.string().nullable().optional(),
  payment_status: z.string(),
  uiStatus: z.string().optional(), // We add this in the frontend logic
  items: z.array(z.any()).optional(), // Define stricter if needed later
});

// --- 4. DASHBOARD STATS SCHEMA ---
export const DashboardStatsSchema = z.object({
  activePlans: z.number(),
  mealsLeft: z.number(),
  upcomingDeliveries: z.number(),
});