-- Update the handle_new_user function to include address and phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, address, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    NEW.email,
    NEW.raw_user_meta_data ->> 'address',
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;