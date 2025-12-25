import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRiders() {
  return useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rider: { user_id: string; phone: string; vehicle_type?: string }) => {
      // First add rider role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: rider.user_id, role: 'rider' });
      if (roleError && !roleError.message.includes('duplicate')) throw roleError;
      
      const { data, error } = await supabase
        .from('riders')
        .insert(rider)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
}

export function useUpdateRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; phone?: string; vehicle_type?: string; is_available?: boolean; status?: string }) => {
      const { data, error } = await supabase
        .from('riders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
}

export function useApproveRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, user_id, approved }: { id: string; user_id: string; approved: boolean }) => {
      const status = approved ? 'approved' : 'rejected';
      
      // Update rider status
      const { data, error } = await supabase
        .from('riders')
        .update({ status, is_available: approved })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // If approved, ensure rider role exists
      if (approved) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id, role: 'rider' }, { onConflict: 'user_id,role' });
        if (roleError) console.error('Error adding rider role:', roleError);
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
}

export function useDeleteRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('riders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
}

export function useAvailableRiders() {
  return useQuery({
    queryKey: ['riders', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('is_available', true)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePendingRiders() {
  return useQuery({
    queryKey: ['riders', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
