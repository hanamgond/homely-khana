//admin-portal/src/app/(admin)/corporate/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { Building2, Phone, Mail, Calendar, Users } from 'lucide-react';

export default function CorporateLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        // Ensure this points to your backend URL (usually port 5000)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/corporate/leads`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
        }
      } catch (error) {
        console.error("Failed to fetch leads", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  if (loading) return <div className="p-8">Loading leads...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="text-orange-600" /> Corporate Leads
          </h1>
          <p className="text-gray-500">Manage incoming corporate catering requests.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-medium">
          Total Leads: {leads.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Date Received</th>
                <th className="p-4 font-semibold">Organization</th>
                <th className="p-4 font-semibold">Contact Person</th>
                <th className="p-4 font-semibold">Requirement</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No leads found yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 pl-6">
                        {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{lead.organization_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Users size={12} /> {lead.total_headcount || 'N/A'} Heads
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-gray-700">{lead.contact_person}</div>
                      <a href={`tel:${lead.direct_phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                        <Phone size={12} /> {lead.direct_phone}
                      </a>
                    </td>

                    <td className="p-4">
                      <span className="inline-block bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-semibold border border-orange-100 mb-1">
                        {lead.service_type}
                      </span>
                      {lead.specific_requirements && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={lead.specific_requirements}>
                          {lead.specific_requirements}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                        lead.status === 'New' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {lead.status || 'New'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}