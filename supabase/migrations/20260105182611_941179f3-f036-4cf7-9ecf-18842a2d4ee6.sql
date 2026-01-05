-- Allow users to delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);