-- Drop the existing restrictive SELECT policies
DROP POLICY IF EXISTS "Riders can view own assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Users can view own delivery status" ON public.delivery_assignments;

-- Recreate as PERMISSIVE policies (default) so either condition grants access
CREATE POLICY "Riders can view own assignments" 
ON public.delivery_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM riders r 
    WHERE r.id = delivery_assignments.rider_id 
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own delivery status" 
ON public.delivery_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = delivery_assignments.order_id 
    AND o.user_id = auth.uid()
  )
);