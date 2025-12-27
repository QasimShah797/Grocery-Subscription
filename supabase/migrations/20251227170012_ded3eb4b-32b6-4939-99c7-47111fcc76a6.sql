-- Drop the problematic policy
DROP POLICY IF EXISTS "Riders can view assigned orders" ON public.orders;

-- Create a security definer function to check if user is a rider with assigned orders
CREATE OR REPLACE FUNCTION public.is_rider_assigned_to_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM delivery_assignments da
    JOIN riders r ON da.rider_id = r.id
    WHERE da.order_id = _order_id 
    AND r.user_id = auth.uid()
  )
$$;

-- Recreate policy using the security definer function
CREATE POLICY "Riders can view assigned orders" 
ON public.orders 
FOR SELECT 
USING (public.is_rider_assigned_to_order(id));