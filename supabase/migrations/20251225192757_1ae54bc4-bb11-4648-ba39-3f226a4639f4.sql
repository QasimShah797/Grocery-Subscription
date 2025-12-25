-- Add status column to riders table for approval workflow
ALTER TABLE public.riders 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing riders to approved status
UPDATE public.riders SET status = 'approved' WHERE status = 'pending';