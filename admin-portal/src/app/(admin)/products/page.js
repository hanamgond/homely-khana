'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from 'next/image';

// --- Helper Functions ---
const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        // Format to just Date for brevity in table
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};
const getStatusVariant = (isActive) => isActive ? 'success' : 'secondary'; // Ensure 'success' variant is defined

export default function ProductsPage() {
  const router = useRouter(); // Initialize router
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Products ---
  const fetchProducts = useCallback(async () => {
    if (!token) { setIsLoading(false); setError("Not authenticated."); return; }
    const apiClient = createApiClient(token);
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient('/admin/products');
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (err) {
      console.error("Fetch Products Error:", err);
      setError(err.message || "An error occurred.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Handlers ---
  const handleAddProduct = () => {
    router.push('/products/new'); // Navigate to the Add Product page
  };

  // --- UPDATED: Navigate to Edit Page ---
  const handleEditProduct = (productId) => {
    router.push(`/products/${productId}/edit`); // Navigate to the dynamic edit page
  };
  // --- END UPDATE ---

  // Placeholder alert handlers (with ESLint disable comments if needed)
  // eslint-disable-next-line react/no-unescaped-entities
  const handleDeleteProduct = (productId) => { alert(`Confirm and Delete Product ${productId} - to be implemented`); };
  const handleManagePlans = (productId) => { alert(`Manage Plans for ${productId} - to be implemented`); };


  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, and manage your meal offerings.</p>
        </div>
        <Button size="sm" onClick={handleAddProduct}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* 2. Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Meals & Offerings</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading products...' : `${products.length} products found.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading && <p className="text-muted-foreground text-center p-6">Loading...</p>}
           {error && <p className="text-red-600 text-center p-6">Error: {error}</p>}
           {!isLoading && !error && products.length === 0 && (
            <p className="text-muted-foreground text-center p-6">
              No products found. Click &quot;Add Product&quot; to create one.
            </p>
           )}
           {!isLoading && !error && products.length > 0 && (
            <div className="overflow-x-auto relative border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Booking</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Base Price</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell className="p-1 md:p-2">
                        <Image
                            alt={product.name || 'Product Image'}
                            className="aspect-square rounded-md object-cover"
                            src={product.image_url || '/placeholder.png'}
                            width={56}
                            height={56}
                            onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                            unoptimized
                           />
                      </TableCell>
                      <TableCell className="font-medium">{product.name || 'N/A'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{product.product_type_name || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell capitalize">{product.booking_type || 'N/A'}</TableCell>
                      <TableCell className="text-right hidden lg:table-cell">{formatCurrency(product.base_price)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(product.is_active)} className="text-xs">
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                               <MoreHorizontal className="h-4 w-4" />
                               <span className="sr-only">Actions</span>
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem onSelect={() => handleEditProduct(product.id)}>
                               Edit Product
                             </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => handleManagePlans(product.id)}>
                               Manage Plans
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem
                               onSelect={() => handleDeleteProduct(product.id)}
                               className="text-red-600 focus:text-red-600 focus:bg-red-50/50 dark:focus:bg-red-900/50"
                             >
                               Delete
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}