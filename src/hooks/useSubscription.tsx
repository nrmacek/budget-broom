import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  product_id?: string;
  price_id?: string;
  subscription_end?: string;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckout: (priceId: string) => Promise<string | null>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Pricing configuration
export const PRICING_CONFIG = {
  plus: {
    monthly_price_id: 'price_1SCgy7Acgun5IiHBgXyrMu86',
    yearly_price_id: 'price_1SCgyZAcgun5IiHBswBIGO2F',
    product_id: 'prod_T8yvk9SURXeAPl',
    name: 'Plus',
    monthly_price: 12,
    yearly_price: 120,
  },
  pro: {
    monthly_price_id: 'price_1SCgyMAcgun5IiHBebAxrygY',
    yearly_price_id: 'price_1SCgykAcgun5IiHBWjp9meQq',
    product_id: 'prod_T8ywO3nikG5DRf',
    name: 'Pro',
    monthly_price: 39,
    yearly_price: 390,
  }
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({ subscribed: false });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const refreshSubscription = async () => {
    if (!user || !session) {
      setSubscriptionData({ subscribed: false });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionData({ subscribed: false });
      } else {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setSubscriptionData({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (priceId: string): Promise<string | null> => {
    if (!session) {
      console.error('User not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error in createCheckout:', error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      console.error('User not authenticated');
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to manage your subscription.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: 'Error',
          description: 'Failed to open billing portal. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Check if the response indicates no customer found
      if (data.error === 'no_customer') {
        toast({
          title: 'No billing history',
          description: data.message || 'Subscribe to a plan first to manage your subscription.',
        });
        return;
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error in openCustomerPortal:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check subscription on auth state changes
  useEffect(() => {
    refreshSubscription();
  }, [user, session]);

  // Auto-refresh subscription every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshSubscription, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [user]);

  const value = {
    subscriptionData,
    loading,
    refreshSubscription,
    createCheckout,
    openCustomerPortal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}