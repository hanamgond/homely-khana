'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { format } from "date-fns";
import Image from 'next/image';
import { cn } from "@/lib/utils";

// Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    ArrowLeft, Loader2, Package, User, MapPin, CalendarDays, 
    Check, Truck, X, CreditCard, Mail, Phone, Calendar as CalendarIcon 
} from 'lucide-react';

// --- Helpers ---
const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;
const formatDate = (dateStr) => {
    if(!dateStr) return 'N/A';
    try { return format(new Date(dateStr), "PPP p"); } catch(e) { return 'Invalid'; }
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { bookingId } = useParams();
  const { token } = useAuth();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null); // Track specific button loading

  const fetchBookingDetails = useCallback(async () => {
    if (!token || !bookingId) return;
    const apiClient = createApiClient(token);
    try {
      const response = await apiClient(`/admin/bookings/${bookingId}`);
      if (response.success && response.data) setBooking(response.data);
      else toast.error(response.error || "Booking not found");
    } catch (err) {
      toast.error("Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  }, [token, bookingId]);

  useEffect(() => { fetchBookingDetails(); }, [fetchBookingDetails]);

  const handleUpdateStatus = async (deliveryId, newStatus) => {
      setUpdatingId(deliveryId);
      // Simulate API Call
      await new Promise(r => setTimeout(r, 1000));
      toast.success(`Delivery status updated to ${newStatus.replace('_', ' ')}`);
      setUpdatingId(null);
      // In real app, re-fetch booking details here
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!booking) return <div className="p-8 text-center text-muted-foreground">Booking not found.</div>;

  const address = booking.delivery_address_snapshot || {};

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto p-6 pb-20">
      
      {/* 1. Top Navigation & Title */}
      <div className="flex flex-col gap-2">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    Order #{booking.id.split('-')[0].toUpperCase()}
                    <Badge variant={booking.payment_status === 'completed' ? 'default' : 'secondary'} className="text-sm capitalize px-3">
                        {booking.payment_status}
                    </Badge>
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Placed on {formatDate(booking.created_at)}
                </p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Mail className="h-4 w-4 mr-2"/> Email Customer</Button>
                <Button variant="default">Download Invoice</Button>
            </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
        {/* --- LEFT COLUMN (2/3): Items & Schedule --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Order Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-primary"/> Order Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Product</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right pr-6">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {booking.items?.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-muted rounded-md border relative overflow-hidden">
                                                 <Image src={item.product_image_url || '/placeholder.png'} alt="Product" fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.product_name}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{item.plan_name}</TableCell>
                                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                    <TableCell className="text-right pr-6 font-medium">{formatCurrency(item.total_price)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delivery Schedule (Timeline Style) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-primary"/> Delivery Schedule</CardTitle>
                    <CardDescription>Manage daily deliveries for this subscription.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {booking.deliveries?.map((delivery, index) => (
                            <div key={delivery.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm", 
                                        delivery.status === 'delivered' ? "bg-green-100 text-green-700" :
                                        delivery.status === 'cancelled' ? "bg-red-100 text-red-700" : 
                                        "bg-secondary text-secondary-foreground"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{format(new Date(delivery.delivery_date), "EEEE, MMM do")}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="capitalize">{delivery.meal_type || 'Meal'}</span>
                                            <span>•</span>
                                            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", 
                                                delivery.status === 'delivered' ? "border-green-200 text-green-700" : ""
                                            )}>
                                                {delivery.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    {delivery.status === 'scheduled' && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(delivery.id, 'out_for_delivery')} disabled={!!updatingId}>
                                                {updatingId === delivery.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Truck className="h-3 w-3 mr-2"/>}
                                                Dispatch
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(delivery.id, 'cancelled')} disabled={!!updatingId}>
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                    {delivery.status === 'out_for_delivery' && (
                                         <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(delivery.id, 'delivered')} disabled={!!updatingId}>
                                            <Check className="h-3 w-3 mr-2"/> Mark Delivered
                                        </Button>
                                    )}
                                    {delivery.status === 'delivered' && <span className="text-sm font-medium text-green-600 flex items-center"><Check className="h-4 w-4 mr-1"/> Completed</span>}
                                    {delivery.status === 'cancelled' && <span className="text-sm font-medium text-red-600 flex items-center"><X className="h-4 w-4 mr-1"/> Cancelled</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* --- RIGHT COLUMN (1/3): Customer & Payment Info --- */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Customer Details */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><User className="h-4 w-4"/> Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {booking.customer_name?.[0]}
                        </div>
                        <div>
                            <p className="font-medium">{booking.customer_name}</p>
                            <p className="text-xs text-muted-foreground">Registered User</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4"/> <span>{booking.customer_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4"/> <span>{booking.customer_phone}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><MapPin className="h-4 w-4"/> Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    {address.id ? (
                        <>
                            <p className="font-medium">{address.full_name} <span className="text-xs font-normal text-muted-foreground">({address.type})</span></p>
                            <p className="text-muted-foreground">{address.address_line_1}</p>
                            {address.address_line_2 && <p className="text-muted-foreground">{address.address_line_2}</p>}
                            <p className="text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                            {address.landmark && <p className="text-xs text-amber-600 mt-2">Landmark: {address.landmark}</p>}
                        </>
                    ) : (
                        <p className="text-muted-foreground italic">No address provided.</p>
                    )}
                </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="bg-muted/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4"/> Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium capitalize">{booking.payment_method === 'cod' ? 'Cash on Delivery' : booking.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status</span>
                        <Badge variant={booking.payment_status === 'pending' ? 'outline' : 'default'} className="text-xs">{booking.payment_status}</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(booking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(booking.total_amount)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}