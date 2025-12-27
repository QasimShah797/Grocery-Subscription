-- Add policy for riders to view orders that are assigned to them
CREATE POLICY "Riders can view assigned orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM delivery_assignments da
    JOIN riders r ON da.rider_id = r.id
    WHERE da.order_id = orders.id 
    AND r.user_id = auth.uid()
  )
);