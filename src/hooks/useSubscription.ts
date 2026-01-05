import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type SubscriptionType = Database['public']['Enums']['subscription_type'];
type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

export interface Subscription {
  id: string;
  user_id: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  total_pkr: number | null;
  next_renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price_pkr: number;
    image_url: string | null;
    category: string;
  };
}

// Fetch all user subscriptions (not just single active one)
export function useUserSubscriptions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!user,
  });
}

// Legacy hook for backward compatibility - returns first active subscription
export function useSubscription() {
  const { data: subscriptions } = useUserSubscriptions();
  
  return {
    data: subscriptions?.find(s => s.status === 'active') || subscriptions?.[0] || null,
    isLoading: false,
  };
}

export function useSubscriptionItems(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-items', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];
      
      const { data, error } = await supabase
        .from('subscription_items')
        .select(`
          *,
          product:products(id, name, price_pkr, image_url, category)
        `)
        .eq('subscription_id', subscriptionId);
      
      if (error) throw error;
      return data as SubscriptionItem[];
    },
    enabled: !!subscriptionId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (type: SubscriptionType) => {
      if (!user) throw new Error('Must be logged in');
      
      const nextRenewal = new Date();
      if (type === 'weekly') {
        nextRenewal.setDate(nextRenewal.getDate() + 7);
      } else if (type === 'monthly') {
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      } else {
        // yearly
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          type,
          status: 'active',
          total_pkr: 0,
          next_renewal_date: nextRenewal.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription created!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAddToSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subscriptionId, productId, quantity = 1 }: { subscriptionId: string; productId: string; quantity?: number }) => {
      // Check if item already exists
      const { data: existing } = await supabase
        .from('subscription_items')
        .select('id, quantity')
        .eq('subscription_id', subscriptionId)
        .eq('product_id', productId)
        .single();
      
      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('subscription_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('subscription_items')
          .insert({
            subscription_id: subscriptionId,
            product_id: productId,
            quantity,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-items'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Added to subscription!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSubscriptionItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity < 1) {
        // Delete if quantity is 0
        const { error } = await supabase
          .from('subscription_items')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_items')
          .update({ quantity })
          .eq('id', id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-items'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveFromSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('subscription_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-items'] });
      toast.success('Removed from subscription');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      // First delete all subscription items
      await supabase
        .from('subscription_items')
        .delete()
        .eq('subscription_id', subscriptionId);
      
      // Then delete the subscription
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subscription> & { id: string }) => {
      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
