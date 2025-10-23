'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Reusing for consistency, maybe simple buttons later
import { MoreHorizontal, ThumbsUp, Trash2, Star, StarHalf } from "lucide-react"; // Icons
import { toast } from 'sonner';
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import confirmation dialog
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // For status filter
import { Label } from "@/components/ui/label";

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return format(date, "dd MMM yyyy, p"); // Include time
    } catch (e) { return 'Invalid Date'; }
};

// Simple Star Rating Component
const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center text-amber-400">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 fill-current" />)}
            {halfStar && <StarHalf key="half" className="h-4 w-4 fill-current" />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300 fill-current" />)}
             <span className="ml-1 text-xs text-muted-foreground">({rating?.toFixed(1)})</span>
        </div>
    );
};

// --- Reviews Page Component ---
export default function ReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(''); // '', 'pending', 'approved'

  // --- Fetch Reviews ---
  const fetchReviews = useCallback(async () => {
    if (!token) { setIsLoading(false); setError("Not authenticated."); return; }

    const apiClient = createApiClient(token);
    setIsLoading(true);
    setError(null);
    let url = '/admin/reviews';
    if (statusFilter) {
        url += `?status=${statusFilter}`;
    }

    try {
      const response = await apiClient(url);
      if (response.success && response.data) {
        setReviews(response.data);
      } else {
        setError(response.error || 'Failed to fetch reviews');
        setReviews([]);
      }
    } catch (err) {
      console.error("Fetch Reviews Error:", err);
      setError(err.message || "An error occurred.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter]); // Refetch when filter changes

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]); // Fetch on mount and filter change

  // --- Action Handlers ---
  const handleApprove = (reviewId) => {
    if (!token || !reviewId) return;
    const apiClient = createApiClient(token);
    toast.promise(
        apiClient(`/admin/reviews/${reviewId}/approve`, { method: 'PUT' }),
        {
            loading: 'Approving review...',
            success: (res) => {
                if (res.success) { fetchReviews(); return res.message || 'Approved!'; }
                else throw new Error(res.error);
            },
            error: (err) => err.message || 'Error approving.',
        }
    );
  };

  const handleDelete = (reviewId) => {
     if (!token || !reviewId) return;
     // Confirmation is handled by AlertDialog
     const apiClient = createApiClient(token);
     toast.promise(
        apiClient(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),
        {
            loading: 'Deleting review...',
            success: (res) => {
                 if (res.success) { fetchReviews(); return res.message || 'Deleted!'; }
                 else throw new Error(res.error);
            },
            error: (err) => err.message || 'Error deleting.',
        }
    );
  };


  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header */}
      <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Review Management</h1>
          <p className="text-sm text-muted-foreground">Approve or delete customer feedback.</p>
      </div>

      {/* 2. Filter Controls */}
       <RadioGroup defaultValue="" value={statusFilter} onValueChange={setStatusFilter} className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2"><RadioGroupItem value="" id="r-all" /><Label htmlFor="r-all">All Reviews</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="pending" id="r-pending" /><Label htmlFor="r-pending">Pending</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="approved" id="r-approved" /><Label htmlFor="r-approved">Approved</Label></div>
      </RadioGroup>

      {/* 3. Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading reviews...' : `${reviews.length} reviews found.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading && <p className="text-muted-foreground text-center p-6">Loading...</p>}
           {error && <p className="text-red-600 text-center p-6">Error: {error}</p>}
           {!isLoading && !error && reviews.length === 0 && (
            <p className="text-muted-foreground text-center p-6">No reviews found matching filter.</p>
           )}
           {!isLoading && !error && reviews.length > 0 && (
            <div className="overflow-x-auto relative border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Customer</TableHead>
                    <TableHead className="w-[150px]">Product</TableHead>
                    <TableHead className="w-[100px]">Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-muted/50 align-top"> {/* Align top */}
                      <TableCell className="font-medium text-sm">{review.user_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{review.product_name || 'N/A'}</TableCell>
                      <TableCell><StarRating rating={review.rating} /></TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">{review.comment || '-'}</TableCell> {/* Allow wrapping */}
                      <TableCell className="text-xs text-muted-foreground">{formatDate(review.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {!review.is_approved && (
                            <Button variant="outline" size="xs" className="mr-1 text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleApprove(review.id)}>
                                <ThumbsUp className="h-3 w-3 mr-1"/> Approve
                            </Button>
                        )}
                        {/* Delete Button with Confirmation */}
                        <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="outline" size="xs" className="text-red-600 border-red-600 hover:bg-red-50">
                                <Trash2 className="h-3 w-3 mr-1"/> Delete
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 This action cannot be undone. This will permanently delete the review.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               {/* Action calls the actual delete handler */}
                               <AlertDialogAction onClick={() => handleDelete(review.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
           )}
        </CardContent>
         {/* Add Pagination later if needed */}
      </Card>
    </div>
  );
}