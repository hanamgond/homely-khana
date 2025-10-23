'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  MoreHorizontal,
  Search,
  Download,
  Eye,
  RefreshCw,
  Calendar as CalendarIcon, // Renamed to avoid conflict
  User,
  CreditCard,
  Package,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Shadcn Calendar component
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation'; // Add this

// --- Helper Functions ---
const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};

const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed': return 'success'; // Ensure this exists in globals.css
        case 'pending': return 'secondary';
        case 'failed': return 'destructive';
        case 'refunded': return 'outline';
        default: return 'secondary';
    }
};

const getStatusIcon = (status) => {
    // Simple colored dot indicator
    switch (status?.toLowerCase()) {
        case 'completed': return <div className="w-2 h-2 bg-green-500 rounded-full" title="Completed" />;
        case 'pending': return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Pending" />;
        case 'failed': return <div className="w-2 h-2 bg-red-500 rounded-full" title="Failed" />;
        case 'refunded': return <div className="w-2 h-2 bg-gray-400 rounded-full" title="Refunded" />;
        default: return <div className="w-2 h-2 bg-gray-300 rounded-full" title="Unknown" />;
    }
};

// --- Stat Card Component --- (Moved inside for simplicity or keep separate)
const StatCard = ({ title, value, subtitle, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {/* Basic trend display - real calculation might need more data */}
      {trend && (
        <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}% from last period
        </p>
      )}
    </CardContent>
  </Card>
);

