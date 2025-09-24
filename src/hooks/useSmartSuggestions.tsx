import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SmartSuggestion {
  item_pattern: string;
  suggested_category_id: string;
  category_name: string;
  category_icon: string;
  confidence: number;
  usage_count: number;
  last_used: string;
}

export interface CategoryRule {
  id: string;
  pattern: string;
  category_id: string;
  type: string;
  enabled: boolean;
  created_at: string;
}

export const useSmartSuggestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getSuggestionsForItem = async (itemDescription: string): Promise<SmartSuggestion[]> => {
    if (!user || !itemDescription.trim()) return [];

    try {
      setLoading(true);
      
      // First, check for exact user rules
      const { data: rules } = await supabase
        .from('category_rules')
        .select(`
          *,
          categories (
            display_name,
            icon
          )
        `)
        .eq('user_id', user.id)
        .eq('enabled', true);

      const suggestions: SmartSuggestion[] = [];
      const itemLower = itemDescription.toLowerCase();

      // Check user-defined rules
      rules?.forEach(rule => {
        let matches = false;
        const patternLower = rule.pattern.toLowerCase();

        switch (rule.type) {
          case 'exact':
            matches = itemLower === patternLower;
            break;
          case 'contains':
            matches = itemLower.includes(patternLower);
            break;
          case 'keyword':
            matches = patternLower.split(' ').some(keyword => 
              keyword.trim() && itemLower.includes(keyword.trim())
            );
            break;
        }

        if (matches && rule.categories) {
          suggestions.push({
            item_pattern: rule.pattern,
            suggested_category_id: rule.category_id,
            category_name: rule.categories.display_name,
            category_icon: rule.categories.icon,
            confidence: 0.95, // High confidence for user rules
            usage_count: 1,
            last_used: rule.created_at,
          });
        }
      });

      // If no exact rules match, analyze historical patterns
      if (suggestions.length === 0) {
        const historicalSuggestions = await getHistoricalSuggestions(itemDescription);
        suggestions.push(...historicalSuggestions);
      }

      return suggestions.slice(0, 3); // Return top 3 suggestions
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getHistoricalSuggestions = async (itemDescription: string): Promise<SmartSuggestion[]> => {
    try {
      // Get user's historical category assignments for similar items
      const { data: history } = await supabase
        .from('category_assignments')
        .select(`
          category_id,
          line_item_index,
          created_at,
          receipts!inner (
            id,
            line_items,
            user_id
          ),
          categories (
            display_name,
            icon
          )
        `)
        .eq('receipts.user_id', user?.id)
        .eq('source', 'user') // Only user-confirmed assignments
        .limit(500); // Look at recent history

      if (!history) return [];

      const suggestions: { [categoryId: string]: SmartSuggestion } = {};
      const itemLower = itemDescription.toLowerCase();

      history.forEach(assignment => {
        if (!assignment.receipts?.line_items || !assignment.categories) return;

        const lineItems = Array.isArray(assignment.receipts.line_items) 
          ? assignment.receipts.line_items 
          : [];

        lineItems.forEach((item: any, index: number) => {
          if (assignment.line_item_index === index) {
            const itemDesc = (item.description || '').toLowerCase();
            
            // Calculate similarity score based on word overlap
            const similarity = calculateSimilarity(itemLower, itemDesc);
            
            if (similarity > 0.3) { // Threshold for considering items similar
              const categoryId = assignment.category_id;
              
              if (!suggestions[categoryId]) {
                suggestions[categoryId] = {
                  item_pattern: item.description,
                  suggested_category_id: categoryId,
                  category_name: assignment.categories.display_name,
                  category_icon: assignment.categories.icon,
                  confidence: similarity * 0.8, // Historical confidence is lower than rules
                  usage_count: 1,
                  last_used: assignment.created_at || new Date().toISOString(),
                };
              } else {
                // Boost confidence and usage count for repeated patterns
                suggestions[categoryId].usage_count += 1;
                suggestions[categoryId].confidence = Math.min(
                  suggestions[categoryId].confidence + (similarity * 0.1),
                  0.85
                );
              }
            }
          }
        });
      });

      return Object.values(suggestions)
        .sort((a, b) => (b.confidence * b.usage_count) - (a.confidence * a.usage_count))
        .slice(0, 3);
    } catch (error) {
      console.error('Error getting historical suggestions:', error);
      return [];
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => 
        word2.includes(word1) || word1.includes(word2) || 
        levenshteinDistance(word1, word2) <= 1
      )) {
        matches++;
      }
    });
    
    return matches / Math.max(words1.length, words2.length);
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const createCategoryRule = async (
    pattern: string,
    categoryId: string,
    type: 'keyword' | 'exact' | 'contains' = 'contains'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('category_rules')
        .insert({
          user_id: user.id,
          pattern,
          category_id: categoryId,
          type,
          enabled: true,
        });

      if (error) throw error;

      toast({
        title: "Rule created",
        description: `Created categorization rule for "${pattern}"`,
      });

      return true;
    } catch (error) {
      console.error('Error creating category rule:', error);
      toast({
        variant: "destructive",
        title: "Error creating rule",
        description: "Failed to create categorization rule. Please try again.",
      });
      return false;
    }
  };

  const getUserRules = async (): Promise<CategoryRule[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('category_rules')
        .select(`
          *,
          categories (
            display_name,
            icon
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user rules:', error);
      return [];
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('category_rules')
        .update({ enabled })
        .eq('id', ruleId)
        .eq('user_id', user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling rule:', error);
      return false;
    }
  };

  const deleteRule = async (ruleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('category_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      return false;
    }
  };

  return {
    loading,
    getSuggestionsForItem,
    createCategoryRule,
    getUserRules,
    toggleRule,
    deleteRule,
  };
};