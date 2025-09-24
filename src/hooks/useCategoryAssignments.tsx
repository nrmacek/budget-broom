import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CategoryAssignment {
  id: string;
  receipt_id: string;
  line_item_index: number;
  category_id: string;
  source: 'model' | 'user' | 'rule' | 'split';
  confidence?: number;
}

export const useCategoryAssignments = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateLineItemCategory = async (
    receiptId: string,
    lineItemIndex: number,
    categoryId: string,
    source: 'user' | 'rule' = 'user'
  ) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('category_assignments')
        .upsert({
          receipt_id: receiptId,
          line_item_index: lineItemIndex,
          category_id: categoryId,
          source,
          confidence: source === 'user' ? 1.0 : undefined,
        }, {
          onConflict: 'receipt_id,line_item_index'
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      toast({
        variant: "destructive",
        title: "Error updating category",
        description: errorMessage,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCategoryAssignments = async (receiptId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_assignments')
        .select(`
          *,
          categories!inner(id, slug, display_name, icon)
        `)
        .eq('receipt_id', receiptId)
        .order('line_item_index');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category assignments';
      toast({
        variant: "destructive",
        title: "Error fetching categories",
        description: errorMessage,
      });
      return [];
    }
  };

  return {
    loading,
    updateLineItemCategory,
    getCategoryAssignments,
  };
};