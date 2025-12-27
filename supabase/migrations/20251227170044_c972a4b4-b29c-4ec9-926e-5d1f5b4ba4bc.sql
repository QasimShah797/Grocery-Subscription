-- Drop the old policy that was using inline subquery
DROP POLICY IF EXISTS "Riders can view assigned orders" ON public.orders;

-- Recreate with the security definer function (this was created but policy wasn't updated)
CREATE POLICY "Riders can view assigned orders" 
ON public.orders 
FOR SELECT 
USING (public.is_rider_assigned_to_order(id));