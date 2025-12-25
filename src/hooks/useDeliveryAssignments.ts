import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeliveryAssignments() {
  return useQuery({
    queryKey: ['delivery_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(
            id,
            amount_pkr,
            payment_status,
            user_id,
            profiles:user_id(full_name, email, phone, address)
          ),
          riders(id, phone, profiles:user_id(full_name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRiderAssignments() {
  return useQuery({
    queryKey: ['rider_assignments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // First get the rider ID for this user
      const { data: rider, error: riderError } = await supabase
        .from('riders')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (riderError) throw riderError;
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(
            id,
            amount_pkr,
            payment_status,
            user_id,
            profiles:user_id(full_name, email, phone, address)
          )
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDeliveryAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: { order_id: string; rider_id?: string }) => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .insert({
          ...assignment,
          status: assignment.rider_id ? 'assigned' : 'pending',
          assigned_at: assignment.rider_id ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rider_id }: { id: string; rider_id: string }) => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .update({ 
          rider_id, 
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rider_assignments'] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status };
      if (notes) updates.notes = notes;
      if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rider_assignments'] });
    },
  });
}
