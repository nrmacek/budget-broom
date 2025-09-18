import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ReceiptData {
  storeName: string;
  date: string;
  total: number;
  lineItems: LineItem[];
}

interface ReceiptResultsProps {
  receiptData: ReceiptData;
  onStartOver: () => void;
}

export function ReceiptResults({ receiptData, onStartOver }: ReceiptResultsProps) {
  const [items] = useState<LineItem[]>(receiptData.lineItems);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onStartOver}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">ReceiptParser</h1>
          </button>
          
          <Button variant="outline">
            Sign In
          </Button>
        </div>
      </header>

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
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <p className="font-medium">{item.description}</p>
                                    {item.confidence < 0.9 && (
                                      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                                        Low confidence
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Qty: {item.quantity} × ${item.unitPrice.toFixed(2)} each
                                  </p>
                                </div>
                                <div className="text-right">
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
        </div>
      </div>
    </div>
  );
}