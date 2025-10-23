'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Printer, Check, Truck, X } from "lucide-react"; // Icons
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // For slot filter
import { Label } from "@/components/ui/label"; // For radio group

// --- Helper Functions --- (Copied from orders, maybe move to utils)
const formatDate = (dateString, formatStr = "PPP") => { // PPP = Oct 22, 2025
    if (!dateString) return 'N/A';
    try {
        // Handle cases where dateString might already be a Date object
        const date = typeof dateString === 'string' ? new Date(dateString + 'T00:00:00') : dateString;
        if (isNaN(date.getTime())) return 'Invalid Date';
        return format(date, formatStr);
    } catch (e) { return 'Invalid Date'; }
};
const getStatusVariant = (status) => { /* ... same as orders ... */ };

export default function DispatchSheetPage() {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to TODAY
  const [selectedSlot, setSelectedSlot] = useState('all'); // 'all', 'lunch', 'dinner'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Dispatch Data ---
  const fetchDispatchData = useCallback(async (date, slot) => {
    if (!token || !date) return;

    const apiClient = createApiClient(token);
    setIsLoading(true);
    setError(null);
    const dateString = format(date, 'yyyy-MM-dd');
    const params = new URLSearchParams({ date: dateString });
    if (slot && slot !== 'all') {
      params.set('slot', slot);
    }

    try {
      const response = await apiClient(`/admin/dispatch-sheet?${params.toString()}`);
      if (response.success && response.data) {
        setDeliveries(response.data);
      } else {
        setError(response.error || 'Failed to fetch dispatch data');
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Fetch Dispatch Error:", err);
      setError(err.message || "An unexpected error occurred.");
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // --- Fetch data when selectedDate, selectedSlot or token changes ---
  useEffect(() => {
    fetchDispatchData(selectedDate, selectedSlot);
  }, [fetchDispatchData, selectedDate, selectedSlot, token]);

  // --- Handle Print ---
  const handlePrint = () => {
    // Basic browser print function
    // More advanced printing might need a dedicated library or CSS print styles
    window.print();
  };

  // --- TODO: Handle Status Update ---
  const handleUpdateStatus = (deliveryId, newStatus) => {
    console.log(`Update delivery ${deliveryId} to ${newStatus}`);
    // Add API call here later to PUT /api/admin/deliveries/:id/status
    // After successful update, refetch data: fetchDispatchData(selectedDate, selectedSlot);
    toast.info(`Status update for ${deliveryId} to ${newStatus} (not implemented yet)`);
  };


  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dispatch Sheet</h1>
          <p className="text-sm text-muted-foreground">
            View and manage deliveries for a selected date and slot.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if(date) setSelectedDate(date)}} initialFocus />
            </PopoverContent>
          </Popover>
          {/* Print Button */}
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>
      </div>

      {/* 2. Slot Filter */}
      <RadioGroup defaultValue="all" value={selectedSlot} onValueChange={setSelectedSlot} className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="r-all" /><Label htmlFor="r-all">All Slots</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="lunch" id="r-lunch" /><Label htmlFor="r-lunch">Lunch</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="dinner" id="r-dinner" /><Label htmlFor="r-dinner">Dinner</Label></div>
      </RadioGroup>

      {/* 3. Main Delivery List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deliveries for {formatDate(selectedDate)} - {selectedSlot.toUpperCase()}</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${deliveries.length} deliveries found.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding for full-width table */}
          {isLoading && <p className="text-muted-foreground text-center p-6">Loading deliveries...</p>}
          {error && <p className="text-red-600 text-center p-6">Error: {error}</p>}
          {!isLoading && !error && deliveries.length === 0 && (
            <p className="text-muted-foreground text-center p-6">No scheduled deliveries found for this date/slot.</p>
          )}
          {!isLoading && !error && deliveries.length > 0 && (
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Customer</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="w-[150px]">Meal</TableHead>
                    <TableHead className="w-[50px] text-center">Qty</TableHead>
                    <TableHead className="w-[80px]">Slot</TableHead>
                    <TableHead className="w-[150px]">Status / Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.delivery_id}>
                      <TableCell>
                        <div className="font-medium">{d.delivery_name || d.customer_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{d.customer_phone || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.address_line_1}{d.address_line_2 ? `, ${d.address_line_2}` : ''}<br />
                        {d.city}, {d.state} - {d.pincode}<br/>
                        {d.landmark ? `(${d.landmark})` : ''}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{d.product_name}</TableCell>
                      <TableCell className="text-center font-bold">{d.quantity}</TableCell>
                      <TableCell>
                         <Badge variant={d.delivery_slot === 'lunch' ? 'outline' : 'secondary'} className="capitalize text-xs">
                            {d.delivery_slot}
                         </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Badge variant={getStatusVariant(d.status)} className="capitalize mb-1 w-full justify-center">{d.status}</Badge>
                           {/* Add action buttons based on status */}
                           {d.status === 'scheduled' && (
                             <Button variant="outline" size="xs" title="Mark Out for Delivery" onClick={() => handleUpdateStatus(d.delivery_id, 'out_for_delivery')}><Truck className="h-4 w-4" /></Button>
                           )}
                           {d.status === 'out_for_delivery' && (
                             <Button variant="outline" size="xs" title="Mark Delivered" onClick={() => handleUpdateStatus(d.delivery_id, 'delivered')}><Check className="h-4 w-4 text-green-600" /></Button>
                           )}
                           {/* Add Cancel/Skip later */}
                           {(d.status === 'scheduled' || d.status === 'out_for_delivery') && (
                              <Button variant="outline" size="xs" title="Cancel Delivery" onClick={() => handleUpdateStatus(d.delivery_id, 'cancelled')}><X className="h-4 w-4 text-red-600" /></Button>
                           )}
                        </div>
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