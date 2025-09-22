import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Receipt, Zap, Shield, Download, ArrowRight, LogOut, User } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { ReceiptResults } from '@/components/ReceiptResults';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-receipt-parser.jpg';

type AppState = 'landing' | 'uploading' | 'processing' | 'results';

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

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [appState, setAppState] = useState<AppState>('landing');
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

      console.log('Receipt parsed successfully:', data);
      setReceiptData(data);
      setAppState('results');
      
      toast({
        title: "Receipt processed successfully!",
        description: `Found ${data.lineItems.length} items from ${data.storeName}`,
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process receipt. Please try again.",
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
    setAppState('landing');
  };

  const handleNewReceipt = () => {
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
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    }
  };

  if (appState === 'processing' && uploadedFile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onNewReceipt={handleNewReceipt} />
          <div className="flex-1 bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <ProcessingProgress 
                fileName={uploadedFile.name}
                onComplete={handleProcessingComplete}
              />
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  Turn Receipts Into
                  <span className="bg-gradient-hero bg-clip-text text-transparent"> Structured Data</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Upload receipts as images, PDFs, or CSVs and get back clean, categorized line items 
                  ready for your budgeting tools. Powered by OCR and AI.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-hero hover:scale-105 transition-transform shadow-glow"
                  onClick={() => setAppState('uploading')}
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  Privacy First
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  Instant Processing
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  CSV Export
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Receipt processing visualization" 
                className="rounded-2xl shadow-large w-full"
              />
              <div className="absolute inset-0 bg-gradient-hero opacity-10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      {appState === 'uploading' && (
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar onNewReceipt={handleNewReceipt} />
            <div className="flex-1 bg-gradient-to-br from-background to-muted/20">
              <section className="py-12 px-4">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Upload Your Receipt</h2>
                    <p className="text-muted-foreground">
                      Support for images (JPG, PNG, WebP), PDFs, and CSV files up to 10MB
                    </p>
                  </div>
                  <ReceiptUpload onFileSelect={handleFileSelect} />
                </div>
              </section>
            </div>
          </div>
        </SidebarProvider>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose ReceiptParser?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for accuracy, speed, and privacy with powerful features for managing your expenses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning Fast OCR</h3>
              <p className="text-muted-foreground">
                Advanced OCR technology extracts text from receipts in seconds, 
                even from poor quality images or complex layouts.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-accent/10 w-fit mx-auto mb-6">
                <Receipt className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Categorization</h3>
              <p className="text-muted-foreground">
                AI-powered categorization with custom rules support. 
                Automatically sorts expenses into budgeting categories.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-6">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Privacy Focused</h3>
              <p className="text-muted-foreground">
                Your receipts are processed securely and never shared. 
                All data remains private to your account.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">ReceiptParser</span>
          </div>
          <p className="text-muted-foreground">
            Transform your receipts into structured data for better expense management.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
