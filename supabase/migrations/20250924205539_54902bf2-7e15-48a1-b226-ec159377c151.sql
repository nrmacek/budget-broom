-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name
  is_system BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create category_rules table
CREATE TABLE public.category_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('merchant', 'keyword')),
  pattern TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create category_assignments table
CREATE TABLE public.category_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.receipts(id),
  line_item_index INTEGER NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  source TEXT NOT NULL CHECK (source IN ('model', 'user', 'rule', 'split')),
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(receipt_id, line_item_index)
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_assignments ENABLE ROW LEVEL SECURITY;

-- Categories are readable by everyone (system categories)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Only system can create/update system categories
CREATE POLICY "Only system can modify system categories" 
ON public.categories 
FOR ALL 
USING (false);

-- Category rules policies
CREATE POLICY "Users can view their own category rules" 
ON public.category_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category rules" 
ON public.category_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category rules" 
ON public.category_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category rules" 
ON public.category_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Category assignments policies (tied to receipt ownership)
CREATE POLICY "Users can view assignments for their receipts" 
ON public.category_assignments 
FOR SELECT 
USING (
  receipt_id IN (
    SELECT id FROM public.receipts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create assignments for their receipts" 
ON public.category_assignments 
FOR INSERT 
WITH CHECK (
  receipt_id IN (
    SELECT id FROM public.receipts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update assignments for their receipts" 
ON public.category_assignments 
FOR UPDATE 
USING (
  receipt_id IN (
    SELECT id FROM public.receipts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete assignments for their receipts" 
ON public.category_assignments 
FOR DELETE 
USING (
  receipt_id IN (
    SELECT id FROM public.receipts WHERE user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_rules_updated_at
BEFORE UPDATE ON public.category_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_assignments_updated_at
BEFORE UPDATE ON public.category_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 12 system categories with Lucide icons
INSERT INTO public.categories (slug, display_name, icon, is_system) VALUES
('groceries', 'Groceries', 'ShoppingCart', true),
('shopping', 'Shopping/Retail', 'ShoppingBag', true),
('personal-care', 'Personal Care', 'Sparkles', true),
('household', 'Household & Supplies', 'Home', true),
('health-medical', 'Health & Medical', 'Heart', true),
('transportation', 'Transportation', 'Car', true),
('dining', 'Dining & Takeout', 'Utensils', true),
('entertainment', 'Entertainment & Leisure', 'Gamepad2', true),
('kids-education', 'Kids & Education', 'GraduationCap', true),
('bills-utilities', 'Bills & Utilities', 'Zap', true),
('financial', 'Financial & Insurance', 'CreditCard', true),
('other', 'Other', 'MoreHorizontal', true);

-- Create indexes for performance
CREATE INDEX idx_category_assignments_receipt_id ON public.category_assignments(receipt_id);
CREATE INDEX idx_category_assignments_category_id ON public.category_assignments(category_id);
CREATE INDEX idx_category_rules_user_id ON public.category_rules(user_id);
CREATE INDEX idx_category_rules_enabled ON public.category_rules(enabled);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_is_system ON public.categories(is_system);