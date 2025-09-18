import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Receipt, Zap, Shield, Download, ArrowRight } from 'lucide-react';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { ReceiptResults } from '@/components/ReceiptResults';
import heroImage from '@/assets/hero-receipt-parser.jpg';

type AppState = 'landing' | 'uploading' | 'processing' | 'results';

// Mock data for demo
const mockReceiptData = {
  storeName: "Target Store #1423",
  date: "2024-01-15",
  total: 127.84,
  lineItems: [
    { id: '1', description: 'Organic Bananas', quantity: 2, unitPrice: 1.99, total: 3.98, category: 'Groceries', confidence: 0.95 },
    { id: '2', description: 'Whole Grain Bread', quantity: 1, unitPrice: 3.49, total: 3.49, category: 'Groceries', confidence: 0.98 },
    { id: '3', description: 'Greek Yogurt 32oz', quantity: 1, unitPrice: 5.99, total: 5.99, category: 'Groceries', confidence: 0.92 },
    { id: '4', description: 'Bluetooth Headphones', quantity: 1, unitPrice: 34.99, total: 34.99, category: 'Electronics', confidence: 0.97 },
    { id: '5', description: 'Phone Charging Cable', quantity: 1, unitPrice: 12.99, total: 12.99, category: 'Electronics', confidence: 0.94 },
    { id: '6', description: 'Cotton T-Shirt', quantity: 2, unitPrice: 9.99, total: 19.98, category: 'Clothing', confidence: 0.91 },
    { id: '7', description: 'Jeans', quantity: 1, unitPrice: 24.99, total: 24.99, category: 'Clothing', confidence: 0.96 },
    { id: '8', description: 'Shampoo & Conditioner', quantity: 1, unitPrice: 8.99, total: 8.99, category: 'Personal Care', confidence: 0.88 },
    { id: '9', description: 'Toothpaste', quantity: 1, unitPrice: 4.99, total: 4.99, category: 'Personal Care', confidence: 0.93 },
    { id: '10', description: 'Laundry Detergent', quantity: 1, unitPrice: 7.99, total: 7.99, category: 'Household', confidence: 0.89 }
  ]
};

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setAppState('processing');
  };

  const handleProcessingComplete = () => {
    setAppState('results');
  };

  const handleStartOver = () => {
    setUploadedFile(null);
    setAppState('landing');
  };

  if (appState === 'processing' && uploadedFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ProcessingProgress 
            fileName={uploadedFile.name}
            onComplete={handleProcessingComplete}
          />
        </div>
      </div>
    );
  }

  if (appState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-6xl mx-auto">
          <ReceiptResults 
            receiptData={mockReceiptData}
            onStartOver={handleStartOver}
          />
        </div>
      </div>
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
          
          <Button variant="outline">
            Sign In
          </Button>
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
