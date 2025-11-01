-- Create table to store Google Calendar OAuth tokens
CREATE TABLE public.google_calendar_connection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (for future multi-user support)
ALTER TABLE public.google_calendar_connection ENABLE ROW LEVEL SECURITY;

-- Allow public access for single-user setup
CREATE POLICY "Allow all access to calendar connection"
ON public.google_calendar_connection
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_calendar_connection_updated_at
BEFORE UPDATE ON public.google_calendar_connection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();