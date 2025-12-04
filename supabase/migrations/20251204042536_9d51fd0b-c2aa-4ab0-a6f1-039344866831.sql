-- Fix search path for number generation functions
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'RCP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('receipt_number_seq')::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('certificate_number_seq')::TEXT, 5, '0');
END;
$$;