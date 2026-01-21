-- Create monthly_usage table for tracking receipt processing limits
CREATE TABLE public.monthly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start date NOT NULL,
  receipts_processed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one row per user per month
  CONSTRAINT monthly_usage_user_month_unique UNIQUE (user_id, month_start)
);

-- Create index for fast user lookups
CREATE INDEX idx_monthly_usage_user_id ON public.monthly_usage(user_id);

-- Enable Row Level Security
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own usage data
CREATE POLICY "Users can view their own usage"
ON public.monthly_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.monthly_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.monthly_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at on changes
CREATE TRIGGER update_monthly_usage_updated_at
BEFORE UPDATE ON public.monthly_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();