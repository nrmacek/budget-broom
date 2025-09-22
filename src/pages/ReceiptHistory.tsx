import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt, LogOut, User, Eye, Download, Trash2, Calendar, DollarSign, Building2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
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
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
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
      </div>
    </SidebarProvider>
  );
};

export default ReceiptHistory;