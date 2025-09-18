'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components';
import Sidebar from '@/components/main/Sidebar';
import { sellerApi } from '@/api/seller';
import { propertiesApi } from '@/api/properties';
import { Property } from '@/types/api';
import { cashOffersApi } from '@/api/cashOffers';
import { addonsApi } from '@/api/addons';
import { inspectionsApi } from '@/api/inspections';
import { corelogicApi } from '@/api/corelogic';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error message component
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <p className="text-red-600 mb-2">{message}</p>
    <button 
      onClick={onRetry}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
    >
      Try Again
    </button>
  </div>
);

interface SellerStats {
  totalOffers: number;
  pendingOffers: number;
  acceptedOffers: number;
  averageOfferValue: number;
  totalProperties: number;
  activeProperties: number;
  soldProperties: number;
  averagePropertyValue: number;
  totalViews: number;
  totalInquiries: number;
}

interface EnhancedProperty extends Property {
  inquiries: number;
  pendingInquiries: number;
  views: number;
  primaryImage: string | null;
}

const SellerDashboard = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State management
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [activeListings, setActiveListings] = useState<EnhancedProperty[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [listingsError, setListingsError] = useState<string | null>(null);
  
  // Add missing state variables for Quick Actions
  const [isGettingPriceEstimation, setIsGettingPriceEstimation] = useState(false);
  const [isViewingAddons, setIsViewingAddons] = useState(false);
  const [isGettingCashOffer, setIsGettingCashOffer] = useState(false);
  const [isSchedulingInspection, setIsSchedulingInspection] = useState(false);
  
  // Authentication check
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    
    if (user.role !== 'seller') {
      router.push('/dashboards');
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Get seller ID from authenticated user
  const sellerId = user?.id;
  
  // Fetch seller statistics
  const fetchStats = async () => {
    if (!sellerId) return;
    
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      
      const response = await sellerApi.getSellerOverview(sellerId);
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStatsError('Failed to load dashboard statistics');
      // Set empty state for graceful handling
      setStats({
        totalOffers: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
        averageOfferValue: 0,
        totalProperties: 0,
        activeProperties: 0,
        soldProperties: 0,
        averagePropertyValue: 0,
        totalViews: 0,
        totalInquiries: 0
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // Fetch seller's property listings
  const fetchListings = async () => {
    if (!sellerId) return;
    
    try {
      setIsLoadingListings(true);
      setListingsError(null);
      const response = await sellerApi.getSellerListings(sellerId, {
        page: 1,
        limit: 10,
        status: 'active'
      });
      
      // Transform properties to include additional fields - add null check
      const enhancedProperties = (response?.properties || []).map(property => ({
        ...property,
        inquiries: 0, // This would come from API
        pendingInquiries: 0,
        views: property.viewCount || 0,
        primaryImage: property.images?.[0]?.url || null
      }));
      
      setActiveListings(enhancedProperties);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListingsError('Failed to load property listings');
      setActiveListings([]); // Empty state
    } finally {
      setIsLoadingListings(false);
    }
  };
  
  // Load data when component mounts and user is authenticated
  useEffect(() => {
    if (sellerId) {
      fetchStats();
      fetchListings();
    }
  }, [sellerId]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return <LoadingSpinner />;
  }
  
  // Show error if not authenticated
  if (!isAuthenticated || !user || user.role !== 'seller') {
    return null; // Will redirect in useEffect
  }

  // Initial data fetch
  useEffect(() => {
    fetchStats();
    fetchListings();
  }, [sellerId]);

  // Handle edit listing
  const handleEditListing = (propertyId: string) => {
    router.push(`/dashboards/seller/listings/${propertyId}/edit`);
  };

  // Handle adding new listing
  const handleAddListing = async (propertyData: Partial<Property>) => {
    try {
      setIsAddingProperty(true);
      
      // Create property via API
      const newProperty = await propertiesApi.submitProperty({
        ...propertyData,
        owner: sellerId
      });
      
      // Refresh both stats and listings to reflect the new property
      await Promise.all([
        fetchStats(),
        fetchListings()
      ]);
      
      // Show success message (you can implement toast notifications)
      console.log('Property added successfully:', newProperty);
      
    } catch (error) {
      console.error('Error adding property:', error);
      // Handle error (show error message to user)
    } finally {
      setIsAddingProperty(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      // Update property status via API
      await propertiesApi.updateProperty(propertyId, { status: newStatus });
      
      // Refresh listings to show updated status
      await fetchListings();
      
      // Optionally refresh stats if status change affects them
      if (newStatus === 'sold' || newStatus === 'active') {
        await fetchStats();
      }
      
    } catch (error) {
      console.error('Error updating property status:', error);
      // Handle error
    }
  };

  // Add missing handler functions after the existing handlers
  
  // Handle price estimation
  const handleGetPriceEstimation = async () => {
    try {
      setIsGettingPriceEstimation(true);
      
      // Get price estimation from CoreLogic API
      const estimation = await corelogicApi.getPriceEstimation({
        address: 'property-address', // You'll need to get this from selected property
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        landSize: 500
      });
      
      // Navigate to results page or show modal with estimation
      router.push(`/dashboards/seller/price-estimation?result=${estimation.estimatedValue}`);
      
    } catch (error) {
      console.error('Error getting price estimation:', error);
      // Handle error (show error message to user)
    } finally {
      setIsGettingPriceEstimation(false);
    }
  };

  // Handle view add-ons
  const handleViewAddons = async () => {
    try {
      setIsViewingAddons(true);
      
      // Navigate to add-ons page (the page will fetch data itself)
      router.push('/dashboards/seller/addons');
      
    } catch (error) {
      console.error('Error navigating to add-ons:', error);
      // Handle error
    } finally {
      setIsViewingAddons(false);
    }
  };

  // Handle get cash offer
  const handleGetCashOffer = async () => {
    try {
      setIsGettingCashOffer(true);
      
      // Submit cash offer request
      const offerRequest = await cashOffersApi.submitCashOfferRequest({
        sellerId: sellerId,
        propertyId: 'selected-property-id', // You'll need to implement property selection
        requestedAmount: 0, // Optional - let them make an offer
        urgency: 'standard'
      });
      
      // Navigate to cash offer details or show success message
      router.push(`/dashboards/seller/cash-offers/${offerRequest.id}`);
      
    } catch (error) {
      console.error('Error submitting cash offer request:', error);
      // Handle error
    } finally {
      setIsGettingCashOffer(false);
    }
  };

  // Handle schedule inspection
  const handleScheduleInspection = async () => {
    try {
      setIsSchedulingInspection(true);
      
      // Navigate to inspection scheduling page
      router.push('/dashboards/seller/schedule-inspection');
      
    } catch (error) {
      console.error('Error navigating to inspection scheduling:', error);
      // Handle error
    } finally {
      setIsSchedulingInspection(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        logo="/logo.svg"
        logoText=""
        navigationItems={[
          { label: 'Dashboard', href: '/dashboards/seller', isActive: true },
          { label: 'Listings', href: '/dashboards/seller/listings', isActive: false },
          { label: 'Offers', href: '/dashboards/seller/offers', isActive: false },
          { label: 'Analytics', href: '/dashboards/seller/analytics', isActive: false },
        ]}
        ctaText="Account"
        ctaHref="/dashboards/seller/account"
      />
      
      <div className="flex">
        <Sidebar userType="seller" userId="1" />
        
        <main className="flex-1 ml-64">
          <div className="pt-16 sm:pt-20 md:pt-24">
            {/* Orange Header Section */}
            <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Seller Dashboard
                  </h1>
                  <p className="text-xl text-orange-100 max-w-3xl mx-auto">
                    Manage your property listings, track offers, and control your selling journey.
                  </p>
                </div>
              </div>
            </section>

            {/* Main Content */}
            <section className="py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Price Estimation Section */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Estimation</h2>
                  <p className="text-gray-600 mb-6">Get an accurate price estimation for your property using CoreLogic data.</p>
                  <button 
                    onClick={handleGetPriceEstimation}
                    disabled={isGettingPriceEstimation}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isGettingPriceEstimation ? 'Loading...' : 'Get Price Estimation'}
                  </button>
                </div>

                {/* Quick Actions Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Add Property Card */}
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-blue-600">+</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Property</h3>
                      <p className="text-gray-600 text-sm mb-4">Create a new property listing with detailed information and media.</p>
                      <button 
                        onClick={() => router.push('/dashboards/seller/add-property')}
                        disabled={isAddingProperty}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {isAddingProperty ? 'Adding...' : 'Add Property'}
                      </button>
                    </div>

                    {/* Marketing Add-ons Card */}
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-purple-600">📱</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Add-ons</h3>
                      <p className="text-gray-600 text-sm mb-4">Enhance your listings with professional photography, drone footage, and more.</p>
                      <button 
                        onClick={handleViewAddons}
                        disabled={isViewingAddons}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {isViewingAddons ? 'Loading...' : 'View Add-ons'}
                      </button>
                    </div>

                    {/* Get Cash Offer Card */}
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-orange-600">💰</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Cash Offer</h3>
                      <p className="text-gray-600 text-sm mb-4">Receive a competitive cash offer for your property within 24 hours.</p>
                      <button 
                        onClick={handleGetCashOffer}
                        disabled={isGettingCashOffer}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {isGettingCashOffer ? 'Loading...' : 'Get Offer'}
                      </button>
                    </div>

                    {/* Schedule Inspection Card */}
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-blue-600">📅</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Inspection</h3>
                      <p className="text-gray-600 text-sm mb-4">Book a property inspection to get a detailed assessment.</p>
                      <button 
                        onClick={handleScheduleInspection}
                        disabled={isSchedulingInspection}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {isSchedulingInspection ? 'Loading...' : 'Schedule'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {isLoadingStats ? (
                    <div className="col-span-full">
                      <LoadingSpinner />
                    </div>
                  ) : stats ? (
                    <>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Total Offers</h3>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOffers}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Pending Offers</h3>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pendingOffers}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Accepted Offers</h3>
                        <p className="text-2xl font-bold text-green-600">{stats.acceptedOffers}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Average Value</h3>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.averageOfferValue?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-full">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-gray-500 text-lg">No data available</p>
                        <p className="text-gray-400 text-sm mt-2">Statistics will appear here once you have property activity</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Listings Section */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Your Properties</h3>
                  </div>
                  
                  {isLoadingListings ? (
                    <LoadingSpinner />
                  ) : activeListings.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 text-lg mb-2">No data available</p>
                      <p className="text-gray-400 text-sm mb-4">You haven't added any properties yet</p>
                      <button 
                        onClick={() => router.push('/dashboards/seller/add-property')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add Your First Property
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {activeListings.map((property) => (
                        <div key={property.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {property.primaryImage && (
                                <img 
                                  src={property.primaryImage} 
                                  alt={property.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">{property.title}</h4>
                                <p className="text-gray-600">{property.address}</p>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                  <span>{property.beds} beds</span>
                                  <span>{property.baths} baths</span>
                                  <span>{property.size} sqft</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                ${property.price?.toLocaleString()}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>{property.views} views</span>
                                <span>{property.inquiries} inquiries</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  property.status === 'active' ? 'bg-green-100 text-green-800' :
                                  property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {property.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleEditListing(property.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <select 
                                value={property.status}
                                onChange={(e) => handleStatusChange(property.id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="sold">Sold</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;