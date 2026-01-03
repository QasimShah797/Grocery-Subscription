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
          orders!inner(id, amount_pkr, payment_status, user_id),
          riders(id, phone)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data?.map(d => (d.orders as any)?.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, address')
          .in('id', userIds);
        
        return data?.map(d => ({
          ...d,
          orders: {
            ...(d.orders as any),
            profiles: profiles?.find(p => p.id === (d.orders as any)?.user_id)
          }
        }));
      }
      
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
        .maybeSingle();
      
      if (riderError) throw riderError;
      if (!rider) return []; // User is not a rider
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(id, amount_pkr, payment_status, payment_details, user_id)
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch customer profiles separately
      const userIds = [...new Set(data?.map(d => (d.orders as any)?.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, address')
          .in('id', userIds);
        
        // Attach profiles to orders
        return data?.map(d => ({
          ...d,
          orders: {
            ...(d.orders as any),
            profiles: profiles?.find(p => p.id === (d.orders as any)?.user_id)
          }
        }));
      }
      
      return data;
    },
  });
}

// Fetch daily deliveries for a specific assignment
export function useDailyDeliveries(assignmentId: string | null) {
  return useQuery({
    queryKey: ['daily_deliveries', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const { data, error } = await supabase
        .from('daily_deliveries')
        .select('*')
        .eq('delivery_assignment_id', assignmentId)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });
}

// Fetch daily deliveries for rider's assignments
export function useRiderDailyDeliveries() {
  return useQuery({
    queryKey: ['rider_daily_deliveries'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: rider } = await supabase
        .from('riders')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!rider) return [];
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_deliveries')
        .select(`
          *,
          delivery_assignments!inner(id, rider_id, total_days, delivered_days, orders!inner(id, amount_pkr, payment_details, user_id))
        `)
        .eq('delivery_assignments.rider_id', rider.id)
        .eq('delivery_date', today)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Fetch customer profiles
      const userIds = [...new Set(data?.map(d => (d.delivery_assignments as any)?.orders?.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone, address')
          .in('id', userIds);
        
        return data?.map(d => ({
          ...d,
          delivery_assignments: {
            ...(d.delivery_assignments as any),
            orders: {
              ...(d.delivery_assignments as any)?.orders,
              profiles: profiles?.find(p => p.id === (d.delivery_assignments as any)?.orders?.user_id)
            }
          }
        }));
      }
      
      return data;
    },
  });
}

export function useCreateDeliveryAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: { order_id: string; rider_id?: string; total_days?: number }) => {
      const totalDays = assignment.total_days || 7;
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .insert({
          order_id: assignment.order_id,
          rider_id: assignment.rider_id,
          status: assignment.rider_id ? 'assigned' : 'pending',
          assigned_at: assignment.rider_id ? new Date().toISOString() : null,
          total_days: totalDays,
          delivered_days: 0,
        })
        .select()
        .single();
      if (error) throw error;
      
      // Create daily delivery records
      if (data && assignment.rider_id) {
        const dailyDeliveries = [];
        const startDate = new Date();
        
        for (let i = 0; i < totalDays; i++) {
          const deliveryDate = new Date(startDate);
          deliveryDate.setDate(startDate.getDate() + i);
          dailyDeliveries.push({
            delivery_assignment_id: data.id,
            day_number: i + 1,
            delivery_date: deliveryDate.toISOString().split('T')[0],
            status: 'pending',
          });
        }
        
        await supabase.from('daily_deliveries').insert(dailyDeliveries);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['daily_deliveries'] });
    },
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rider_id, total_days }: { id: string; rider_id: string; total_days?: number }) => {
      const daysCount = total_days || 7;
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .update({ 
          rider_id, 
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          total_days: daysCount,
          delivered_days: 0,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      
      // Create daily delivery records
      if (data) {
        // First delete any existing daily deliveries
        await supabase.from('daily_deliveries').delete().eq('delivery_assignment_id', id);
        
        const dailyDeliveries = [];
        const startDate = new Date();
        
        for (let i = 0; i < daysCount; i++) {
          const deliveryDate = new Date(startDate);
          deliveryDate.setDate(startDate.getDate() + i);
          dailyDeliveries.push({
            delivery_assignment_id: data.id,
            day_number: i + 1,
            delivery_date: deliveryDate.toISOString().split('T')[0],
            status: 'pending',
          });
        }
        
        await supabase.from('daily_deliveries').insert(dailyDeliveries);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rider_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['daily_deliveries'] });
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

// Mark a daily delivery as delivered
export function useMarkDailyDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assignment_id }: { id: string; assignment_id: string }) => {
      // Update daily delivery status
      const { error: dailyError } = await supabase
        .from('daily_deliveries')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', id);
      if (dailyError) throw dailyError;
      
      // Get current delivered_days and increment
      const { data: assignment } = await supabase
        .from('delivery_assignments')
        .select('delivered_days, total_days')
        .eq('id', assignment_id)
        .single();
      
      const newDeliveredDays = (assignment?.delivered_days || 0) + 1;
      
      // Update the assignment's delivered_days count
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ 
          delivered_days: newDeliveredDays,
          status: newDeliveredDays >= (assignment?.total_days || 0) ? 'completed' : 'in_progress'
        })
        .eq('id', assignment_id);
      if (assignmentError) throw assignmentError;
      
      return { id, newDeliveredDays };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['rider_daily_deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rider_assignments'] });
    },
  });
}
