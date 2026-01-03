-- Drop the old status check constraint
ALTER TABLE public.delivery_assignments DROP CONSTRAINT delivery_assignments_status_check;

-- Add new constraint with additional statuses for daily delivery tracking
ALTER TABLE public.delivery_assignments ADD CONSTRAINT delivery_assignments_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'assigned'::text, 'picked_up'::text, 'delivered'::text, 'cancelled'::text, 'in_progress'::text, 'completed'::text]));