// --- Orders Page Component ---
export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]); // Data for the current page
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for Filters & Search (Backend Driven) ---
  const [filters, setFilters] = useState({
    status: '', // Corresponds to Tab value ('', 'pending', 'completed')
    method: '', // 'cod', 'online'
    search: '',
    dateRange: { from: undefined, to: undefined },
    page: 1, // Current page for API request
  });
  const [searchTermInput, setSearchTermInput] = useState(''); // Input value for debounced search

  // --- Debounce Search Input ---
  useEffect(() => {
    const handler = setTimeout(() => {
      // Update the actual search filter only after delay
      // Reset to page 1 when search term changes
      setFilters(prev => ({ ...prev, search: searchTermInput, page: 1 }));
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTermInput]);

  // --- Fetch Bookings (Backend Driven) ---
  const fetchBookings = useCallback(async (pageToFetch) => {
    if (!token) {
        setIsLoading(false);
        setError("Authentication token not found."); return;
    }
    const apiClient = createApiClient(token);
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', pageToFetch.toString());
    params.set('limit', '10'); // Items per page
    if (filters.status) params.set('status', filters.status);
    if (filters.method) params.set('method', filters.method);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateRange.from) params.set('startDate', format(filters.dateRange.from, 'yyyy-MM-dd'));
    if (filters.dateRange.to) params.set('endDate', format(filters.dateRange.to, 'yyyy-MM-dd'));

    try {
      const response = await apiClient(`/admin/bookings?${params.toString()}`);
      if (response.success && response.data && response.pagination) {
        setBookings(response.data);
        // Ensure pagination state includes all necessary fields from backend
        setPagination({
            currentPage: response.pagination.currentPage || 1,
            totalPages: response.pagination.totalPages || 1,
            totalItems: response.pagination.totalItems || 0,
        });
      } else {
        setError(response.error || 'Failed to fetch bookings.');
        setBookings([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      console.error("Fetch Bookings Error:", err);
      setError(err.message || "An error occurred.");
      setBookings([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [token, filters.status, filters.method, filters.search, filters.dateRange]); // Dependencies for refetching

  // --- Initial Fetch & Refetch on Filters/Page Change ---
  useEffect(() => {
    if (token) {
        fetchBookings(filters.page); // Fetch based on current page in filters state
    } else {
        setIsLoading(false); // Stop loading if no token
    }
    // Intentionally excluding fetchBookings from deps to avoid loop,
    // dependencies inside fetchBookings handle refetching
  }, [token, filters.page, filters.status, filters.method, filters.search, filters.dateRange]);

  // --- Handlers ---
  const handleTabChange = (value) => {
    // Map 'all' tab to empty status filter for API
    const statusValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, status: statusValue, page: 1 })); // Reset page
  };

  const handleSelectFilterChange = (key, value) => {
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handleDateRangeChange = (date) => {
     setFilters(prev => ({ ...prev, dateRange: { from: date?.from, to: date?.to }, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== filters.page) {
      setFilters(prev => ({ ...prev, page: newPage })); // Update page in state to trigger refetch
    }
  };

  const handleRefresh = () => {
     fetchBookings(filters.page); // Refetch current page
  };

  const handleExport = () => { console.log('Exporting orders...'); /* Implement later */ };
  const handleViewDetails = (bookingId) => { console.log('Viewing details for:', bookingId); /* Implement later */ };
  const handleMarkAsPaid = (bookingId) => { console.log('Marking as paid:', bookingId); /* Implement later */ };

  // --- Calculate Stats based on *Total* Items from Pagination ---
  // Note: These stats reflect ALL orders matching filters, not just current page
  // For more complex stats (e.g., revenue), you might need a separate API endpoint
  const totalOrdersStat = pagination.totalItems || 0;
  // Other stats might require fetching all data or dedicated endpoints
  const totalRevenueStat = isLoading ? '...' : formatCurrency(bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0)); // Example based on current page

  // --- Pre-map Rows for Table (Hydration fix) ---
  const tableRows = !isLoading && !error && bookings.length > 0
    ? bookings.map((booking) => (
        <TableRow key={booking.id} className="hover:bg-muted/50">
           <TableCell className="font-mono text-xs w-[100px] truncate">#{booking.id.split('-')[0]}</TableCell> {/* Short ID */}
           <TableCell className="w-[250px]">
             <div className="font-medium">{booking.customer_name || 'N/A'}</div>
             <div className="text-xs text-muted-foreground hidden lg:block">{booking.customer_email || 'N/A'}</div>
           </TableCell>
           <TableCell className="hidden sm:table-cell min-w-[150px]">{formatDate(booking.created_at)}</TableCell>
           <TableCell className="text-right min-w-[100px] font-medium">{formatCurrency(booking.total_amount)}</TableCell>
           <TableCell className="hidden md:table-cell w-[100px] text-center">
               <Badge variant="outline" className="text-xs">{booking.payment_method?.toUpperCase()}</Badge>
           </TableCell>
           <TableCell className="w-[120px]">
             <div className="flex items-center gap-2">
                {getStatusIcon(booking.payment_status)}
                <Badge variant={getStatusVariant(booking.payment_status)} className="capitalize text-xs px-2 py-0.5">
                    {booking.payment_status || 'N/A'}
                </Badge>
             </div>
           </TableCell>
           <TableCell className="text-right w-[80px]">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
                 <DropdownMenuItem onSelect={() => router.push(`/orders/${booking.id}`)}>
                   <Eye className="mr-2 h-4 w-4" />View Details
                 </DropdownMenuItem>
                 {booking.payment_method === 'cod' && booking.payment_status === 'pending' && (
                     <DropdownMenuItem onSelect={() => handleMarkAsPaid(booking.id)}><CreditCard className="mr-2 h-4 w-4 text-green-600" />Mark as Paid</DropdownMenuItem>
                 )}
                 {/* Add Pause/Resume/Cancel later */}
               </DropdownMenuContent>
             </DropdownMenu>
           </TableCell>
         </TableRow>
      ))
    : null;


  return (
    <div className="flex flex-col gap-6 p-4 md:p-6"> {/* Added padding */}
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-sm text-muted-foreground">Manage and track all customer orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button size="sm" onClick={handleRefresh} disabled={isLoading}><RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
      </div>

      {/* 2. Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={isLoading ? '...' : totalOrdersStat} subtitle="All matching orders" icon={<Package className="h-5 w-5 text-muted-foreground" />} />
        <StatCard title="Total Revenue (Page)" value={totalRevenueStat} subtitle="On current page" icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} />
        {/* Add more relevant stats if needed - might require backend changes */}
         <StatCard title="Pending" value={isLoading ? '...' : bookings.filter(b => b.payment_status === 'pending').length} subtitle="On current page" icon={<CalendarIcon className="h-5 w-5 text-muted-foreground" />} />
         <StatCard title="Completed" value={isLoading ? '...' : bookings.filter(b => b.payment_status === 'completed').length} subtitle="On current page" icon={<CreditCard className="h-5 w-5 text-muted-foreground" />} />
      </div>

      {/* 3. Main Content Area with Tabs and Filters */}
      <Tabs defaultValue="all" value={filters.status || 'all'} onValueChange={handleTabChange}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            {/* Add more tabs for Failed, Refunded if needed */}
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name, email, ID..."
                className="pl-10 w-full sm:w-64"
                value={searchTermInput}
                onChange={(e) => setSearchTermInput(e.target.value)}
              />
            </div>
            {/* Payment Method Filter */}
            <Select value={filters.method || "all"} onValueChange={(value) => handleSelectFilterChange('method', value)}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cod">COD</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
            {/* Date Range Picker */}
            <Popover>
               <PopoverTrigger asChild>
                 <Button id="date" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !filters.dateRange.from && "text-muted-foreground")}>
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {filters.dateRange.from ? (filters.dateRange.to ? (<>{format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}</>) : (format(filters.dateRange.from, "LLL dd, y"))) : (<span>Date Range</span>)}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="end">
                 <Calendar initialFocus mode="range" defaultMonth={filters.dateRange?.from} selected={filters.dateRange} onSelect={handleDateRangeChange} numberOfMonths={1}/>
               </PopoverContent>
             </Popover>
          </div>
        </div>

        {/* Table Content Area */}
        {/* We don't need TabsContent here since filtering is done via API */}
        <Card>
          <CardContent className="p-0"> {/* Remove padding */}
            {/* Loading State */}
            {isLoading && (<div className="flex justify-center items-center py-10"><p className="text-muted-foreground">Loading orders...</p></div>)}
            {/* Error State */}
            {error && (<div className="flex justify-center items-center py-10"><p className="text-red-600">Error: {error}</p></div>)}
            {/* Empty State */}
            {!isLoading && !error && bookings.length === 0 && (<div className="flex justify-center items-center py-10"><p className="text-muted-foreground">No bookings found.</p></div>)}
            {/* Table */}
            {tableRows && (
              <div className="overflow-x-auto relative"> {/* Removed border */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Order ID</TableHead>
                      <TableHead className="min-w-[200px]">Customer</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[150px]">Date</TableHead>
                      <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                      <TableHead className="hidden md:table-cell w-[100px] text-center">Method</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{tableRows}</TableBody>
                </Table>
              </div>
            )}
          </CardContent>
           {/* Pagination */}
           {!isLoading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 p-4 border-t">
                 <span className="text-sm text-muted-foreground">
                   {`Showing ${bookings.length} of ${pagination.totalItems} orders`}
                </span>
                <div className="flex items-center space-x-2">
                   <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>Previous</Button>
                     <span className="text-sm font-medium">Page {pagination.currentPage} of {pagination.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>Next</Button>
                </div>
              </div>
            )}
        </Card>
      </Tabs>
    </div>
  );
}