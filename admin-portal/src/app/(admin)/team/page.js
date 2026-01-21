'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Shield, MapPin, Truck, ChefHat, 
  Search, Filter, MoreHorizontal, UserX, CheckCircle2, X
} from 'lucide-react';

export default function TeamPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Initial Form State
  const initialFormState = {
    name: '', email: '', phone: '', password: '', 
    role: 'manager', zone: '', kitchen_station: '', 
    permissions: { viewRevenue: false, deleteOrders: false, manageMenu: false }
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Fetch Logic ---
  const fetchStaff = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/team`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handlePermChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [name]: checked } }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchStaff();
        setFormData(initialFormState);
        alert("Staff added successfully!");
      } else {
        setErrorMsg(data.message || "Failed to add staff.");
      }
    } catch (err) {
      setErrorMsg("Network error.");
    }
  };
  const toggleStatus = async (id, currentStatus) => {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/team/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentStatus })
        });
        fetchStaff();
    } catch (err) {}
  };

  // --- Filter Logic ---
  const filteredStaff = staff.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    // FIX: Removed 'mx-auto' and 'max-w-[1600px]' to align left like other pages
    <div className="p-6 bg-gray-50/50 min-h-screen w-full">
      
      {/* 1. Page Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage your staff, delivery fleet, and kitchen operations.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
        >
          <Plus size={18} strokeWidth={2.5} /> Add Member
        </button>
      </div>

      {/* 2. Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Staff" value={staff.length} icon={Users} color="blue" />
        <StatCard label="Active Now" value={staff.filter(u => u.is_active).length} icon={CheckCircle2} color="green" />
        <StatCard label="Delivery Fleet" value={staff.filter(u => u.role === 'delivery').length} icon={Truck} color="orange" />
        <StatCard label="Kitchen Crew" value={staff.filter(u => u.role === 'kitchen').length} icon={ChefHat} color="red" />
      </div>

      {/* 3. Toolbar (Search & Filter) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
                placeholder="Search by name or email..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <select 
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-gray-400 cursor-pointer"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
            >
                <option value="all">All Roles</option>
                <option value="manager">Managers</option>
                <option value="delivery">Delivery</option>
                <option value="kitchen">Kitchen</option>
            </select>
        </div>
      </div>

      {/* 4. The Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
              <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Zone</th>
              <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Permissions</th>
              <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
                <tr><td colSpan="5" className="p-12 text-center text-gray-400">Loading team data...</td></tr>
            ) : filteredStaff.length === 0 ? (
                <tr>
                    <td colSpan="5" className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No team members found</h3>
                            <p className="text-gray-500 max-w-sm mt-1 mb-6">
                                {searchTerm ? "Try adjusting your search or filters." : "Get started by adding your first manager, delivery executive, or kitchen staff."}
                            </p>
                            {!searchTerm && (
                                <button onClick={() => setShowModal(true)} className="text-sm font-semibold text-black hover:underline">
                                    + Add New Staff
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
            ) : (
             filteredStaff.map((user) => (
              <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                
                <td className="p-5">
                    <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 
                            user.role === 'manager' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                            user.role === 'delivery' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 
                            'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                             {user.role}
                        </span>
                        {(user.zone || user.kitchen_station) && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10}/> {user.zone || user.kitchen_station}
                            </span>
                        )}
                    </div>
                </td>

                <td className="p-5 hidden md:table-cell">
                   <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Object.entries(user.permissions || {}).filter(([_, v]) => v).map(([key]) => (
                             <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded border border-gray-200 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                             </span>
                        ))}
                        {!Object.values(user.permissions || {}).some(Boolean) && <span className="text-xs text-gray-400">-</span>}
                   </div>
                </td>

                <td className="p-5">
                    {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span> Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            Inactive
                        </span>
                    )}
                </td>

                <td className="p-5 text-right">
                    <button onClick={() => toggleStatus(user.id, user.is_active)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* --- ADD STAFF MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Add New Team Member</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
                <form id="addStaffForm" onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Select Role</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'manager', icon: Shield, label: 'Manager' },
                                { id: 'delivery', icon: Truck, label: 'Delivery' },
                                { id: 'kitchen', icon: ChefHat, label: 'Kitchen' },
                            ].map((role) => (
                                <button
                                    type="button"
                                    key={role.id}
                                    onClick={() => setFormData({...formData, role: role.id})}
                                    className={`relative border rounded-xl p-4 flex flex-col items-center gap-2 transition-all
                                        ${formData.role === role.id 
                                            ? 'border-black bg-gray-900 text-white shadow-md' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                                        }
                                    `}
                                >
                                    <role.icon size={24} strokeWidth={1.5} />
                                    <span className="text-xs font-medium">{role.label}</span>
                                    {formData.role === role.id && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="e.g. Rahul Sharma" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="name@company.com" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="98765..." required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="••••••••" required />
                        </div>
                    </div>

                    {/* Conditional Logic (Updated Dropdown) */}
                    {(formData.role === 'manager' || formData.role === 'delivery') && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <label className="block text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><MapPin size={12}/> Assigned Zone</label>
                            <div className="relative">
                                <select 
                                    name="zone" 
                                    value={formData.zone} 
                                    onChange={handleChange} 
                                    className="w-full border border-blue-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">Select Zone...</option>
                                    <optgroup label="Core (Koramangala)">
                                        <option value="Koramangala - Block 1-4">Koramangala Block 1-4</option>
                                        <option value="Koramangala - Block 5-8">Koramangala Block 5-8</option>
                                        <option value="Ejipura / Sony Signal">Ejipura / Sony Signal</option>
                                        <option value="ST Bed Layout">ST Bed Layout</option>
                                    </optgroup>
                                    <optgroup label="South East (HSR & BTM)">
                                        <option value="HSR Layout - Sector 1-4">HSR Layout Sector 1-4</option>
                                        <option value="HSR Layout - Sector 5-7">HSR Layout Sector 5-7</option>
                                        <option value="BTM Layout">BTM Layout</option>
                                    </optgroup>
                                    <optgroup label="East (Indiranagar)">
                                        <option value="Indiranagar">Indiranagar</option>
                                        <option value="Domlur">Domlur</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    )}
                    
                    {/* Kitchen Station Dropdown */}
                    {formData.role === 'kitchen' && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <label className="block text-xs font-bold text-red-800 mb-2 flex items-center gap-1"><ChefHat size={12}/> Kitchen Station</label>
                            <div className="relative">
                                <select name="kitchen_station" value={formData.kitchen_station} onChange={handleChange} className="w-full border border-red-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none appearance-none cursor-pointer">
                                    <option value="">Select Station...</option>
                                    <option value="North Indian Curry">North Indian Curry</option>
                                    <option value="Roti / Breads">Roti / Breads</option>
                                    <option value="Packaging">Packaging</option>
                                    <option value="Prep">Prep Work</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2"><UserX size={16}/> {errorMsg}</div>}
                </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" form="addStaffForm" className="px-5 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-lg shadow-lg flex items-center gap-2">Create Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600",
        red: "bg-red-50 text-red-600",
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorStyles[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}