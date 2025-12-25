import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRiders() {
  return useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*, profiles:user_id(full_name, email)')
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
    mutationFn: async ({ id, ...updates }: { id: string; phone?: string; vehicle_type?: string; is_available?: boolean }) => {
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
        .select('*, profiles:user_id(full_name, email)')
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
