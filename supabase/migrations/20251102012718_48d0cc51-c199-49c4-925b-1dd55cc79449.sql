-- Add user_id column to google_calendar_connection table
ALTER TABLE public.google_calendar_connection
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the insecure policy
DROP POLICY IF EXISTS "Allow all access to calendar connection" ON public.google_calendar_connection;

-- Create secure RLS policies that restrict access to token owner only
CREATE POLICY "Users can view their own calendar connection"
ON public.google_calendar_connection
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connection"
ON public.google_calendar_connection
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connection"
ON public.google_calendar_connection
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar connection"
ON public.google_calendar_connection
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);