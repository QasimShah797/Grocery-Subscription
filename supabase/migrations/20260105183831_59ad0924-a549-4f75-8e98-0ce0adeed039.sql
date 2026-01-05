-- Drop the existing foreign key constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_subscription_id_fkey;

-- Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE public.orders 
ADD CONSTRAINT orders_subscription_id_fkey 
FOREIGN KEY (subscription_id) 
REFERENCES public.subscriptions(id) 
ON DELETE SET NULL;