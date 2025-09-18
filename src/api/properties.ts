import { apiClient } from '../lib/api-client';
import { Property, PropertySearchParams, PaginatedPropertiesResponse, FilterOptionsData } from '../types/api';

interface PaginationParams {
  page?: number;
  limit?: number;
}

// Backend response format
interface BackendResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const propertiesApi = {
  async getProperties(params: PropertySearchParams = {}): Promise<PaginatedPropertiesResponse> {
    console.log('🔄 API: Getting properties from database', params);
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('🔗 API URL:', url);
    
    try {
      const response = await apiClient.get<BackendResponse<Property[]>>(url);
      console.log('✅ API: Properties fetched successfully', response);
      
      // Transform backend response to expected frontend format
      return {
        properties: response.data || [],
        total: response.meta?.total || response.data?.length || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 0, // 0 means no limit
        totalPages: response.meta?.totalPages || 1
      };
    } catch (error) {
      console.error('❌ API: Error fetching properties', error);
      return {
        properties: [],
        total: 0,
        page: 1,
        limit: 0,
        totalPages: 0
      };
    }
  },

  async getFeaturedProperties(limit: number = 6): Promise<Property[]> {
    console.log('🔄 API: Getting featured properties from database', { limit });
    
    try {
      const response = await this.getProperties({ featured: 'true', limit: limit.toString() });
      console.log('✅ API: Featured properties fetched successfully', response.properties);
      return response.properties;
    } catch (error) {
      console.error('❌ API: Error fetching featured properties', error);
      return [];
    }
  },

  // Add new function to fetch property by ID
  async getPropertyById(id: string): Promise<{ success: boolean; data?: Property; message?: string }> {
    try {
      console.log('🔍 Fetching property by ID:', id);
      const response = await apiClient.get<BackendResponse<Property>>(`/properties/${id}`);
      console.log('📦 Raw API response:', response);
      
      // Handle the BackendResponse structure correctly
      if (response.success && response.data) {
        console.log('✅ Property fetched successfully:', response.data);
        return {
          success: true,
          data: response.data
        };
      } else {
        console.log('❌ Property not found or API returned error:', response.message);
        return {
          success: false,
          message: response.message || 'Property not found'
        };
      }
    } catch (error: any) {
      console.error('💥 Error fetching property:', error);
      
      // Handle 404 errors specifically
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Property not found'
        };
      }
      
      return {
        success: false,
        message: 'Failed to fetch property details'
      };
    }
  },

  async searchProperties(params: PropertySearchParams): Promise<PaginatedPropertiesResponse> {
    return this.getProperties(params);
  },

  async createProperty(propertyData: Partial<Property>): Promise<Property> {
    console.log('🔄 API: Creating property in database', propertyData);
    
    try {
      const response = await apiClient.post<BackendResponse<Property>>('/properties', propertyData);
      console.log('✅ API: Property created successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Error creating property', error);
      throw error;
    }
  },

  async submitProperty(propertyData: Partial<Property>): Promise<Property> {
    return this.createProperty(propertyData);
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    console.log('🔄 API: Updating property in database', { id, updates });
    
    try {
      const response = await apiClient.put<BackendResponse<Property>>(`/properties/${id}`, updates);
      console.log('✅ API: Property updated successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Error updating property', error);
      throw error;
    }
  },

  async deleteProperty(id: string): Promise<void> {
    console.log('🔄 API: Deleting property from database', { id });
    
    try {
      await apiClient.delete(`/properties/${id}`);
      console.log('✅ API: Property deleted successfully');
    } catch (error) {
      console.error('❌ API: Error deleting property', error);
      throw error;
    }
  },

  async getFilterOptions(): Promise<FilterOptionsData> {
    try {
      const response = await apiClient.get('/properties/filter-options');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Return default structure on error
      return {
        propertyTypes: [],
        cities: [],
        priceRange: { min: 0, max: 1000000 },
        sizeRange: { min: 0, max: 10000 }
      };
    }
  },

  // Add missing getFavoriteProperties function
  async getFavoriteProperties(userId?: string): Promise<Property[]> {
    try {
      const endpoint = userId ? `/properties/favorites/${userId}` : '/properties/favorites';
      const response = await apiClient.get(endpoint);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching favorite properties:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  },
  
  async createPropertyWithFiles(formData: FormData): Promise<{success: boolean, data?: Property, error?: string}> {
    console.log('🔄 API: Creating property with files');
    
    try {
      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/properties/upload', {
        method: 'POST',
        headers,
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ API: Error creating property with files:', error);
      return {
        success: false,
        error: error.message || 'Failed to create property'
      };
    }
  },
};
export default propertiesApi;
export const submitProperty = propertiesApi.submitProperty;
export const getFeaturedProperties = propertiesApi.getFeaturedProperties;
export const getFilterOptions = propertiesApi.getFilterOptions;
