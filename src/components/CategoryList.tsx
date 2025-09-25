import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { DateRange } from '@/pages/Categories';
import { PieChart, TrendingUp, Package } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CategoryAssignment, LineItem } from '@/types';

interface CategoryStats {
  category_id: string;
  category_name: string;
  category_icon: string;
  total_amount: number;
  item_count: number;
  receipt_count: number;
  average_per_item: number;
  percentage_of_total: number;
}

interface CategoryListProps {
  dateRange: DateRange;
}

export const CategoryList: React.FC<CategoryListProps> = ({ dateRange }) => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && categories.length > 0) {
      fetchCategoryStats();
    }
  }, [user, dateRange, categories]);

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

  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch category assignment data
      const { data: assignmentData, error } = await supabase
        .from('category_assignments')
        .select(`
          category_id,
          line_item_index,
          categories!inner(display_name, icon),
          receipts!inner(
            id,
            line_items,
            created_at,
            user_id
          )
        `)
        .eq('receipts.user_id', user?.id)
        .gte('receipts.created_at', dateFilter);

      if (error) throw error;

      // Calculate stats for each category
      const categoryTotals: Record<string, {
        name: string;
        icon: string;
        amount: number;
        itemCount: number;
        receiptIds: Set<string>;
      }> = {};

      let grandTotal = 0;

      assignmentData?.forEach((assignment: any) => {
        const categoryId = assignment.category_id;
        const categoryName = assignment.categories.display_name;
        const categoryIcon = assignment.categories.icon;
        const lineItems = assignment.receipts?.line_items as LineItem[] || [];
        const receiptId = assignment.receipts.id;
        
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = {
            name: categoryName,
            icon: categoryIcon,
            amount: 0,
            itemCount: 0,
            receiptIds: new Set(),
          };
        }

        // Find the corresponding line item by index
        const lineItem = lineItems[assignment.line_item_index];
        if (lineItem) {
          const itemTotal = lineItem.total || 0;
          categoryTotals[categoryId].amount += itemTotal;
          categoryTotals[categoryId].itemCount += 1;
          categoryTotals[categoryId].receiptIds.add(receiptId);
          grandTotal += itemTotal;
        }
      });

      // Convert to CategoryStats array and add calculated fields
      const statsArray: CategoryStats[] = Object.entries(categoryTotals).map(([categoryId, data]) => ({
        category_id: categoryId,
        category_name: data.name,
        category_icon: data.icon,
        total_amount: data.amount,
        item_count: data.itemCount,
        receipt_count: data.receiptIds.size,
        average_per_item: data.itemCount > 0 ? data.amount / data.itemCount : 0,
        percentage_of_total: grandTotal > 0 ? (data.amount / grandTotal) * 100 : 0,
      }));

      // Include categories with no spending
      const categoriesWithSpending = new Set(statsArray.map(s => s.category_id));
      categories.forEach(category => {
        if (!categoriesWithSpending.has(category.id)) {
          statsArray.push({
            category_id: category.id,
            category_name: category.display_name,
            category_icon: category.icon,
            total_amount: 0,
            item_count: 0,
            receipt_count: 0,
            average_per_item: 0,
            percentage_of_total: 0,
          });
        }
      });

      // Sort by total amount descending
      statsArray.sort((a, b) => b.total_amount - a.total_amount);

      setCategoryStats(statsArray);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.MoreHorizontal;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Categories
          </h2>
          <p className="text-muted-foreground">
            Complete breakdown of spending across all categories
          </p>
        </div>
        
        <Button variant="outline" onClick={fetchCategoryStats}>
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats.map((category) => {
          const IconComponent = getCategoryIcon(category.category_icon);
          const hasSpending = category.total_amount > 0;
          
          return (
            <Card 
              key={category.category_id} 
              className={`p-6 transition-all duration-200 hover:shadow-md ${
                hasSpending ? 'border-primary/20' : 'border-muted/50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    hasSpending ? 'bg-primary/10' : 'bg-muted/50'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      hasSpending ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.category_name}</h3>
                    {hasSpending && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {category.percentage_of_total.toFixed(1)}% of total
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Spending</span>
                  <span className={`font-bold text-lg ${
                    hasSpending ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    ${category.total_amount.toFixed(2)}
                  </span>
                </div>

                {hasSpending && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Items</span>
                      <span className="font-medium">{category.item_count}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receipts</span>
                      <span className="font-medium">{category.receipt_count}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg per Item</span>
                      <span className="font-medium">${category.average_per_item.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-success">
                        <TrendingUp className="h-3 w-3" />
                        <span>Active category</span>
                      </div>
                    </div>
                  </>
                )}

                {!hasSpending && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No spending in this category
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Process receipts to see activity
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};