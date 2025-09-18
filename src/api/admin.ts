import { apiClient } from '../lib/api-client';

// Add these new API methods to the existing admin.ts file
export const adminApi = {
  // Dashboard
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  getAnalytics: (period: string) => apiClient.get(`/admin/analytics?period=${period}`),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    return apiClient.get(endpoint);
  },

  suspendUser: (userId: string) => apiClient.patch(`/admin/users/${userId}/suspend`),
  unsuspendUser: (userId: string) => apiClient.patch(`/admin/users/${userId}/unsuspend`),

  // Properties - Updated to use /properties instead of /api/properties
  getProperties: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/properties?${queryString}` : '/properties';
    
    console.log('🔄 Admin API: Fetching properties from endpoint:', endpoint);
    console.log('🔄 Admin API: Query params:', params);
    console.log('🔄 Admin API: Full URL will be:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}${endpoint}`);
    
    try {
      const response = await apiClient.get(endpoint);
      console.log('✅ Admin API: Properties response:', response);
      console.log('📦 Admin API: Response data structure:', {
        hasData: !!response.data,
        hasProperties: !!response.properties,
        dataType: typeof response.data,
        propertiesType: typeof response.properties,
        responseKeys: Object.keys(response)
      });
      return response;
    } catch (error) {
      console.error('❌ Admin API: Error fetching properties:', error);
      console.error('❌ Admin API: Error details:', {
        message: error.message,
        endpoint: endpoint,
        isNetworkError: error.isNetworkError
      });
      throw error;
    }
  },
  
  // Keep other property methods using admin routes for admin-specific actions
  approveProperty: (propertyId: string) => apiClient.patch(`/admin/properties/${propertyId}/approve`),
  rejectProperty: (propertyId: string) => apiClient.patch(`/admin/properties/${propertyId}/reject`),
  updateProperty: (propertyId: string, data: any) => apiClient.patch(`/admin/properties/${propertyId}`, data),
  assignPropertyToAgent: (propertyId: string, data: { agentId: string }) => apiClient.patch(`/admin/properties/${propertyId}/assign-agent`, data),
  deleteProperty: (propertyId: string) => apiClient.delete(`/admin/properties/${propertyId}`),

  // Agents
  getAgents: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/agents?${queryString}` : '/admin/agents';
    return apiClient.get(endpoint);
  },

  assignAgent: (propertyId: string, agentId: string) => 
    apiClient.patch(`/admin/properties/${propertyId}/assign-agent`, { agentId }),

  // Payments
  getPayments: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/payments?${queryString}` : '/admin/payments';
    return apiClient.get(endpoint);
  },

  getMonthlyRevenue: () => apiClient.get('/admin/payments/monthly-revenue'),

  // Settings
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (settings: any) => apiClient.put('/admin/settings', settings),

  // Auth
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    apiClient.post('/admin/change-password', data),

  // Stats
  getPropertiesCount: () => apiClient.get('/admin/stats/properties'),
  getAgentsCount: () => apiClient.get('/admin/stats/agents'),
  getUsersCount: () => apiClient.get('/admin/stats/users'),

  // Activity
  getRecentActivity: () => apiClient.get('/admin/activity')
};