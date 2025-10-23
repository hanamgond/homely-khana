'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Package, User, MapPin, CalendarDays, Check, Truck, X, CreditCard } from 'lucide-react';
import { format } from "date-fns";
import Image from 'next/image';
import { toast } from 'sonner'; // --- THIS IS THE FIX: Added missing import ---

// --- Helper Functions ---
const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;
const formatDate = (dateString, formatStr = "PPP p") => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return format(date, formatStr);
    } catch (e) { return 'Invalid Date'; }
};
const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed': return 'success';
        case 'pending': return 'secondary';
        case 'failed': return 'destructive';
        case 'refunded': return 'outline';
        default: return 'secondary';
    }
};
const getDeliveryStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
        case 'delivered': return 'success';
        case 'scheduled': return 'secondary';
        case 'out_for_delivery': return 'default';
        case 'cancelled': return 'destructive';
        case 'skipped': return 'outline';
        default: return 'secondary';
    }
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- Fetch Booking Details ---
  const fetchBookingDetails = useCallback(async () => {
    if (!token || !bookingId) { setIsLoading(false); setError("ID/Auth missing."); return; }
    setIsLoading(true); setError(null);
    const apiClient = createApiClient(token);
    try {
      const response = await apiClient(`/admin/bookings/${bookingId}`);
      if (response.success && response.data) {
        setBooking(response.data);
      } else {
        setError(response.error || `Booking not found.`);
        toast.error(response.error || `Booking not found.`); // This line needs toast
        setBooking(null);
      }
    } catch (err) {
      console.error("Fetch Booking Details Err:", err);
      setError(err.message || "Failed to load booking.");
      toast.error(err.message || "Failed to load booking."); // This line needs toast
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, bookingId]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  // --- Action Handlers (Placeholders) ---
  const handleUpdateDeliveryStatus = (deliveryId, newStatus) => { alert(`Update ${deliveryId} to ${newStatus} (TBD)`); };
  const handleMarkAsPaid = async () => { alert(`Mark ${bookingId} as paid (TBD)`); };

  // --- Render Loading / Error States ---
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading booking details...</span>
        </div>
    );
  }
  if (error) {
    return (
        <div className="flex flex-col items-center gap-4 p-6 text-center max-w-xl mx-auto">
             <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit self-start mb-4"><ArrowLeft className="h-4 w-4" /> Back to Orders</Link>
            <Card className="w-full">
                <CardHeader><CardTitle className="text-destructive">Error Loading Booking</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{error}</p></CardContent>
                <CardFooter><Button variant="outline" asChild><Link href="/orders">Go Back</Link></Button></CardFooter>
            </Card>
        </div>
    );
  }
  if (!booking) {
     return (
        <div className="flex flex-col items-center gap-4 p-6 text-center max-w-xl mx-auto">
             <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit self-start mb-4"><ArrowLeft className="h-4 w-4" /> Back to Orders</Link>
            <Card className="w-full">
                <CardHeader><CardTitle>Booking Not Found</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">The requested booking data could not be found.</p></CardContent>
                <CardFooter><Button variant="outline" asChild><Link href="/orders">Go Back</Link></Button></CardFooter>
            </Card>
        </div>
     );
  }
  
  // --- Render Booking Details ---
  const address = booking.delivery_address_snapshot || {};

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>
      <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4">
              <div>
                 <CardTitle className="text-xl md:text-2xl font-bold">Order #{booking.id.split('-')[0].toUpperCase()}</CardTitle>
                 <CardDescription>Placed on: {formatDate(booking.created_at)}</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                 <Badge variant={getStatusVariant(booking.payment_status)} className="capitalize text-sm px-3 py-1">{booking.payment_status}</Badge>
                 <Badge variant="outline" className="capitalize text-sm px-3 py-1">{booking.payment_method}</Badge>
                 {booking.payment_method === 'cod' && booking.payment_status === 'pending' && (
                     <Button size="sm" onClick={handleMarkAsPaid} disabled={isUpdatingStatus}>
                        {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Mark as Paid
                    </Button>
                 )}
              </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><User className="h-5 w-5"/>Customer</h3>
                  <div className="text-sm space-y-1">
                      <p><span className="font-medium text-foreground">{booking.customer_name}</span></p>
                      <p className="text-muted-foreground">{booking.customer_email}</p>
                      <p className="text-muted-foreground">{booking.customer_phone}</p>
                  </div>
              </div>
              {address.id && (
                 <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><MapPin className="h-5 w-5"/>Delivery Address</h3>
                      <div className="text-sm space-y-1">
                         <p><strong>{address.full_name}</strong> ({address.type})</p>
                         <p>{address.phone}</p>
                         <p>{address.address_line_1}</p>
                         {address.address_line_2 && <p>{address.address_line_2}</p>}
                         <p>{address.city}, {address.state} - {address.pincode}</p>
                         {address.landmark && <p className="text-muted-foreground">Landmark: {address.landmark}</p>}
                      </div>
                  </div>
              )}
          </CardContent>
          <CardFooter className="border-t pt-4 text-right flex flex-col items-end">
                <p className="text-sm font-medium text-foreground">Total Amount:</p>
                <p className="text-xl font-bold">{formatCurrency(booking.total_amount)}</p>
          </CardFooter>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/>Items Ordered</CardTitle></CardHeader>
        <CardContent className="p-0">
           <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Plan</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
            <TableBody>
              {booking.items?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No items found.</TableCell></TableRow>}
              {booking.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Image src={item.product_image_url || '/placeholder.png'} alt={item.product_name || 'Item'} width={40} height={40} className="rounded-md object-cover border"/>
                        <span className="font-medium">{item.product_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{item.plan_name || 'One-time'}</TableCell>
                  <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
         <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5"/>Delivery Schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
           <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Slot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {booking.deliveries?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No deliveries found.</TableCell></TableRow>}
              {booking.deliveries?.map(delivery => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{formatDate(delivery.delivery_date, "EEE, dd MMM yyyy")}</TableCell>
                  <TableCell className="capitalize">{delivery.meal_type || delivery.delivery_slot}</TableCell>
                  <TableCell>
                     <Badge variant={getDeliveryStatusVariant(delivery.status)} className="capitalize text-xs">
                       {delivery.status.replace(/_/g, ' ')}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                      {delivery.status === 'scheduled' && <Button variant="outline" size="xs" onClick={() => handleUpdateDeliveryStatus(delivery.id, 'out_for_delivery')} disabled={isUpdatingStatus}><Truck className="h-4 w-4 mr-1"/>Out for Delivery</Button>}
                      {delivery.status === 'out_for_delivery' && <Button variant="outline" size="xs" onClick={() => handleUpdateDeliveryStatus(delivery.id, 'delivered')} disabled={isUpdatingStatus}><Check className="h-4 w-4 mr-1 text-green-600"/>Delivered</Button>}
                      {(delivery.status === 'scheduled' || delivery.status === 'out_for_delivery') && <Button variant="outline" size="xs" className="ml-1 text-red-600 border-red-600 hover:bg-red-50/50" onClick={() => handleUpdateDeliveryStatus(delivery.id, 'cancelled')} disabled={isUpdatingStatus}><X className="h-4 w-4 mr-1"/>Cancel</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}