import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, LogOut, User, Eye, Download, Trash2, Calendar, DollarSign, Building2, History as HistoryIcon } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReceiptResults } from '@/components/ReceiptResults';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CSVExporter } from '@/lib/csvExport';

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

  const handleDownloadReceipt = (receipt: ReceiptRecord, format: string = 'v2-production') => {
    try {
      const exporter = new CSVExporter(format);
      
      // Convert receipt to the expected format
      const receiptData = {
        ...receipt,
        currency: (receipt as any).currency || 'USD'
      };
      
      const csvContent = exporter.generateCSV([receiptData]);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      // Format date for filename
      const dateStr = receipt.date || new Date().toISOString();
      const formattedDate = dateStr.split('T')[0];
      link.download = `receipt_${receipt.id}_${formattedDate}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const configInfo = exporter.getConfigInfo();
      toast({
        title: "Success",
        description: `Receipt exported using ${configInfo.name} format (v${configInfo.version})`
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error", 
        description: "Failed to export receipt",
        variant: "destructive"
      });
    }
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
          <div className="flex-1 bg-gradient-background">
            <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 shadow-soft">
              <div className="px-4 py-3 flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <Button variant="hero" size="sm" onClick={handleSignOut} className="rounded-full px-4">
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
        <div className="flex-1 bg-gradient-background">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 shadow-soft">
            <div className="px-4 py-3 flex items-center justify-end">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {user?.email}
                </div>
                <Button variant="hero" size="sm" onClick={handleSignOut} className="rounded-full px-4">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <section className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-hero/10 backdrop-blur-sm border border-primary/20 rounded-full mb-6">
                  <HistoryIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Receipt Management</span>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Receipt History</h2>
                <p className="text-lg text-muted-foreground">
                  View, manage, and export your processed receipts
                </p>
              </div>

              {receipts.length === 0 ? (
                <Card className="text-center py-16 bg-gradient-card shadow-medium">
                  <CardContent>
                    <div className="p-6 rounded-full bg-gradient-hero/10 w-fit mx-auto mb-6">
                      <Receipt className="h-16 w-16 text-primary mx-auto" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">No receipts yet</h3>
                    <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                      Start by uploading your first receipt to see it here and begin tracking your expenses.
                    </p>
                    <Button onClick={handleNewReceipt} variant="hero" size="lg" className="shadow-glow">
                      <Receipt className="h-4 w-4 mr-2" />
                      Upload Receipt
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-card shadow-medium hover:shadow-large transition-all duration-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{receipts.length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-card shadow-medium hover:shadow-large transition-all duration-200">
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
                    
                    <Card className="bg-gradient-card shadow-medium hover:shadow-large transition-all duration-200">
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
                  <Card className="bg-gradient-card shadow-medium">
                    <CardHeader className="border-b border-border/50">
                      <CardTitle className="text-xl font-semibold">Recent Receipts</CardTitle>
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