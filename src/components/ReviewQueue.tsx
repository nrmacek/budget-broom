import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryAssignments } from '@/hooks/useCategoryAssignments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/pages/Categories';
import { AlertTriangle, CheckSquare, Search, Filter } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LineItem, CategoryAssignment } from '@/types';

interface ReviewItem {
  receipt_id: string;
  line_item_index: number;
  store_name: string;
  receipt_date: string;
  item_description: string;
  item_total: number;
  current_category_id?: string;
  current_category_name?: string;
  confidence?: number;
  needs_review_reason: 'low_confidence' | 'uncategorized' | 'auto_assigned';
}

interface ReviewQueueProps {
  dateRange: DateRange;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ dateRange }) => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { updateLineItemCategory } = useCategoryAssignments();
  const { toast } = useToast();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [filterReason, setFilterReason] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchReviewItems();
    }
  }, [user, dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      case '3months':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return threeMonthsAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return yearAgo.toISOString();
      case 'all':
      default:
        return '2000-01-01';
    }
  };

  const fetchReviewItems = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch receipts with their line items and any existing category assignments
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select(`
          id,
          store_name,
          date,
          line_items,
          category_assignments (
            line_item_index,
            category_id,
            confidence,
            categories (
              display_name
            )
          )
        `)
        .eq('user_id', user?.id)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: ReviewItem[] = [];

      receipts?.forEach((receipt) => {
        (receipt.line_items as LineItem[]).forEach((lineItem: LineItem, index: number) => {
          const assignment = (receipt.category_assignments as any[])?.find((a: any) => a.line_item_index === index);
          const confidence = assignment?.confidence || 0;
          
          // Determine if item needs review
          let needsReview = false;
          let reason: ReviewItem['needs_review_reason'] = 'uncategorized';

          if (!assignment) {
            needsReview = true;
            reason = 'uncategorized';
          } else if (confidence < 0.75) {
            needsReview = true;
            reason = 'low_confidence';
          }

          if (needsReview) {
            items.push({
              receipt_id: receipt.id,
              line_item_index: index,
              store_name: receipt.store_name,
              receipt_date: receipt.date,
              item_description: lineItem.description || 'Unknown Item',
              item_total: lineItem.total || 0,
              current_category_id: assignment?.category_id,
              current_category_name: assignment?.categories?.display_name,
              confidence: confidence,
              needs_review_reason: reason,
            });
          }
        });
      });

      setReviewItems(items);
    } catch (error) {
      console.error('Error fetching review items:', error);
      toast({
        variant: "destructive",
        title: "Error loading review items",
        description: "Failed to load items needing review. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (itemKey: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemKey);
      } else {
        newSet.delete(itemKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allKeys = filteredItems.map(item => `${item.receipt_id}-${item.line_item_index}`);
      setSelectedItems(new Set(allKeys));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkCategorize = async () => {
    if (!bulkCategoryId || selectedItems.size === 0) {
      toast({
        variant: "destructive",
        title: "Invalid selection",
        description: "Please select items and a category before proceeding.",
      });
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(itemKey => {
        const [receiptId, lineItemIndex] = itemKey.split('-');
        return updateLineItemCategory(receiptId, parseInt(lineItemIndex), bulkCategoryId, 'user');
      });

      const results = await Promise.all(promises);
      const successful = results.filter(result => result).length;

      if (successful > 0) {
        toast({
          title: "Bulk categorization complete",
          description: `Successfully categorized ${successful} items.`,
        });
        
        // Refresh the review items
        await fetchReviewItems();
        setSelectedItems(new Set());
        setBulkCategoryId('');
      }
    } catch (error) {
      console.error('Error during bulk categorization:', error);
      toast({
        variant: "destructive",
        title: "Bulk categorization failed",
        description: "Some items could not be categorized. Please try again.",
      });
    }
  };

  const handleSingleCategorize = async (item: ReviewItem, categoryId: string) => {
    const success = await updateLineItemCategory(
      item.receipt_id,
      item.line_item_index,
      categoryId,
      'user'
    );
    
    if (success) {
      // Remove the item from review queue
      setReviewItems(prev => 
        prev.filter(i => 
          !(i.receipt_id === item.receipt_id && i.line_item_index === item.line_item_index)
        )
      );
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.MoreHorizontal;
    return IconComponent;
  };

  const getReasonBadgeProps = (reason: ReviewItem['needs_review_reason']) => {
    switch (reason) {
      case 'uncategorized':
        return { variant: 'destructive' as const, label: 'Uncategorized' };
      case 'low_confidence':
        return { variant: 'outline' as const, label: 'Low Confidence' };
      case 'auto_assigned':
        return { variant: 'secondary' as const, label: 'Auto-Assigned' };
      default:
        return { variant: 'secondary' as const, label: 'Needs Review' };
    }
  };

  const filteredItems = reviewItems.filter(item => {
    if (filterReason === 'all') return true;
    return item.needs_review_reason === filterReason;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-6 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              <SelectItem value="low_confidence">Low Confidence</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2">
            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {[...categories].sort((a, b) => a.display_name.localeCompare(b.display_name)).map((category) => {
                  const IconComponent = getCategoryIcon(category.icon);
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <IconComponent className="h-3 w-3" />
                        <span>{category.display_name}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkCategorize} disabled={!bulkCategoryId}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Categorize ({selectedItems.size})
            </Button>
          </div>
        )}
      </div>

      {/* Select All Checkbox */}
      {filteredItems.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all {filteredItems.length} items
          </span>
        </div>
      )}

      {/* Review Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const itemKey = `${item.receipt_id}-${item.line_item_index}`;
            const badgeProps = getReasonBadgeProps(item.needs_review_reason);
            
            return (
              <Card key={itemKey} className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedItems.has(itemKey)}
                    onCheckedChange={(checked) => handleItemSelection(itemKey, checked as boolean)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium truncate">{item.item_description}</h3>
                      <Badge variant={badgeProps.variant}>{badgeProps.label}</Badge>
                      {item.confidence !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(item.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.store_name}</span>
                      <span>{item.receipt_date}</span>
                      <span className="font-medium">${item.item_total.toFixed(2)}</span>
                      {item.current_category_name && (
                        <span>Current: {item.current_category_name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.current_category_id || ''}
                      onValueChange={(categoryId) => handleSingleCategorize(item, categoryId)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[...categories].sort((a, b) => a.display_name.localeCompare(b.display_name)).map((category) => {
                          const IconComponent = getCategoryIcon(category.icon);
                          return (
                            <SelectItem key={category.id} value={category.id}>
                              <span className="flex items-center gap-2">
                                <IconComponent className="h-3 w-3" />
                                <span>{category.display_name}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">All items are properly categorized!</p>
          <p className="text-sm">Great job keeping your receipts organized.</p>
        </div>
      )}
    </div>
  );
};