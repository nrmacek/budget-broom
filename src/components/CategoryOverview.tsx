import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { DateRange } from '@/pages/Categories';
import { TrendingUp, DollarSign, Receipt, PieChart } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CategoryAssignment, LineItem } from '@/types';

interface CategorySpending {
  category_id: string;
  category_name: string;
  category_icon: string;
  total_amount: number;
  item_count: number;
  percentage: number;
}

interface OverviewStats {
  totalSpending: number;
  totalReceipts: number;
  totalItems: number;
  averageReceiptAmount: number;
}

interface CategoryOverviewProps {
  dateRange: DateRange;
}

export const CategoryOverview: React.FC<CategoryOverviewProps> = ({ dateRange }) => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalSpending: 0,
    totalReceipts: 0,
    totalItems: 0,
    averageReceiptAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCategoryData();
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

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch category spending data
      const { data: spendingData, error: spendingError } = await supabase
        .from('category_assignments')
        .select(`
          category_id,
          categories!inner(display_name, icon),
          receipts!inner(
            line_items,
            created_at,
            user_id
          )
        `)
        .eq('receipts.user_id', user?.id)
        .gte('receipts.created_at', dateFilter);

      if (spendingError) throw spendingError;

      // Process the data to calculate spending by category
      const categoryTotals: Record<string, {
        name: string;
        icon: string;
        amount: number;
        count: number;
      }> = {};

      let totalSpending = 0;
      let totalItems = 0;
      const receiptIds = new Set();

      spendingData?.forEach((assignment: any) => {
        const categoryId = assignment.category_id;
        const categoryName = assignment.categories.display_name;
        const categoryIcon = assignment.categories.icon;
        const lineItems = assignment.receipts?.line_items as LineItem[] || [];
        
        receiptIds.add(assignment.receipts.id);

        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = {
            name: categoryName,
            icon: categoryIcon,
            amount: 0,
            count: 0,
          };
        }

        // Find the corresponding line item by index
        const lineItem = lineItems[assignment.line_item_index];
        if (lineItem) {
          const itemTotal = lineItem.total || 0;
          categoryTotals[categoryId].amount += itemTotal;
          categoryTotals[categoryId].count += 1;
          totalSpending += itemTotal;
          totalItems += 1;
        }
      });

      // Convert to array and add percentages
      const categorySpendingArray: CategorySpending[] = Object.entries(categoryTotals).map(([categoryId, data]) => ({
        category_id: categoryId,
        category_name: data.name,
        category_icon: data.icon,
        total_amount: data.amount,
        item_count: data.count,
        percentage: totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0,
      }));

      // Sort by total amount descending
      categorySpendingArray.sort((a, b) => b.total_amount - a.total_amount);

      setCategorySpending(categorySpendingArray);
      setOverviewStats({
        totalSpending,
        totalReceipts: receiptIds.size,
        totalItems,
        averageReceiptAmount: receiptIds.size > 0 ? totalSpending / receiptIds.size : 0,
      });

    } catch (error) {
      console.error('Error fetching category data:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Spending</p>
              <p className="text-2xl font-bold text-primary">
                ${overviewStats.totalSpending.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Receipts</p>
              <p className="text-2xl font-bold">{overviewStats.totalReceipts}</p>
            </div>
            <div className="p-3 rounded-full bg-accent/10">
              <Receipt className="h-6 w-6 text-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Items Categorized</p>
              <p className="text-2xl font-bold">{overviewStats.totalItems}</p>
            </div>
            <div className="p-3 rounded-full bg-success/10">
              <PieChart className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg per Receipt</p>
              <p className="text-2xl font-bold">
                ${overviewStats.averageReceiptAmount.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-warning/10">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending by Category
          </h2>
          <p className="text-muted-foreground">
            Breakdown of your spending across different categories
          </p>
        </div>

        {categorySpending.length > 0 ? (
          <div className="space-y-4">
            {categorySpending.map((category) => {
              const IconComponent = getCategoryIcon(category.category_icon);
              return (
                <div key={category.category_id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{category.category_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.item_count} item{category.item_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 min-w-0 flex-1 mx-6">
                    <Progress value={category.percentage} className="flex-1" />
                    <Badge variant="secondary" className="shrink-0">
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ${category.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No categorized spending data found for the selected time period.</p>
            <p className="text-sm">Process some receipts to see your spending breakdown!</p>
          </div>
        )}
      </Card>
    </div>
  );
};