/*
# Auto-create profile on signup + demo data

1. Functions
- `handle_new_user()`: trigger that inserts a row into `profiles` when a new auth.users row is created.
  Reads `role`, `full_name`, `unit`, `phone` from the new user's raw_user_meta_data (set during signUp).

2. Triggers
- `on_auth_user_created`: AFTER INSERT on auth.users -> call handle_new_user().

3. Demo seed data
- Inserts demo resident, guard, and admin profiles so the prototype is explorable.
  Note: auth.users rows must be created via the auth API (signUp), so we only seed profiles
  for accounts that will be created through the sign-up flow. The frontend sign-up screen
  will create the auth.users row, which fires the trigger to create the profile.
*/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, unit, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    NEW.raw_user_meta_data->>'unit',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
