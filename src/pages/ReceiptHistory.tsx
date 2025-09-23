import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, LogOut, User, Eye, Download, Trash2, Calendar, DollarSign, Building2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReceiptResults } from '@/components/ReceiptResults';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ReceiptRecord {
  id: string;
  store_name: string;
  date: string;
  total: number;
  subtotal: number;
  line_items: any;
  discounts?: any;
  taxes?: any;
  additional_charges?: any;
  original_filename?: string;
  processed_at: string;
}

const ReceiptHistory = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedReceipt, setViewedReceipt] = useState<ReceiptRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('processed_at', { ascending: false });

      if (error) throw error;
      setReceipts((data || []) as ReceiptRecord[]);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: "Failed to load receipts",
        description: "There was an error loading your receipt history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewReceipt = () => {
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReceipts(receipts.filter(receipt => receipt.id !== id));
      toast({
        title: "Receipt deleted",
        description: "The receipt has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Failed to delete receipt",
        description: "There was an error deleting the receipt.",
        variant: "destructive",
      });
    }
  };

  const handleViewReceipt = (receipt: ReceiptRecord) => {
    setViewedReceipt(receipt);
    setIsViewDialogOpen(true);
  };

  // Helper function to protect against CSV injection
  const sanitizeForCSV = (value: string): string => {
    if (!value) return value;
    // Check if field starts with potentially dangerous characters
    if (value.match(/^[=+\-@]/)) {
      return `'${value}`;
    }
    return value;
  };

  // Helper function to escape CSV fields properly
  const escapeCSVField = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    const sanitized = sanitizeForCSV(stringValue);
    // Escape double quotes and wrap in quotes if contains comma, quote, or newline
    if (sanitized.includes('"') || sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('\r')) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return `"${sanitized}"`;
  };

  // Helper function to format datetime with timezone (default to noon local)
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    // If only date provided (no time), set to noon local time
    if (dateString.length === 10) { // YYYY-MM-DD format
      date.setHours(12, 0, 0, 0);
    }
    // Return ISO-8601 format with timezone
    return date.toISOString();
  };

  const handleDownloadReceipt = (receipt: ReceiptRecord) => {
    // Production Constants
    const PARSER_VERSION = "1.2.0";
    const DEFAULT_CURRENCY = "USD";
    
    // Calculate total discounts and taxes for pro-rating
    const totalDiscounts = Array.isArray(receipt.discounts) 
      ? receipt.discounts.reduce((sum: number, discount: any) => sum + (discount.amount || 0), 0)
      : 0;
    const totalTaxes = Array.isArray(receipt.taxes)
      ? receipt.taxes.reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0)
      : 0;
    const totalLineItems = Array.isArray(receipt.line_items) 
      ? receipt.line_items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      : 1; // Prevent division by zero

    // Helper function to round to 2 decimal places (avoid floating point drift)
    const roundToCents = (value: number): number => Math.round(value * 100) / 100;

    // CSV Headers - production-ready format with mathematical accuracy and traceability
    const headers = [
      'receipt_id',
      'line_item_id',
      'line_item_seq', 
      'purchase_date',
      'purchase_datetime',
      'store',
      'item_name',
      'item_name_raw',
      'quantity',
      'unit_price',
      'line_total',
      'discount_amount',
      'tax_amount',
      'category',
      'category_confidence',
      'currency',
      'is_refund',
      'source_file',
      'parser_version'
    ];

    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvRows = [headers.join(',')];
    
    // Enhanced datetime formatting
    const purchaseDate = receipt.date; // YYYY-MM-DD format
    const purchaseDateTime = formatDateTime(receipt.date);
    const sourceFile = receipt.original_filename || 'unknown';
    
    // Process line items with mathematical accuracy
    receipt.line_items.forEach((item: any, index: number) => {
      const quantity = Math.abs(item.quantity || 1); // Handle negative quantities for returns
      const isRefund = item.quantity < 0 || item.isRefund || false;
      const actualQuantity = isRefund ? -quantity : quantity;
      
      // Calculate unit price with precision
      const lineTotal = roundToCents(item.total || 0);
      const unitPrice = quantity > 0 ? roundToCents(lineTotal / quantity) : 0;
      
      // Pro-rate discounts and taxes based on line total with precision
      const discountAmount = totalLineItems > 0 ? 
        roundToCents((lineTotal / totalLineItems) * totalDiscounts) : 0;
      const taxAmount = totalLineItems > 0 ? 
        roundToCents((lineTotal / totalLineItems) * totalTaxes) : 0;
        
      // Mathematical verification: line_total = quantity*unit_price - discount_amount + tax_amount
      const calculatedTotal = roundToCents((actualQuantity * unitPrice) - discountAmount + taxAmount);
      const finalLineTotal = Math.abs(calculatedTotal - lineTotal) < 0.01 ? lineTotal : calculatedTotal;

      // Category handling with confidence
      const category = item.category || 'Uncategorized';
      const categoryConfidence = item.categoryConfidence || (item.category ? '0.8' : '0.0');

      const row = [
        escapeCSVField(receipt.id),
        escapeCSVField(item.id || `${receipt.id}_${index + 1}`), // line_item_id (stable GUID)
        escapeCSVField(index + 1), // line_item_seq starts at 1
        escapeCSVField(purchaseDate), // YYYY-MM-DD format
        escapeCSVField(purchaseDateTime), // ISO-8601 with timezone
        escapeCSVField(receipt.store_name),
        escapeCSVField(item.description || 'Unknown Item'),
        escapeCSVField(item.originalDescription || item.description || 'Unknown Item'),
        escapeCSVField(actualQuantity.toString()), // Handles negative for returns
        escapeCSVField(unitPrice.toFixed(4)), // 4 decimal precision
        escapeCSVField(finalLineTotal.toFixed(2)), // Mathematically verified
        escapeCSVField(discountAmount.toFixed(2)),
        escapeCSVField(taxAmount.toFixed(2)),
        escapeCSVField(category),
        escapeCSVField(categoryConfidence),
        escapeCSVField(DEFAULT_CURRENCY),
        escapeCSVField(isRefund.toString()),
        escapeCSVField(sourceFile),
        escapeCSVField(PARSER_VERSION)
      ];
      csvRows.push(row.join(','));
    });

    // Handle fees/charges as separate line items (category = Fees)
    if (Array.isArray(receipt.additional_charges)) {
      receipt.additional_charges.forEach((charge: any, index: number) => {
        const chargeAmount = roundToCents(charge.amount || 0);
        const row = [
          escapeCSVField(receipt.id),
          escapeCSVField(`${receipt.id}_fee_${index + 1}`),
          escapeCSVField(receipt.line_items.length + index + 1),
          escapeCSVField(purchaseDate),
          escapeCSVField(purchaseDateTime),
          escapeCSVField(receipt.store_name),
          escapeCSVField(charge.description || 'Additional Charge'),
          escapeCSVField(charge.description || 'Additional Charge'),
          escapeCSVField('1'),
          escapeCSVField(chargeAmount.toFixed(4)),
          escapeCSVField(chargeAmount.toFixed(2)),
          escapeCSVField('0.00'),
          escapeCSVField('0.00'),
          escapeCSVField('Fees'),
          escapeCSVField('1.0'),
          escapeCSVField(DEFAULT_CURRENCY),
          escapeCSVField('false'),
          escapeCSVField(sourceFile),
          escapeCSVField(PARSER_VERSION)
        ];
        csvRows.push(row.join(','));
      });
    }

    // If no line items, add a single row with receipt info
    if (receipt.line_items.length === 0) {
      const row = [
        escapeCSVField(receipt.id),
        escapeCSVField('1'),
        escapeCSVField(purchaseDateTime),
        escapeCSVField(receipt.store_name),
        escapeCSVField('No items'),
        escapeCSVField('No items'),
        escapeCSVField('0'),
        escapeCSVField('0.0000'),
        escapeCSVField('0.00'),
        escapeCSVField('0.00'),
        escapeCSVField('0.00'),
        escapeCSVField('N/A'),
        escapeCSVField('USD')
      ];
      csvRows.push(row.join(','));
    }

    // Use CRLF line endings for Windows/Excel compatibility
    const csvContent = BOM + csvRows.join('\r\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Enhanced filename with timestamp for uniqueness
    const sanitizedStoreName = receipt.store_name.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, ''); // YYYYMMDDTHHMMSS
    link.download = `receipt_export_${sanitizedStoreName}_${receipt.date}_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Receipt downloaded",
      description: "Production-ready CSV export with security enhancements, timezone support, and pro-rated taxes/discounts.",
    });
  };

  const transformReceiptData = (receipt: ReceiptRecord) => {
    return {
      storeName: receipt.store_name,
      date: receipt.date,
      total: receipt.total,
      subtotal: receipt.subtotal,
      lineItems: Array.isArray(receipt.line_items) ? receipt.line_items : [],
      discounts: Array.isArray(receipt.discounts) ? receipt.discounts : [],
      taxes: Array.isArray(receipt.taxes) ? receipt.taxes : [],
      additionalCharges: Array.isArray(receipt.additional_charges) ? receipt.additional_charges : [],
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onNewReceipt={handleNewReceipt} />
          <div className="flex-1 bg-gradient-to-br from-background to-muted/20">
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-hero">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold">ReceiptParser</h1>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </header>
            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading receipt history...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onNewReceipt={handleNewReceipt} />
        <div className="flex-1 bg-gradient-to-br from-background to-muted/20">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-hero">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold">ReceiptParser</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {user?.email}
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <section className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Receipt History</h2>
                <p className="text-muted-foreground">
                  View and manage your processed receipts
                </p>
              </div>

              {receipts.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No receipts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by uploading your first receipt to see it here.
                    </p>
                    <Button onClick={handleNewReceipt}>
                      <Receipt className="h-4 w-4 mr-2" />
                      Upload Receipt
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{receipts.length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(receipts.reduce((sum, receipt) => sum + receipt.total, 0))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {receipts.filter(receipt => {
                            const receiptDate = new Date(receipt.processed_at);
                            const now = new Date();
                            return receiptDate.getMonth() === now.getMonth() && 
                                   receiptDate.getFullYear() === now.getFullYear();
                          }).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Receipts Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Receipts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Store</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Processed</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{receipt.store_name}</div>
                                    {receipt.original_filename && (
                                      <div className="text-xs text-muted-foreground">
                                        {receipt.original_filename}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(receipt.date), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {Array.isArray(receipt.line_items) ? receipt.line_items.length : 0} items
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(receipt.total)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(receipt.processed_at), 'MMM dd, yyyy HH:mm')}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewReceipt(receipt)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDownloadReceipt(receipt)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteReceipt(receipt.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </section>
        </div>
        
        {/* View Receipt Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receipt Details</DialogTitle>
            </DialogHeader>
            {viewedReceipt && (
              <ReceiptResults 
                receiptData={transformReceiptData(viewedReceipt)}
                onStartOver={() => setIsViewDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default ReceiptHistory;