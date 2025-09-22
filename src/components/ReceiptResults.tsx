import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Store, Calendar, DollarSign, Receipt, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
  confidence: number;
}

interface Discount {
  description: string;
  amount: number;
}

interface Tax {
  description: string;
  rate?: number;
  amount: number;
}

interface AdditionalCharge {
  description: string;
  amount: number;
}

interface ReceiptData {
  storeName: string;
  date: string;
  subtotal: number;
  discounts?: Discount[];
  taxes?: Tax[];
  additionalCharges?: AdditionalCharge[];
  total: number;
  lineItems: LineItem[];
}

interface ReceiptResultsProps {
  receiptData: ReceiptData;
  onStartOver: () => void;
}

export function ReceiptResults({ receiptData, onStartOver }: ReceiptResultsProps) {
  const [items, setItems] = useState<LineItem[]>(receiptData.lineItems);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleCategoryChange = (itemId: string, newCategory: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, category: newCategory }
          : item
      )
    );
    
    toast({
      title: "Category updated",
      description: `Item moved to ${newCategory}`,
    });
  };

  const exportToCSV = () => {
    const headers = ['Description', 'Quantity', 'Unit Price', 'Total', 'Category'];
    const csvData = [
      headers.join(','),
      ...items.map(item => [
        `"${item.description}"`,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.total.toFixed(2),
        item.category
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.storeName}-${receiptData.date}.csv`;
    a.click();
    
    toast({
      title: "CSV exported successfully",
      description: "Your receipt data has been downloaded.",
    });
  };

  const getCategorizedItems = () => {
    const categorized = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, LineItem[]>);

    // Calculate totals for each category
    return Object.entries(categorized)
      .map(([category, categoryItems]) => ({
        category,
        items: categoryItems,
        total: categoryItems.reduce((sum, item) => sum + item.total, 0)
      }))
      .sort((a, b) => b.total - a.total); // Sort by total descending
  };

  // Calculate validation totals
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalDiscounts = (receiptData.discounts || []).reduce((sum, discount) => sum + discount.amount, 0);
  const totalTaxes = (receiptData.taxes || []).reduce((sum, tax) => sum + tax.amount, 0);
  const totalAdditionalCharges = (receiptData.additionalCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
  const calculatedTotal = calculatedSubtotal - totalDiscounts + totalTaxes + totalAdditionalCharges;
  const totalDiscrepancy = Math.abs(calculatedTotal - receiptData.total);
  const hasDiscrepancy = totalDiscrepancy > 0.01; // Allow for small rounding differences

  const categoryIcons: Record<string, any> = {
    'Groceries': '🛒',
    'Electronics': '📱',
    'Clothing': '👕',
    'Personal Care': '🧴',
    'Household': '🏠',
    'Dining': '🍽️',
    'Transportation': '🚗',
    'Entertainment': '🎬',
    'Other': '📦'
  };

  const availableCategories = Object.keys(categoryIcons);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="space-y-6">
          {/* Receipt Header */}
          <Card className="p-6 bg-gradient-card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Receipt Parsed Successfully</h1>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onStartOver}>
                  Parse Another Receipt
                </Button>
                <Button onClick={exportToCSV} className="bg-gradient-accent hover:scale-105 transition-transform">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Store</p>
                  <p className="font-semibold text-lg">{receiptData.storeName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-lg">{receiptData.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-2xl">${receiptData.total.toFixed(2)}</p>
                  {hasDiscrepancy && (
                    <p className="text-xs text-warning">
                      ⚠ ${totalDiscrepancy.toFixed(2)} discrepancy
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Category Buckets */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Spending by Category</h2>
            
            <div className="grid gap-6">
              {getCategorizedItems().map(({ category, items: categoryItems, total }) => {
                const isExpanded = expandedCategories.has(category);
                return (
                  <Card key={category} className="overflow-hidden">
                    {/* Category Header - Clickable */}
                    <button 
                      onClick={() => toggleCategory(category)}
                      className="w-full p-6 bg-gradient-subtle hover:bg-gradient-subtle/80 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoryIcons[category] || categoryIcons['Other']}</span>
                          <div>
                            <h3 className="text-xl font-semibold">{category}</h3>
                            <p className="text-sm text-muted-foreground">
                              {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              {((total / receiptData.total) * 100).toFixed(1)}% of total
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${((total / receiptData.total) * 100)}%` 
                          }}
                        />
                      </div>
                    </button>
                    
                    {/* Category Items - Collapsible */}
                    {isExpanded && (
                      <div className="border-t animate-fade-in">
                        <div className="p-6">
                          <div className="space-y-3">
                            {categoryItems.map((item, index) => (
                              <div 
                                key={item.id} 
                                className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0 animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <p className="font-medium truncate">{item.description}</p>
                                    {item.confidence < 0.9 && (
                                      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20 shrink-0">
                                        Low confidence
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <p className="text-sm text-muted-foreground">
                                      Qty: {item.quantity} × ${item.unitPrice.toFixed(2)} each
                                    </p>
                                    <Select
                                      value={item.category}
                                      onValueChange={(newCategory) => handleCategoryChange(item.id, newCategory)}
                                    >
                                      <SelectTrigger className="w-40 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-50 bg-popover border shadow-lg">
                                        {availableCategories.map((cat) => (
                                          <SelectItem key={cat} value={cat} className="text-xs">
                                            <span className="flex items-center gap-2">
                                              <span>{categoryIcons[cat]}</span>
                                              <span>{cat}</span>
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="text-right ml-4 shrink-0">
                                  <p className="font-semibold text-lg">${item.total.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Taxes, Discounts, and Fees - Only show if there are any */}
          {((receiptData.discounts && receiptData.discounts.length > 0) || 
            (receiptData.taxes && receiptData.taxes.length > 0) || 
            (receiptData.additionalCharges && receiptData.additionalCharges.length > 0)) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Taxes, Discounts, and Fees
              </h2>
              
              <div className="space-y-4">
                {/* Line Items Subtotal */}
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/50">
                  <span className="text-muted-foreground">Line Items Subtotal</span>
                  <span className="font-semibold">${calculatedSubtotal.toFixed(2)}</span>
                </div>

                {/* Discounts Section */}
                {receiptData.discounts && receiptData.discounts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Discounts</h3>
                    {receiptData.discounts.map((discount, index) => (
                      <div key={index} className="flex justify-between items-center py-2 text-green-600">
                        <span>- {discount.description}</span>
                        <span>-${discount.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Taxes Section */}
                {receiptData.taxes && receiptData.taxes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Taxes</h3>
                    {receiptData.taxes.map((tax, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <span>
                          {tax.description}
                          {tax.rate && ` (${(tax.rate * 100).toFixed(2)}%)`}
                        </span>
                        <span>${tax.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Fees Section */}
                {receiptData.additionalCharges && receiptData.additionalCharges.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Additional Fees</h3>
                    {receiptData.additionalCharges.map((charge, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <span>{charge.description}</span>
                        <span>${charge.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center py-3 border-t-2 border-primary/20 text-lg font-semibold">
                  <span>Total</span>
                  <span>${receiptData.total.toFixed(2)}</span>
                </div>

                {/* Validation Warning */}
                {hasDiscrepancy && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
                    <p className="text-sm text-warning">
                      <strong>Note:</strong> There's a ${totalDiscrepancy.toFixed(2)} discrepancy between the calculated total (${calculatedTotal.toFixed(2)}) 
                      and the receipt total (${receiptData.total.toFixed(2)}). This might be due to rounding differences, 
                      additional fees not captured, or parsing accuracy.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}