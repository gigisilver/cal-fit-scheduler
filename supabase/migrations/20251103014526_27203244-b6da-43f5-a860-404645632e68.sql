-- Add unique constraint on user_id to allow upsert operations
ALTER TABLE public.google_calendar_connection 
ADD CONSTRAINT google_calendar_connection_user_id_key UNIQUE (user_id);