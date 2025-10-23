'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Utensils } from "lucide-react"; // Utensils icon
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Use table for layout


export default function KitchenPrepPage() {
  const { token } = useAuth();
  const [prepData, setPrepData] = useState({ date: '', lunch: [], dinner: [] });
  const [selectedDate, setSelectedDate] = useState(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
  }); // Default to tomorrow
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Prep Data ---
  const fetchPrepData = useCallback(async (date) => {
    if (!token || !date) return;

    const apiClient = createApiClient(token);
    setIsLoading(true);
    setError(null);
    const dateString = format(date, 'yyyy-MM-dd'); // Format date for API

    try {
      const response = await apiClient(`/admin/kitchen-prep?date=${dateString}`);
      if (response.success && response.data) {
        setPrepData(response.data);
      } else {
        setError(response.error || 'Failed to fetch kitchen prep data');
        setPrepData({ date: dateString, lunch: [], dinner: [] }); // Reset data on error
      }
    } catch (err) {
      console.error("Fetch Prep Data Error:", err);
      setError(err.message || "An unexpected error occurred.");
      setPrepData({ date: dateString, lunch: [], dinner: [] });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // --- Fetch data when selectedDate or token changes ---
  useEffect(() => {
    fetchPrepData(selectedDate);
  }, [fetchPrepData, selectedDate, token]);

  // --- Render Section ---
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kitchen Prep Sheet</h1>
          <p className="text-sm text-muted-foreground">
            Total quantities needed for scheduled deliveries.
          </p>
        </div>
         {/* Date Picker */}
         <Popover>
           <PopoverTrigger asChild>
             <Button
               id="date"
               variant={"outline"}
               className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
             >
               <CalendarIcon className="mr-2 h-4 w-4" />
               {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>} {/* PPP format: Oct 23, 2025 */}
             </Button>
           </PopoverTrigger>
           <PopoverContent className="w-auto p-0" align="end">
             <Calendar
               mode="single"
               selected={selectedDate}
               onSelect={(date) => { if(date) setSelectedDate(date)}} // Update state on select
               initialFocus
               // Optional: disable past dates?
               // disabled={{ before: new Date() }}
             />
           </PopoverContent>
         </Popover>
      </div>

      {/* 2. Main Content Cards (Lunch & Dinner) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lunch Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-amber-500" /> {/* Lunch icon */}
              Lunch Prep List
            </CardTitle>
            <CardDescription>
              Date: {prepData.date ? format(new Date(prepData.date + 'T00:00:00'), 'PPP') : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-muted-foreground text-center py-4">Loading lunch data...</p>}
            {error && <p className="text-red-600 text-center py-4">Error loading data.</p>}
            {!isLoading && !error && prepData.lunch.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No lunch items scheduled for this date.</p>
            )}
            {!isLoading && !error && prepData.lunch.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meal</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prepData.lunch.map((item, index) => (
                    <TableRow key={`lunch-${index}`}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right font-bold text-lg">{item.total_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dinner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Utensils className="h-5 w-5 text-indigo-500" /> {/* Dinner icon */}
              Dinner Prep List
            </CardTitle>
             <CardDescription>
              Date: {prepData.date ? format(new Date(prepData.date + 'T00:00:00'), 'PPP') : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading && <p className="text-muted-foreground text-center py-4">Loading dinner data...</p>}
            {error && <p className="text-red-600 text-center py-4">Error loading data.</p>}
            {!isLoading && !error && prepData.dinner.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No dinner items scheduled for this date.</p>
            )}
            {!isLoading && !error && prepData.dinner.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meal</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prepData.dinner.map((item, index) => (
                    <TableRow key={`dinner-${index}`}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right font-bold text-lg">{item.total_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}