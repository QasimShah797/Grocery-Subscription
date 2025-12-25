-- Add policy to allow users to insert their own rider application
CREATE POLICY "Users can apply as riders"
ON public.riders
FOR INSERT
WITH CHECK (auth.uid() = user_id);