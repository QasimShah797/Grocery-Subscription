-- Add rider role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rider';

-- Create riders table for rider-specific info
CREATE TABLE public.riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone text NOT NULL,
  vehicle_type text DEFAULT 'bike',
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on riders
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- Riders can view their own profile
CREATE POLICY "Riders can view own profile" ON public.riders
  FOR SELECT USING (auth.uid() = user_id);

-- Riders can update their own profile  
CREATE POLICY "Riders can update own profile" ON public.riders
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all riders
CREATE POLICY "Admins can manage riders" ON public.riders
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create delivery assignments table
CREATE TABLE public.delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rider_id uuid REFERENCES public.riders(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')),
  assigned_at timestamp with time zone,
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on delivery_assignments
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Riders can view their own assignments
CREATE POLICY "Riders can view own assignments" ON public.delivery_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM riders r WHERE r.id = rider_id AND r.user_id = auth.uid())
  );

-- Riders can update their own assignments
CREATE POLICY "Riders can update own assignments" ON public.delivery_assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM riders r WHERE r.id = rider_id AND r.user_id = auth.uid())
  );

-- Admins can manage all assignments
CREATE POLICY "Admins can manage delivery assignments" ON public.delivery_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Users can view their own order deliveries
CREATE POLICY "Users can view own delivery status" ON public.delivery_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- Create triggers for updated_at
CREATE TRIGGER update_riders_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_assignments_updated_at
  BEFORE UPDATE ON public.delivery_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();