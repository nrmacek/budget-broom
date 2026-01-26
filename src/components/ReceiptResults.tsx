import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Store, Calendar, DollarSign, Receipt, ChevronDown, ChevronRight, Lock, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryAssignments } from '@/hooks/useCategoryAssignments';
import { useSubscription, getTierByProductId, PRICING_CONFIG } from '@/hooks/useSubscription';
import { CategoryAssignment } from '@/types';
import { CSVExporter } from '@/lib/csvExport';
import { PDFGenerator } from '@/lib/pdfGenerator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
  confidence: number;
  is_refund?: boolean;
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
  isReturn?: boolean;
}

interface ReceiptResultsProps {
  receiptData: ReceiptData;
  receiptId?: string;
  onStartOver: () => void;
  imagePath?: string | null;
}

export function ReceiptResults({ receiptData, receiptId, onStartOver, imagePath }: ReceiptResultsProps) {
  const [items, setItems] = useState<LineItem[]>(receiptData.lineItems);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryAssignments, setCategoryAssignments] = useState<Record<number, string>>({});
  const [showExportUpgradeModal, setShowExportUpgradeModal] = useState(false);
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { updateLineItemCategory, getCategoryAssignments, loading: assignmentLoading } = useCategoryAssignments();
  const { subscriptionData, createCheckout, loading: subscriptionLoading } = useSubscription();

  // Check if user can export (Plus or Pro tier)
  // FAIL CLOSED for feature gating: While loading, show free tier behavior (locked)
  // Once loaded, if error or no data, default to free tier (locked)
  const currentTier = getTierByProductId(subscriptionData?.product_id);
  const canExport = subscriptionLoading 
    ? false // Show locked while loading to prevent flash of premium features
    : (currentTier === 'plus' || currentTier === 'pro');

  const handleExportClick = (exportFn: () => void) => {
    if (canExport) {
      exportFn();
    } else {
      setShowExportUpgradeModal(true);
    }
  };

  const handleUpgrade = async () => {
    const url = await createCheckout(PRICING_CONFIG.plus.monthly_price_id);
    if (url) {
      window.open(url, '_blank');
    }
    setShowExportUpgradeModal(false);
  };

  useEffect(() => {
    // Load existing category assignments if receiptId is provided
    if (receiptId) {
      loadCategoryAssignments();
    }
  }, [receiptId]);

  const loadCategoryAssignments = async () => {
    if (!receiptId) return;
    
    const assignments = await getCategoryAssignments(receiptId);
    const assignmentMap: Record<number, string> = {};
    
    assignments.forEach((assignment: any) => {
      assignmentMap[assignment.line_item_index] = assignment.category_id;
    });
    
    setCategoryAssignments(assignmentMap);
  };

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

  const handleCategoryChange = async (itemIndex: number, categoryId: string) => {
    // Update local state immediately for better UX
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setItems(prevItems => 
        prevItems.map((item, index) => 
          index === itemIndex 
            ? { ...item, category: category.display_name }
            : item
        )
      );
      
      setCategoryAssignments(prev => ({
        ...prev,
        [itemIndex]: categoryId
      }));

      // Update in database if receiptId is available
      if (receiptId) {
        const success = await updateLineItemCategory(receiptId, itemIndex, categoryId, 'user');
        if (success) {
          toast({
            title: "Category updated",
            description: `Item moved to ${category.display_name}`,
          });
        }
      }
    }
  };

  const exportToCSV = () => {
    try {
      // Calculate totals from arrays
      const totalDiscounts = (receiptData.discounts || []).reduce((sum, discount) => sum + discount.amount, 0);
      const totalTaxes = (receiptData.taxes || []).reduce((sum, tax) => sum + tax.amount, 0);
      const totalAdditionalCharges = (receiptData.additionalCharges || []).reduce((sum, charge) => sum + charge.amount, 0);

      // Transform the local receipt data to match the Receipt interface expected by CSVExporter
      const transformedReceipt = {
        id: receiptId || `temp-${Date.now()}`,
        store_name: receiptData.storeName,
        date: receiptData.date,
        total: receiptData.total,
        subtotal: receiptData.subtotal,
        line_items: items.map((item, index) => ({
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          price: item.unitPrice,
          unit_price: item.unitPrice,
          total: item.total,
          category: item.category,
          discount: 0, // Default values for fields not available in current interface
          tax: 0,
          is_refund: false
        })),
        discounts: totalDiscounts,
        taxes: totalTaxes,
        additional_charges: totalAdditionalCharges,
        original_filename: `receipt-${receiptData.storeName}-${receiptData.date}`,
        currency: 'USD'
      };

      const exporter = new CSVExporter('v2-production');
      const csvContent = exporter.generateCSV([transformedReceipt]);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData.storeName}-${receiptData.date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV exported successfully", 
        description: "Your comprehensive receipt data has been downloaded.",
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your receipt data.",
        variant: "destructive"
      });
    }
  };

  const downloadReceiptPDF = async () => {
    if (!imagePath) {
      toast({
        title: "No image available",
        description: "This receipt doesn't have an associated image for PDF download.",
        variant: "destructive"
      });
      return;
    }

    try {
      const filename = `receipt-${receiptData.storeName}-${receiptData.date}`;
      await PDFGenerator.downloadReceiptPDF(imagePath, filename);
      
      toast({
        title: "PDF downloaded successfully", 
        description: "Your receipt PDF has been downloaded.",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the PDF. Please try again.",
        variant: "destructive"
      });
    }
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

  // Get category display info
  const getCategoryDisplayInfo = (categoryName: string) => {
    const category = categories.find(cat => 
      cat.display_name === categoryName || cat.slug === categoryName
    );
    return category || { display_name: categoryName, icon: 'MoreHorizontal', slug: 'other' };
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.MoreHorizontal;
    return IconComponent;
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="space-y-6">
          {/* Receipt Header */}
          <Card className="p-4 sm:p-8 bg-gradient-card shadow-large">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-full mb-4 ${
                  receiptData.isReturn 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : 'bg-gradient-hero/10 border-primary/20'
                }`}>
                  <Receipt className={`h-4 w-4 ${receiptData.isReturn ? 'text-destructive' : 'text-primary'}`} />
                  <span className={`text-sm font-medium ${receiptData.isReturn ? 'text-destructive' : 'text-primary'}`}>
                    {receiptData.isReturn ? 'Return Receipt Processed' : 'Parsing Complete'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-raleway">
                  {receiptData.isReturn ? 'Return Receipt Parsed' : 'Receipt Parsed Successfully'}
                </h1>
                {receiptData.isReturn && (
                  <Badge variant="destructive" className="mt-2 text-sm">
                    REFUND
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={onStartOver} className="hover:scale-105 transition-transform">
                  Parse Another Receipt
                </Button>
                {imagePath && (
                  canExport ? (
                    <Button onClick={downloadReceiptPDF} variant="default" className="hover:scale-105 transition-transform">
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt PDF
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="gap-2 opacity-60"
                            onClick={() => setShowExportUpgradeModal(true)}
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Download PDF
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Plus/Pro feature - upgrade to unlock</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                )}
                {canExport ? (
                  <Button onClick={exportToCSV} variant="hero" className="shadow-glow hover:scale-105 transition-all duration-200">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="gap-2 opacity-60"
                          onClick={() => setShowExportUpgradeModal(true)}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Export CSV
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Plus/Pro feature - upgrade to unlock</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-subtle/50 rounded-xl">
                <div className="p-3 rounded-xl bg-gradient-hero shadow-glow">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Store</p>
                  <p className="font-bold text-xl">{receiptData.storeName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-subtle/50 rounded-xl">
                <div className="p-3 rounded-xl bg-gradient-accent shadow-glow">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                  <p className="font-bold text-xl">{receiptData.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-subtle/50 rounded-xl">
                <div className={`p-3 rounded-xl shadow-glow ${receiptData.isReturn ? 'bg-destructive' : 'bg-success'}`}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className={`font-bold text-2xl ${receiptData.isReturn ? 'text-destructive' : 'text-success'}`}>
                    ${receiptData.total.toFixed(2)}
                  </p>
                  {hasDiscrepancy && (
                    <p className="text-xs text-warning font-medium">
                      ⚠ ${totalDiscrepancy.toFixed(2)} discrepancy
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Category Buckets */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-raleway">Spending by Category</h2>
            
            <div className="grid gap-6">
              {getCategorizedItems().map(({ category, items: categoryItems, total }) => {
                const isExpanded = expandedCategories.has(category);
                return (
                  <Card key={category} className="overflow-hidden bg-gradient-card shadow-medium hover:shadow-large transition-all duration-200">
                    {/* Category Header - Clickable */}
                     <button 
                      onClick={() => toggleCategory(category)}
                      className="w-full p-6 bg-gradient-subtle/50 hover:bg-gradient-subtle/70 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const categoryInfo = getCategoryDisplayInfo(category);
                            const IconComponent = getCategoryIcon(categoryInfo.icon);
                            return <IconComponent className="h-6 w-6 text-primary" />;
                          })()}
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
                                    <p className={`font-medium truncate ${item.is_refund ? 'text-destructive' : ''}`}>
                                      {item.description}
                                    </p>
                                    {item.is_refund && (
                                      <Badge variant="destructive" className="text-xs shrink-0">
                                        REFUND
                                      </Badge>
                                    )}
                                    {item.confidence < 0.9 && !item.is_refund && (
                                      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20 shrink-0">
                                        Low confidence
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <p className={`text-sm ${item.is_refund ? 'text-destructive' : 'text-muted-foreground'}`}>
                                      Qty: {item.quantity} × ${item.unitPrice.toFixed(2)} each
                                    </p>
                                    <Select
                                      value={categoryAssignments[index] || categories.find(cat => cat.display_name === item.category)?.id || ''}
                                      onValueChange={(categoryId) => handleCategoryChange(index, categoryId)}
                                      disabled={categoriesLoading || assignmentLoading}
                                    >
                                      <SelectTrigger className="w-40 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-50 bg-popover border shadow-lg">
                                        {categories.map((cat) => {
                                          const IconComponent = getCategoryIcon(cat.icon);
                                          return (
                                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                              <span className="flex items-center gap-2">
                                                <IconComponent className="h-3 w-3" />
                                                <span>{cat.display_name}</span>
                                              </span>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="text-right ml-4 shrink-0">
                                  <p className={`font-semibold text-lg ${item.is_refund ? 'text-destructive' : ''}`}>
                                    ${item.total.toFixed(2)}
                                  </p>
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

      {/* Export Upgrade Modal */}
      <Dialog open={showExportUpgradeModal} onOpenChange={setShowExportUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Unlock Export Features
            </DialogTitle>
            <DialogDescription className="pt-2">
              CSV and PDF export is available on Plus and Pro plans. Upgrade to export your receipt data for accounting, budgeting, or record-keeping.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowExportUpgradeModal(false)}
            >
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade}>
              Upgrade to Plus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}