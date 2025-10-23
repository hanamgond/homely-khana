'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";

// --- Helper Functions ---
const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;
const getStatusVariant = (isActive) => isActive ? 'success' : 'secondary'; // Ensure 'success' variant is defined

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const productId = params.productId;

  // Product Data State
  const [productTypes, setProductTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', imageUrl: '', basePrice: '0.00',
    bookingType: 'subscription', productTypeId: '', isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false); // For Save Product button
  const [isDataLoading, setIsDataLoading] = useState(true); // For initial product fetch
  const [error, setError] = useState(null); // For fetch errors

  // Plans Data State
  const [plans, setPlans] = useState([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);

  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // Plan object if editing, null if adding
  const [planFormData, setPlanFormData] = useState({
      planName: '', description: '', price: '0.00', durationDays: '',
      mealsPerDay: '1', isActive: true, sortOrder: '0'
  });
  const [isPlanSaving, setIsPlanSaving] = useState(false); // Loading state for modal save button

  // --- Data Fetching ---

  // Fetch Product Types (runs once)
  useEffect(() => {
    if (token) {
      const apiClient = createApiClient(token);
      const fetchTypes = async () => {
        try {
          const response = await apiClient('/admin/product-types');
          if (response.success && response.data) setProductTypes(response.data);
          else console.error("Failed to fetch product types:", response.error);
        } catch (err) { console.error("Error fetching types:", err); }
      };
      fetchTypes();
    }
  }, [token]);

  // Fetch Existing Product Data (runs once or if productId changes)
  const fetchProductData = useCallback(async () => {
    if (!token || !productId) { setIsDataLoading(false); setError("ID/Auth missing."); return; }
    setIsDataLoading(true); setError(null);
    const apiClient = createApiClient(token);
    try {
      const response = await apiClient(`/admin/products/${productId}`);
      if (response.success && response.data) {
        setFormData({
            name: response.data.name || '',
            description: response.data.description || '',
            imageUrl: response.data.image_url || '',
            basePrice: (parseFloat(response.data.base_price) || 0).toFixed(2),
            bookingType: response.data.booking_type || 'subscription',
            productTypeId: response.data.product_type_id?.toString() || '',
            isActive: response.data.is_active ?? true,
        });
      } else { setError(response.error || `Product not found.`); toast.error(response.error || `Product not found.`); }
    } catch (err) { console.error("Fetch Prod Err:", err); setError(err.message || "Failed."); toast.error(err.message || "Failed."); }
    finally { setIsDataLoading(false); }
  }, [token, productId]);
  useEffect(() => { fetchProductData(); }, [fetchProductData]);

  // Fetch Subscription Plans for this Product
  const fetchPlans = useCallback(async () => {
    if (!token || !productId) return;
    setIsPlansLoading(true);
    const apiClient = createApiClient(token);
    try {
      const response = await apiClient(`/admin/products/${productId}/plans`);
      if (response.success && response.data) setPlans(response.data);
      else { console.error("Failed plans:", response.error); setPlans([]); } // Clear plans on error
    } catch (err) { console.error("Fetch Plans Err:", err); setPlans([]); } // Clear plans on error
    finally { setIsPlansLoading(false); }
  }, [token, productId]);
  // Fetch plans AFTER product data has finished loading
  useEffect(() => { if (!isDataLoading) fetchPlans(); }, [isDataLoading, fetchPlans]);

  // --- Form Handlers ---
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
  const handleSwitchChange = (checked) => setFormData(prev => ({ ...prev, isActive: checked }));
  const handlePlanFormChange = (e) => setPlanFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePlanSwitchChange = (checked) => setPlanFormData(prev => ({ ...prev, isActive: checked }));

  // --- Product Form Submit (Update) ---
  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!token || !productId || isLoading) return;
      if (!formData.name || !formData.bookingType || !formData.productTypeId || isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) < 0) {
          toast.error('Please fill all required product fields correctly.'); return;
      }
      setIsLoading(true);
      const apiClient = createApiClient(token);
      try {
         const payload = {
             name: formData.name.trim(),
             description: formData.description.trim() || null,
             imageUrl: formData.imageUrl.trim() || null,
             basePrice: parseFloat(formData.basePrice),
             bookingType: formData.bookingType,
             productTypeId: parseInt(formData.productTypeId),
             isActive: formData.isActive,
        };
        const response = await apiClient(`/admin/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (response.success) { toast.success(response.message || 'Product updated!'); router.push('/products'); }
        else { toast.error(response.error || 'Failed to update product.'); }
      } catch (err) { console.error("Update Product Err:", err); toast.error(err.message || 'Error updating product.'); }
      finally { setIsLoading(false); }
  };

  // --- Plan Modal Actions ---
  const openAddPlanModal = () => {
      setEditingPlan(null);
      setPlanFormData({ planName: '', description: '', price: '0.00', durationDays: '', mealsPerDay: '1', isActive: true, sortOrder: '0' });
      setIsPlanModalOpen(true);
  };
  const openEditPlanModal = (plan) => {
      setEditingPlan(plan);
      setPlanFormData({
          planName: plan.plan_name || '', description: plan.description || '',
          price: (plan.price ?? 0).toFixed(2), // Ensure price is formatted
          durationDays: plan.duration_days?.toString() || '',
          mealsPerDay: plan.meals_per_day?.toString() || '1',
          isActive: plan.is_active ?? true, sortOrder: plan.sort_order?.toString() || '0'
      });
      setIsPlanModalOpen(true);
  };
  const handlePlanFormSubmit = async (e) => {
      e.preventDefault();
      if (!token || !productId || isPlanSaving) return;
      const { planName, price, durationDays, mealsPerDay } = planFormData;
      // Robust Validation
      if (!planName.trim() || isNaN(parseFloat(price)) || parseFloat(price) < 0 || !durationDays || isNaN(parseInt(durationDays)) || parseInt(durationDays) <= 0 || !mealsPerDay || isNaN(parseInt(mealsPerDay)) || parseInt(mealsPerDay) <= 0) {
          toast.error("Please ensure Plan Name, Price (>0), Duration (>0 days), and Meals/Day (>0) are valid numbers."); return;
      }
      setIsPlanSaving(true);
      const apiClient = createApiClient(token);
      const isEditing = !!editingPlan;
      const url = isEditing ? `/admin/plans/${editingPlan.id}` : `/admin/products/${productId}/plans`;
      const method = isEditing ? 'PUT' : 'POST';
      try {
           const payload = {
                planName: planFormData.planName.trim(),
                description: planFormData.description.trim() || null,
                price: parseFloat(planFormData.price),
                durationDays: parseInt(planFormData.durationDays),
                mealsPerDay: parseInt(planFormData.mealsPerDay),
                isActive: planFormData.isActive,
                sortOrder: parseInt(planFormData.sortOrder) || 0
            };
            const response = await apiClient(url, { method, body: JSON.stringify(payload) });
            if (response.success) {
                toast.success(response.message || `Plan ${isEditing ? 'updated' : 'added'}!`);
                setIsPlanModalOpen(false); // Close modal
                fetchPlans(); // Refresh the list
            } else { toast.error(response.error || `Failed to save plan.`); }
      } catch (err) { console.error("Save Plan Err:", err); toast.error(err.message || `Error saving plan.`); }
      finally { setIsPlanSaving(false); }
  };
   const handleDeletePlan = async (planId) => {
       if (!token || !planId || !confirm(`ARE YOU SURE?\nDeleting this plan cannot be undone and might affect past order records.`)) return;
       const apiClient = createApiClient(token);
       toast.promise( apiClient(`/admin/plans/${planId}`, { method: 'DELETE' }), {
           loading: 'Deleting plan...',
           success: (res) => { if (res.success) { fetchPlans(); return res.message || 'Plan deleted!'; } else throw new Error(res.error); },
           error: (err) => err.message || 'Error deleting plan.',
       });
   };

  // --- Pre-map Plans Table Rows ---
   const planTableRows = !isPlansLoading && plans.length > 0
    ? plans.map(plan => (
        <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.plan_name}</TableCell>
            <TableCell>{formatCurrency(plan.price)}</TableCell>
            <TableCell>{plan.duration_days} days</TableCell>
            <TableCell className="hidden sm:table-cell">{plan.meals_per_day}</TableCell>
            <TableCell>
                <Badge variant={getStatusVariant(plan.is_active)} className="text-xs">
                    {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => openEditPlanModal(plan)} disabled={isPlanSaving}>
                    <Edit className="h-4 w-4" /> <span className="sr-only">Edit Plan</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeletePlan(plan.id)} disabled={isPlanSaving}>
                    <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete Plan</span>
                </Button>
            </TableCell>
        </TableRow>
      ))
    : null;

  // --- RENDER ---

  // Handle initial loading state for the product data
  if (isDataLoading) {
    return (
        <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading product data...</span>
        </div>
    );
  }

  // Handle error state if product data failed to load
   if (error) {
    return (
        <div className="flex flex-col items-center gap-4 p-6 text-center max-w-xl mx-auto">
             <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit self-start mb-4">
                <ArrowLeft className="h-4 w-4" /> Back to Products
            </Link>
            <Card className="w-full">
                <CardHeader><CardTitle className="text-destructive">Error Loading Product</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{error}</p></CardContent>
                <CardFooter><Button variant="outline" asChild><Link href="/products">Go Back</Link></Button></CardFooter>
            </Card>
        </div>
    );
  }

  // --- Render Form if product data loaded successfully ---
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      {/* Product Edit Form Card */}
      <form onSubmit={handleSubmit}>
        <Card>
           <CardHeader>
             <CardTitle>Edit Product</CardTitle>
             <CardDescription>Update &quot;{formData.name || 'this product'}&quot;.</CardDescription>
           </CardHeader>
           <CardContent className="grid gap-6">
             <div className="grid gap-2"><Label htmlFor="name">Name *</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} /></div>
             <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} disabled={isLoading} /></div>
             <div className="grid gap-2"><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} disabled={isLoading} placeholder="/img.jpg or https://..."/><p className="text-xs text-muted-foreground">Path or URL.</p></div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2"><Label htmlFor="basePrice">Price (₹) *</Label><Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" value={formData.basePrice} onChange={handleChange} required disabled={isLoading} /></div>
                <div className="grid gap-2">
                  <Label htmlFor="productTypeId">Type *</Label>
                  <Select name="productTypeId" value={formData.productTypeId || ""} onValueChange={(value) => handleSelectChange('productTypeId', value)} required disabled={isLoading || productTypes.length === 0}>
                    <SelectTrigger id="productTypeId"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {productTypes.length === 0 && <SelectItem value="" disabled>Loading...</SelectItem>}
                      {productTypes.map(type => (<SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bookingType">Booking *</Label>
                   <Select name="bookingType" value={formData.bookingType} onValueChange={(value) => handleSelectChange('bookingType', value)} required disabled={isLoading}>
                    <SelectTrigger id="bookingType"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>
             <div className="flex items-center space-x-2 pt-2"><Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} disabled={isLoading} /><Label htmlFor="isActive">Active</Label></div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
             <Button type="button" variant="outline" asChild disabled={isLoading}><Link href="/products">Cancel</Link></Button>
             <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </CardFooter>
        </Card>
      </form>

      {/* Manage Plans Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Manage Subscription Plans</CardTitle><CardDescription>Add or edit plans for this product.</CardDescription></div>
            <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogTrigger asChild><Button size="sm" onClick={openAddPlanModal} disabled={isLoading}><PlusCircle className="h-4 w-4 mr-2" /> Add Plan</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[480px]"> {/* Slightly wider modal */}
                    <DialogHeader><DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle><DialogDescription>{editingPlan ? `Update details for ${editingPlan.plan_name}.` : 'Enter new plan details.'}</DialogDescription></DialogHeader>
                    <form id="plan-form" onSubmit={handlePlanFormSubmit} className="grid gap-4 py-4">
                         {/* Plan form fields... */}
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="planName" className="text-right">Name *</Label><Input id="planName" name="planName" value={planFormData.planName} onChange={handlePlanFormChange} className="col-span-3" required disabled={isPlanSaving}/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" name="description" value={planFormData.description} onChange={handlePlanFormChange} className="col-span-3" rows={2} disabled={isPlanSaving}/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="price" className="text-right">Price (₹) *</Label><Input id="price" name="price" type="number" step="0.01" min="0" value={planFormData.price} onChange={handlePlanFormChange} className="col-span-3" required disabled={isPlanSaving}/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="durationDays" className="text-right">Duration *</Label><div className="col-span-3 flex items-center gap-2"><Input id="durationDays" name="durationDays" type="number" min="1" value={planFormData.durationDays} onChange={handlePlanFormChange} required disabled={isPlanSaving}/><span className="text-sm text-muted-foreground">days</span></div></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="mealsPerDay" className="text-right">Meals/Day *</Label><Input id="mealsPerDay" name="mealsPerDay" type="number" min="1" value={planFormData.mealsPerDay} onChange={handlePlanFormChange} className="col-span-3" required disabled={isPlanSaving}/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="sortOrder" className="text-right">Sort Order</Label><Input id="sortOrder" name="sortOrder" type="number" min="0" value={planFormData.sortOrder} onChange={handlePlanFormChange} className="col-span-3" disabled={isPlanSaving} placeholder="0"/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="planIsActive" className="text-right">Active</Label><Switch id="planIsActive" checked={planFormData.isActive} onCheckedChange={handlePlanSwitchChange} className="col-span-3 justify-self-start" disabled={isPlanSaving}/></div>
                    </form>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isPlanSaving}>Cancel</Button></DialogClose>
                        <Button type="submit" form="plan-form" disabled={isPlanSaving}>{isPlanSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isPlanSaving ? 'Saving...' : (editingPlan ? 'Save Changes' : 'Add Plan')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            {isPlansLoading && <p className="text-muted-foreground text-center py-4">Loading plans...</p>}
            {!isPlansLoading && plans.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No subscription plans added yet. Click &quot;Add Plan&quot; to create one.</p>}
            {/* Render plans table only if rows exist */}
            {!isPlansLoading && planTableRows && (
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Duration</TableHead><TableHead className="hidden sm:table-cell">Meals/Day</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>{planTableRows}</TableBody> {/* Render the pre-mapped array */}
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
