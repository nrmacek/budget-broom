-- Migration script to map existing line item categories to new category system
-- Create a mapping function for old categories to new category slugs
CREATE OR REPLACE FUNCTION map_old_category_to_slug(old_category TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE old_category
    WHEN 'Groceries' THEN RETURN 'groceries';
    WHEN 'Electronics' THEN RETURN 'shopping';
    WHEN 'Clothing' THEN RETURN 'shopping';
    WHEN 'Apparel' THEN RETURN 'shopping';
    WHEN 'Personal Care' THEN RETURN 'personal-care';
    WHEN 'Health and Beauty' THEN RETURN 'personal-care';
    WHEN 'Health' THEN RETURN 'health-medical';
    WHEN 'Household' THEN RETURN 'household';
    WHEN 'Stationery & Office Supplies' THEN RETURN 'household';
    WHEN 'Dining' THEN RETURN 'dining';
    WHEN 'Transportation' THEN RETURN 'transportation';
    WHEN 'Entertainment' THEN RETURN 'entertainment';
    WHEN 'Sporting Goods' THEN RETURN 'entertainment';
    ELSE RETURN 'other';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create category assignments for all existing line items
DO $$
DECLARE
  receipt_record RECORD;
  line_item JSONB;
  item_index INTEGER;
  old_category TEXT;
  new_category_id UUID;
  confidence_score NUMERIC;
BEGIN
  -- Loop through all receipts
  FOR receipt_record IN SELECT id, line_items FROM public.receipts
  LOOP
    item_index := 0;
    
    -- Loop through each line item in the receipt
    FOR line_item IN SELECT * FROM jsonb_array_elements(receipt_record.line_items)
    LOOP
      -- Extract category and confidence from line item
      old_category := line_item->>'category';
      confidence_score := COALESCE((line_item->>'confidence')::NUMERIC, 0.8);
      
      -- Get the new category ID based on the mapping
      SELECT id INTO new_category_id 
      FROM public.categories 
      WHERE slug = map_old_category_to_slug(old_category);
      
      -- Insert category assignment if category found
      IF new_category_id IS NOT NULL THEN
        INSERT INTO public.category_assignments (
          receipt_id,
          line_item_index,
          category_id,
          source,
          confidence
        ) VALUES (
          receipt_record.id,
          item_index,
          new_category_id,
          'model',
          confidence_score
        )
        ON CONFLICT (receipt_id, line_item_index) DO NOTHING;
      END IF;
      
      item_index := item_index + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: Created category assignments for existing receipts';
END $$;

-- Drop the temporary mapping function
DROP FUNCTION map_old_category_to_slug(TEXT);