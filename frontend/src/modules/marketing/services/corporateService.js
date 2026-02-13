import api from '@/shared/lib/api';

export const CorporateService = {
  // Submit a new corporate lead
  // Endpoint: POST /api/corporate/leads
  createLead: async (leadData) => {
    // We explicitly convert headcount to a number to satisfy Zod validation on backend
    const payload = {
      ...leadData,
      totalHeadcount: Number(leadData.totalHeadcount) || 0
    };

    const response = await api.post('/api/corporate/leads', payload);
    return response.data;
  }
};