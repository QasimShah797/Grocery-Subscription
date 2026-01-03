-- Create a table to track daily deliveries for subscriptions
CREATE TABLE public.daily_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_assignment_id uuid NOT NULL REFERENCES public.delivery_assignments(id) ON DELETE CASCADE,
    day_number integer NOT NULL,
    delivery_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    delivered_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(delivery_assignment_id, day_number)
);

-- Enable RLS
ALTER TABLE public.daily_deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage daily deliveries"
ON public.daily_deliveries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders can view own daily deliveries"
ON public.daily_deliveries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM delivery_assignments da
        JOIN riders r ON da.rider_id = r.id
        WHERE da.id = daily_deliveries.delivery_assignment_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Riders can update own daily deliveries"
ON public.daily_deliveries
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM delivery_assignments da
        JOIN riders r ON da.rider_id = r.id
        WHERE da.id = daily_deliveries.delivery_assignment_id
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view own daily deliveries"
ON public.daily_deliveries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM delivery_assignments da
        JOIN orders o ON da.order_id = o.id
        WHERE da.id = daily_deliveries.delivery_assignment_id
        AND o.user_id = auth.uid()
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_deliveries_updated_at
BEFORE UPDATE ON public.daily_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add total_days and delivered_days columns to delivery_assignments for quick reference
ALTER TABLE public.delivery_assignments 
ADD COLUMN total_days integer DEFAULT 7,
ADD COLUMN delivered_days integer DEFAULT 0;