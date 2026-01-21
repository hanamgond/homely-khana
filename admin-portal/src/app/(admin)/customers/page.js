'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, Search, Users, UserCheck, Wallet, Clock, Filter, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// --- Helper: Date Formatter ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) { return 'Invalid Date'; }
};

// --- Helper: Get Initials ---
const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export default function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Search & Filters ---
  const [searchTermInput, setSearchTermInput] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1 });

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTermInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTermInput]);

  // --- Fetch Logic ---
  const fetchCustomers = useCallback(async (page = 1) => {
    if (!token) return;
    const apiClient = createApiClient(token);
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '10');
    
    // CRITICAL FIX: Force role to be 'customer' only
    params.set('role', 'customer');

    if (filters.search) params.set('search', filters.search);
    
    // Optional: Add backend support for status filtering later
    if (filters.status !== 'all') params.set('is_active', filters.status === 'active');

    try {
      const response = await apiClient(`/admin/customers?${params.toString()}`); 
      if (response.success && response.data) {
        // Double Check: Filter client-side just in case backend returns mixed roles
        const onlyCustomers = response.data.filter(u => u.role === 'customer');
        setCustomers(onlyCustomers);
        setPagination(response.pagination || { currentPage: 1, totalPages: 1, totalItems: onlyCustomers.length });
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, filters.search, filters.status]);

  useEffect(() => {
    if(token) fetchCustomers(filters.page);
  }, [fetchCustomers, token, filters.page, filters.search, filters.status]);

  const handlePageChange = (p) => setFilters(prev => ({ ...prev, page: p }));

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen w-full">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Base</h1>
          <p className="text-gray-500 mt-1">View and manage your registered customers.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                <Download size={16} className="mr-2"/> Export CSV
            </Button>
        </div>
      </div>

      {/* 2. Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Customers" value={customers.length} icon={Users} color="blue" />
        <StatCard title="Active Subscribers" value={customers.filter(c => c.is_active).length} icon={UserCheck} color="green" />
        <StatCard title="New this Month" value="0" icon={Clock} color="purple" />
        <StatCard title="Total Revenue" value="₹0" icon={Wallet} color="orange" />
      </div>

      {/* 3. Toolbar (Search & Filter) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
                placeholder="Search customers..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                value={searchTermInput}
                onChange={(e) => setSearchTermInput(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-3.5 w-3.5" />
                <select 
                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-gray-400 cursor-pointer appearance-none"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({...prev, status: e.target.value, page: 1}))}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive</option>
                </select>
             </div>
        </div>
      </div>

      {/* 4. Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow>
                <TableHead className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">User Profile</TableHead>
                <TableHead className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</TableHead>
                <TableHead className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined Date</TableHead>
                <TableHead className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</TableHead>
                <TableHead className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton Loading State
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="p-5"><div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full"/><div className="space-y-2"><Skeleton className="h-4 w-32"/><Skeleton className="h-3 w-20"/></div></div></TableCell>
                        <TableCell className="p-5"><Skeleton className="h-4 w-40"/></TableCell>
                        <TableCell className="p-5 hidden md:table-cell"><Skeleton className="h-4 w-24"/></TableCell>
                        <TableCell className="p-5"><Skeleton className="h-6 w-16 rounded-full"/></TableCell>
                        <TableCell className="p-5"><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
                    </TableRow>
                ))
              ) : customers.length === 0 ? (
                // Empty State
                <TableRow>
                    <TableCell colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <Users className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                            <p className="text-sm text-gray-500 mt-1">Your customer list will appear here once users sign up.</p>
                        </div>
                    </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="group hover:bg-gray-50/50 transition-colors">
                    {/* User Profile Column */}
                    <TableCell className="p-5">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-gray-100">
                                <AvatarImage src={customer.image_url} />
                                <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-bold">
                                    {getInitials(customer.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 text-sm">{customer.name}</span>
                                <span className="text-xs text-gray-500 md:hidden">{customer.email}</span>
                            </div>
                        </div>
                    </TableCell>
                    
                    {/* Contact Info */}
                    <TableCell className="p-5">
                        <div className="flex flex-col text-sm">
                            <span className="text-gray-600 font-medium">{customer.email}</span>
                            <span className="text-gray-400 text-xs">{customer.phone || 'No phone'}</span>
                        </div>
                    </TableCell>

                    <TableCell className="p-5 hidden md:table-cell text-sm text-gray-500">
                        {formatDate(customer.created_at)}
                    </TableCell>

                    <TableCell className="p-5">
                         {customer.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                Inactive
                            </span>
                        )}
                    </TableCell>

                    <TableCell className="p-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Order History</DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Block User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        
        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 p-4 bg-gray-50/30">
               <span className="text-xs text-gray-500">
                 Showing <strong>{customers.length}</strong> of <strong>{pagination.totalItems}</strong> customers
              </span>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="h-8 text-xs">Previous</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="h-8 text-xs">Next</Button>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}

// Simple Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorStyles[color]}`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    );
}