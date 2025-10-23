'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AddProductPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [productTypes, setProductTypes] = useState([]); // To store fetched product types
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    basePrice: '0.00',
    bookingType: 'subscription', // Default to subscription
    productTypeId: '', // Will be selected from dropdown
    isActive: true, // Default to active
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTypesLoading, setIsTypesLoading] = useState(true);

  // Fetch product types for the dropdown
  useEffect(() => {
    if (token) {
      const apiClient = createApiClient(token);
      const fetchTypes = async () => {
        setIsTypesLoading(true);
        try {
          const response = await apiClient('/admin/product-types');
          if (response.success && response.data) {
            setProductTypes(response.data);
            // Auto-select the first type if available
            if (response.data.length > 0 && !formData.productTypeId) {
               setFormData(prev => ({ ...prev, productTypeId: response.data[0].id.toString() }));
            }
          } else {
            toast.error(response.error || 'Failed to fetch product types.');
          }
        } catch (err) {
          toast.error(err.message || 'Error fetching product types.');
        } finally {
          setIsTypesLoading(false);
        }
      };
      fetchTypes();
    } else {
        setIsTypesLoading(false); // Don't load if no token
    }
    // Only depend on token for re-fetching
  }, [token]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Select component changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Switch component changes
  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      return;
    }
    // Basic frontend validation
    if (!formData.name || !formData.bookingType || !formData.productTypeId) {
        toast.error('Product Name, Booking Type, and Product Type are required.');
        return;
    }
     if (isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) < 0) {
        toast.error('Base Price must be a valid number (0 or greater).');
        return;
    }

    setIsLoading(true);
    const apiClient = createApiClient(token);

    try {
      // Prepare data payload matching backend expectations
      const payload = {
           name: formData.name,
           description: formData.description || null, // Send null if empty
           imageUrl: formData.imageUrl || null, // Send null if empty
           basePrice: parseFloat(formData.basePrice), // Send as number
           bookingType: formData.bookingType,
           productTypeId: parseInt(formData.productTypeId), // Send as integer
           isActive: formData.isActive,
      };

      const response = await apiClient('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.success) {
        toast.success(response.message || 'Product created successfully!');
        router.push('/products'); // Redirect back to the product list on success
      } else {
        // Display backend validation errors or generic message
        toast.error(response.error || 'Failed to create product.');
      }
    } catch (err) {
      console.error("Add Product Error:", err);
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto"> {/* Centered layout */}
      {/* Back Link */}
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>
              Fill in the details for the new meal offering. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6"> {/* Grid layout for form fields */}
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Homely Veg Thali"
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter a brief description of the meal..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Image URL */}
             <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="/meal5.jpg or https://..."
                disabled={isLoading}
              />
               <p className="text-xs text-muted-foreground">
                 Enter a relative path (e.g., /meal5.jpg) if image is in `public` folder, or a full URL.
               </p>
            </div>

            {/* Row for Price, Type, Booking Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {/* Base Price */}
                <div className="grid gap-2">
                  <Label htmlFor="basePrice">Base Price (₹) *</Label>
                  <Input
                    id="basePrice"
                    name="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

               {/* Product Type */}
                <div className="grid gap-2">
                  <Label htmlFor="productTypeId">Product Type *</Label>
                  <Select
                    name="productTypeId"
                    value={formData.productTypeId}
                    onValueChange={(value) => handleSelectChange('productTypeId', value)}
                    required
                    disabled={isTypesLoading || isLoading}
                  >
                    <SelectTrigger id="productTypeId">
                      <SelectValue placeholder={isTypesLoading ? "Loading..." : "Select type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!isTypesLoading && productTypes.length === 0 && <SelectItem value="" disabled>No types found</SelectItem>}
                      {productTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Type */}
                <div className="grid gap-2">
                  <Label htmlFor="bookingType">Booking Type *</Label>
                   <Select
                     name="bookingType"
                     value={formData.bookingType}
                     onValueChange={(value) => handleSelectChange('bookingType', value)}
                     required
                     disabled={isLoading}
                   >
                    <SelectTrigger id="bookingType">
                      <SelectValue placeholder="Select booking type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            {/* Is Active Switch */}
             <div className="flex items-center space-x-2 pt-2"> {/* Added padding top */}
               <Switch
                 id="isActive"
                 checked={formData.isActive}
                 onCheckedChange={handleSwitchChange}
                 disabled={isLoading}
               />
               <Label htmlFor="isActive">Active (Visible to customers)</Label>
             </div>

          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
             <Button type="button" variant="outline" asChild disabled={isLoading}>
                <Link href="/products">Cancel</Link>
             </Button>
             <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Product'}
             </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
