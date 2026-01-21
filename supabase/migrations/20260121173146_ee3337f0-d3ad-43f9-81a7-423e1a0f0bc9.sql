-- Create a function to increment usage that can be called via RPC
CREATE OR REPLACE FUNCTION public.increment_monthly_usage(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipts_processed integer;
BEGIN
  INSERT INTO monthly_usage (user_id, month_start, receipts_processed)
  VALUES (p_user_id, date_trunc('month', now())::date, 1)
  ON CONFLICT (user_id, month_start) 
  DO UPDATE SET 
    receipts_processed = monthly_usage.receipts_processed + 1, 
    updated_at = now()
  RETURNING receipts_processed INTO v_receipts_processed;
  
  RETURN v_receipts_processed;
END;
$$;