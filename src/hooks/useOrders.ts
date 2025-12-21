import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

export interface Order {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount_pkr: number;
  payment_method: 'easypaisa' | 'jazzcash' | 'bank_transfer';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_id: string | null;
  payment_details: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export const useOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (orderData: {
      subscription_id?: string;
      amount_pkr: number;
      payment_method: 'easypaisa' | 'jazzcash' | 'bank_transfer';
      payment_details?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          ...orderData,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useAllOrders = () => {
  return useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payment_status, transaction_id }: { id: string; payment_status: string; transaction_id?: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status, transaction_id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    },
  });
};
