'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { buyerApi, SavedProperty, ViewedProperty, ScheduledViewing, ActiveOffer } from '@/api/buyer';

interface BuyerData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  otpVerified: boolean;
  termsAccepted: boolean;
  selectedProperty?: any;
  interestExpressed: boolean;
  unlockFeeAcknowledgment: boolean;
  noBypassing: boolean;
  responsibilityAcknowledgment: boolean;
}

interface RecentActivity {
  id: string;
  type: 'property_view' | 'property_save' | 'viewing_scheduled' | 'offer_submitted';
  message: string;
  time: string;
  propertyId?: string;
}

interface BuyerContextType {
  // Registration flow data
  buyerData: BuyerData;
  currentPhase: number;
  updateBuyerData: (data: Partial<BuyerData>) => void;
  setPhase: (phase: number) => void;
  nextPhase: () => void;
  prevPhase: () => void;
  canProceedToPhase: (phase: number) => boolean;
  resetBuyerData: () => void;
  
  // Dashboard data
  savedProperties: SavedProperty[];
  viewedProperties: ViewedProperty[];
  scheduledViewings: ScheduledViewing[];
  activeOffers: ActiveOffer[];
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
  fetchBuyerData: () => Promise<void>;
}

const initialBuyerData: BuyerData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  otpVerified: false,
  termsAccepted: false,
  interestExpressed: false,
  unlockFeeAcknowledgment: false,
  noBypassing: false,
  responsibilityAcknowledgment: false,
};

const BuyerContext = createContext<BuyerContextType | undefined>(undefined);

export const BuyerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Registration flow state
  const [buyerData, setBuyerData] = useState<BuyerData>(initialBuyerData);
  const [currentPhase, setCurrentPhase] = useState(1);
  
  // Dashboard state
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [viewedProperties, setViewedProperties] = useState<ViewedProperty[]>([]);
  const [scheduledViewings, setScheduledViewings] = useState<ScheduledViewing[]>([]);
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration flow methods
  const updateBuyerData = (data: Partial<BuyerData>) => {
    setBuyerData(prev => ({ ...prev, ...data }));
  };

  const setPhase = (phase: number) => {
    if (phase >= 1 && phase <= 3 && canProceedToPhase(phase)) {
      setCurrentPhase(phase);
    }
  };

  const nextPhase = () => {
    if (currentPhase < 3 && canProceedToPhase(currentPhase + 1)) {
      setCurrentPhase(prev => prev + 1);
    }
  };

  const prevPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(prev => prev - 1);
    }
  };

  const canProceedToPhase = (phase: number): boolean => {
    switch (phase) {
      case 1:
        return true;
      case 2:
        return !!(buyerData.name && buyerData.email);
      case 3:
        return buyerData.otpVerified;
      default:
        return false;
    }
  };

  const resetBuyerData = () => {
    setBuyerData(initialBuyerData);
    setCurrentPhase(1);
  };

  // Dashboard methods
  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all buyer data in parallel
      const [savedPropsRes, viewedPropsRes, viewingsRes, offersRes, activityRes] = await Promise.all([
        buyerApi.getSavedProperties({ limit: 10 }),
        buyerApi.getViewedProperties({ limit: 10 }),
        buyerApi.getScheduledViewings({ limit: 10 }),
        buyerApi.getActiveOffers({ limit: 10 }),
        buyerApi.getRecentActivity(10)
      ]);

      setSavedProperties(savedPropsRes.properties || []);
      setViewedProperties(viewedPropsRes.properties || []);
      setScheduledViewings(viewingsRes.viewings || []);
      setActiveOffers(offersRes.offers || []);
      setRecentActivity(activityRes || []);
    } catch (err) {
      console.error('Error fetching buyer data:', err);
      setError('Failed to load buyer data');
    } finally {
      setLoading(false);
    }
  };

  const value: BuyerContextType = {
    // Registration flow
    buyerData,
    currentPhase,
    updateBuyerData,
    setPhase,
    nextPhase,
    prevPhase,
    canProceedToPhase,
    resetBuyerData,
    
    // Dashboard data
    savedProperties,
    viewedProperties,
    scheduledViewings,
    activeOffers,
    recentActivity,
    loading,
    error,
    fetchBuyerData,
  };

  return (
    <BuyerContext.Provider value={value}>
      {children}
    </BuyerContext.Provider>
  );
};

// Export both hook names for compatibility
export const useBuyerContext = () => {
  const context = useContext(BuyerContext);
  if (context === undefined) {
    throw new Error('useBuyerContext must be used within a BuyerProvider');
  }
  return context;
};

// Export the hook with the name expected by the dashboard
export const useBuyer = () => {
  const context = useContext(BuyerContext);
  if (context === undefined) {
    throw new Error('useBuyer must be used within a BuyerProvider');
  }
  return context;
};