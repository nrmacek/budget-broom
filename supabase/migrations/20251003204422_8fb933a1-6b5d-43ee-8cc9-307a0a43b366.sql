-- Add is_return column to receipts table to track return/refund receipts
ALTER TABLE public.receipts 
ADD COLUMN is_return boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.receipts.is_return IS 'Indicates whether this receipt represents a return/refund transaction';

-- Create index for faster queries filtering by return status
CREATE INDEX idx_receipts_is_return ON public.receipts(is_return);