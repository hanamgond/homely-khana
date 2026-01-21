'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
  MoreHorizontal, Search, Download, RefreshCw, 
  Calendar as CalendarIcon, Package, TrendingUp, FilterX,
  CreditCard, Clock, CheckCircle2, ShoppingBag, Eye, AlertCircle
} from "lucide-react";

// --- Helper Functions ---
const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const getStatusBadge = (status) => {
    const styles = {
        completed: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        failed: 'bg-red-100 text-red-700 border-red-200',
        cancelled: 'bg-red-50 text-red-600 border-red-100',
        refunded: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const defaultStyle = 'bg-gray-100 text-gray-700 border-gray-200';
    
    return (
        <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs font-semibold shadow-none border", styles[status?.toLowerCase()] || defaultStyle)}>
            {status}
        </Badge>
    );
};

// --- Stat Card ---
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <Card className="border shadow-sm">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", bgClass, colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
    </CardContent>
  </Card>
);

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  
  // State
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTermInput, setSearchTermInput] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: 'all', // Default to 'all' for Tabs
    method: '',
    search: '',
    dateRange: { from: undefined, to: undefined },
    page: 1,
  });

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTermInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTermInput]);

  // Fetch Data
  const fetchBookings = useCallback(async (pageToFetch) => {
    if (!token) return;
    setIsLoading(true);
    const apiClient = createApiClient(token);
    const params = new URLSearchParams();
    
    params.set('page', pageToFetch.toString());
    params.set('limit', '10');
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.method && filters.method !== 'all') params.set('method', filters.method);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateRange.from) params.set('startDate', format(filters.dateRange.from, 'yyyy-MM-dd'));
    if (filters.dateRange.to) params.set('endDate', format(filters.dateRange.to, 'yyyy-MM-dd'));

    try {
      const response = await apiClient(`/admin/bookings?${params.toString()}`);
      if (response.success && response.data) {
        setBookings(response.data);
        setPagination({
            currentPage: response.pagination?.currentPage || 1,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.totalItems || 0,
        });
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchBookings(filters.page);
  }, [fetchBookings]);

  // Handlers
  const handleRefresh = () => fetchBookings(filters.page);
  const resetFilters = () => {
    setFilters({ status: 'all', method: '', search: '', dateRange: { from: undefined, to: undefined }, page: 1 });
    setSearchTermInput('');
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto min-h-screen bg-white">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor and manage incoming food orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={isLoading} className="bg-gray-900 text-white hover:bg-gray-800">
            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Revenue" 
            value={formatCurrency(bookings.reduce((a, b) => a + parseFloat(b.total_amount || 0), 0))}
            icon={TrendingUp} 
            bgClass="bg-blue-50" 
            colorClass="text-blue-600"
        />
        <StatCard 
            title="Total Orders" 
            value={pagination.totalItems} 
            icon={ShoppingBag} 
            bgClass="bg-purple-50" 
            colorClass="text-purple-600"
        />
        <StatCard 
            title="Pending Actions" 
            value={bookings.filter(b => b.payment_status === 'pending').length} 
            icon={Clock} 
            bgClass="bg-amber-50" 
            colorClass="text-amber-600"
        />
        <StatCard 
            title="Completed" 
            value={bookings.filter(b => b.payment_status === 'completed').length} 
            icon={CheckCircle2} 
            bgClass="bg-emerald-50" 
            colorClass="text-emerald-600"
        />
      </div>

      {/* 3. Main Content: Tabs & Toolbar */}
      <div className="space-y-4">
        
        {/* Status Tabs (Like Weekly Menu Pills) */}
        <Tabs defaultValue="all" value={filters.status} onValueChange={(v) => setFilters(p => ({...p, status: v, page: 1}))} className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                
                {/* Left: Tabs */}
                <TabsList className="bg-transparent p-0 h-auto gap-2">
                    {['all', 'pending', 'completed', 'cancelled'].map((status) => (
                        <TabsTrigger 
                            key={status} 
                            value={status}
                            className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-full px-4 py-2 text-sm border border-gray-200 bg-white text-gray-600 hover:text-gray-900 data-[state=active]:border-gray-900 transition-all capitalize"
                        >
                            {status}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Right: Search & Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search orders..." 
                            className="pl-9 h-9 bg-white border-gray-200 focus-visible:ring-gray-900"
                            value={searchTermInput}
                            onChange={(e) => setSearchTermInput(e.target.value)}
                        />
                    </div>

                    {/* Payment Method */}
                    <Select value={filters.method || "all"} onValueChange={(v) => setFilters(p => ({...p, method: v === 'all' ? '' : v, page: 1}))}>
                        <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200 text-sm">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="cod">COD</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("h-9 border-gray-200 bg-white text-sm justify-start text-left font-normal px-3 min-w-[120px]", !filters.dateRange.from && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                            {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={filters.dateRange?.from} selected={filters.dateRange} onSelect={(range) => setFilters(p => ({...p, dateRange: range || {}, page: 1}))} numberOfMonths={1}/>
                        </PopoverContent>
                    </Popover>

                    {/* Reset */}
                    {(filters.status !== 'all' || filters.method || filters.search || filters.dateRange.from) && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={resetFilters}>
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </Tabs>

        {/* 4. Data Table */}
        <Card className="border shadow-sm bg-white overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-100">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] pl-6 h-11 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</TableHead>
                    <TableHead className="min-w-[200px] text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pr-6">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={7} className="h-16 text-center text-muted-foreground animate-pulse">Loading...</TableCell></TableRow>
                    ))
                ) : bookings.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-900">No orders found</p>
                                    <p className="text-xs text-muted-foreground mt-1">Adjust your filters or search terms.</p>
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer" onClick={() => router.push(`/orders/${booking.id}`)}>
                        <TableCell className="pl-6 font-medium text-gray-900">
                            <span className="font-mono text-xs text-blue-600">#{booking.id.split('-')[0].toUpperCase()}</span>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {booking.customer_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{booking.customer_name}</span>
                                <span className="text-xs text-muted-foreground">{booking.customer_email}</span>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                            {format(new Date(booking.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs bg-gray-100 text-gray-600 border border-gray-200">
                            {booking.payment_method === 'cod' ? 'Cash' : 'Online'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {getStatusBadge(booking.payment_status)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900 pr-6">
                            {formatCurrency(booking.total_amount)}
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/orders/${booking.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {booking.payment_status === 'pending' && booking.payment_method === 'cod' && (
                                <DropdownMenuItem className="text-green-600"><CreditCard className="mr-2 h-4 w-4" /> Mark Paid</DropdownMenuItem>
                            )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </div>

            {/* Pagination Footer */}
            {!isLoading && bookings.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
                    <p className="text-xs text-muted-foreground">
                        Showing <span className="font-medium text-gray-900">{((pagination.currentPage - 1) * 10) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(pagination.currentPage * 10, pagination.totalItems)}</span> of {pagination.totalItems} entries
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 bg-white border-gray-200" onClick={() => setFilters(p => ({...p, page: p.page - 1}))} disabled={pagination.currentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white border-gray-200" onClick={() => setFilters(p => ({...p, page: p.page + 1}))} disabled={pagination.currentPage >= pagination.totalPages}>Next</Button>
                    </div>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
}