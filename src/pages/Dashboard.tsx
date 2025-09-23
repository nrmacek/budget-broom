import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, LogOut, User } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { ReceiptResults } from '@/components/ReceiptResults';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AppState = 'uploading' | 'processing' | 'results';

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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appState, setAppState] = useState<AppState>('uploading');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setAppState('processing');
    setIsProcessing(true);
    
    try {
      // Create form data to send to edge function
      const formData = new FormData();
      formData.append('file', file);

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('parse-receipt', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setReceiptData(data);
      setAppState('results');
      
      // Save receipt to database
      try {
        const { error: saveError } = await supabase
          .from('receipts')
          .insert({
            user_id: user?.id,
            store_name: data.storeName,
            date: data.date,
            subtotal: data.subtotal,
            total: data.total,
            discounts: data.discounts || [],
            taxes: data.taxes || [],
            additional_charges: data.additionalCharges || [],
            line_items: data.lineItems,
            original_filename: file.name,
          });

        if (saveError) {
          console.error('Error saving receipt:', saveError);
        }
      } catch (saveError) {
        console.error('Error saving receipt to database:', saveError);
      }
      
      toast({
        title: "Receipt processed successfully!",
        description: `Found ${data.lineItems.length} items from ${data.storeName}`,
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
      
      // Extract more specific error messages
      let errorMessage = "Failed to process receipt. Please try again.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message;
        if (message.includes('OpenAI API key')) {
          errorMessage = "Service configuration error. Please contact support.";
        } else if (message.includes('Failed to parse receipt data')) {
          errorMessage = "Could not extract data from the receipt. Please try a clearer image or different file.";
        } else if (message.includes('Unsupported file type')) {
          errorMessage = "Unsupported file type. Please use JPG, PNG, WebP, or CSV files.";
        } else if (message.includes('File too large')) {
          errorMessage = "File is too large. Please use a file smaller than 10MB.";
        } else if (message.includes('No file provided')) {
          errorMessage = "No file was uploaded. Please select a file to process.";
        } else if (message.includes('non-2xx status code')) {
          errorMessage = "Service error occurred. Please try again in a moment.";
        } else {
          errorMessage = message; // Use the actual error message if it's informative
        }
      }
      
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
      setAppState('uploading');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = () => {
    // This is now handled in handleFileSelect
    setAppState('results');
  };

  const handleStartOver = () => {
    setUploadedFile(null);
    setReceiptData(null);
    setAppState('uploading');
  };

  const handleNewReceipt = () => {
    console.log('handleNewReceipt called, changing state to uploading');
    setUploadedFile(null);
    setReceiptData(null);
    setAppState('uploading');
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

  console.log('Current appState:', appState, 'receiptData exists:', !!receiptData);

  if (appState === 'processing' && uploadedFile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onNewReceipt={handleNewReceipt} />
          <div className="flex-1 bg-gradient-background">
            {/* Simple Profile Header */}
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
              <div className="w-full max-w-md">
                <ProcessingProgress 
                  fileName={uploadedFile.name}
                  isProcessing={isProcessing}
                  onComplete={handleProcessingComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (appState === 'results' && receiptData) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onNewReceipt={handleNewReceipt} />
          <div className="flex-1">
            {/* Simple Profile Header */}
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
            <ReceiptResults 
              receiptData={receiptData}
              onStartOver={handleStartOver}
            />
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
          {/* Simple Profile Header */}
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

          <section className="py-12 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-full mb-4">
                  <span className="text-sm font-medium text-muted-foreground">AI-Powered Receipt Parsing</span>
                </div>
                <p className="text-lg text-foreground max-w-md mx-auto mb-8">
                  Upload receipts and instantly get itemized, categorized results.
                </p>
              </div>
              <ReceiptUpload onFileSelect={handleFileSelect} />
            </div>
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;