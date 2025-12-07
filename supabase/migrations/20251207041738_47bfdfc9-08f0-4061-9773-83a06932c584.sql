-- Add receipt_type column to receipts table for GA/GT selection
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS receipt_type text DEFAULT 'GA' CHECK (receipt_type IN ('GA', 'GT'));