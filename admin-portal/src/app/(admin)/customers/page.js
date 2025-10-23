'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createApiClient } from '@/lib/api';
import { Badge } from "@/components/ui/badge"; // For role badge
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, Search, UserPlus } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        // Format to just Date for customer list
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};

const getRoleVariant = (role) => {
    switch (role?.toLowerCase()) {
        case 'admin': return 'destructive'; // Highlight admins
        case 'customer': return 'outline';
        default: return 'secondary';
    }
};

// --- Customers Page Component ---
export default function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for Search ---
  const [filters, setFilters] = useState({ search: '', page: 1 });
  const [searchTermInput, setSearchTermInput] = useState(''); // Input value for debouncing

  // --- Debounce Search Input ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTermInput, page: 1 })); // Reset page on search
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTermInput]);

  // --- Fetch Customers Function ---
  const fetchCustomers = useCallback(async (page = 1) => {
    if (!token) { setIsLoading(false); setError("Not authenticated."); return; }

    const apiClient = createApiClient(token);
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '15'); // Adjust items per page if needed
    if (filters.search) params.set('search', filters.search);

    try {
      const response = await apiClient(`/admin/customers?${params.toString()}`);
      if (response.success && response.data && response.pagination) {
        setCustomers(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Failed to fetch customers');
        setCustomers([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      console.error("Fetch Customers Error:", err);
      setError(err.message || "An error occurred.");
      setCustomers([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [token, filters.search]); // Re-fetch only when token or search term changes

  // --- Initial Fetch & Refetch on Page/Filter Change ---
  useEffect(() => {
    if(token) {
        fetchCustomers(filters.page);
    } else {
        setIsLoading(false);
    }
  }, [fetchCustomers, token, filters.page, filters.search]); // Depend on page and search term

  // --- Handlers ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== filters.page) {
      setFilters(prev => ({ ...prev, page: newPage })); // Update page in state
    }
  };

  const handleViewDetails = (customerId) => { alert(`View details for customer ${customerId} (TBD)`); };
  const handleAddCustomer = () => { alert('Add customer functionality (TBD)'); };


  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-sm text-muted-foreground">View and manage registered users.</p>
        </div>
        {/* Add Customer Button - Placeholder */}
        <Button size="sm" onClick={handleAddCustomer} variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* 2. Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, email, or phone..."
          className="pl-10 w-full md:w-1/3" // Adjust width as needed
          value={searchTermInput}
          onChange={(e) => setSearchTermInput(e.target.value)}
        />
      </div>

      {/* 3. Main Content Card with Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading...'
              : `Total ${pagination.totalItems || 0} users found.`}
             {!isLoading && pagination.totalPages > 1 && ` Showing page ${pagination.currentPage} of ${pagination.totalPages}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (<div className="flex justify-center items-center py-10"><p className="text-muted-foreground">Loading users...</p></div>)}
          {error && (<div className="flex justify-center items-center py-10"><p className="text-red-600">Error: {error}</p></div>)}
          {!isLoading && !error && customers.length === 0 && (<div className="flex justify-center items-center py-10"><p className="text-muted-foreground">No users found.</p></div>)}

          {!isLoading && !error && customers.length > 0 && (
            <div className="overflow-x-auto relative border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="w-[100px]">Role</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{customer.name || 'N/A'}</TableCell>
                      <TableCell>{customer.email || 'N/A'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{customer.phone || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(customer.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(customer.role)} className="capitalize text-xs">
                          {customer.role || 'N/A'}
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
                            <DropdownMenuItem onSelect={() => handleViewDetails(customer.id)}>View Details</DropdownMenuItem>
                            {/* Add Edit/Deactivate later */}
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
        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 1 && (
            // eslint-disable-next-line react/jsx-no-undef
            <CardFooter className="flex items-center justify-between border-t pt-4">
               <span className="text-sm text-muted-foreground">
                 {`Showing ${customers.length} of ${pagination.totalItems} users`}
              </span>
              <div className="flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>Previous</Button>
                   <span className="text-sm font-medium">Page {pagination.currentPage} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>Next</Button>
              </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
