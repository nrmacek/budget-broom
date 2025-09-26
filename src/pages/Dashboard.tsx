import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, LogOut, User } from 'lucide-react';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { BulkUpload } from '@/components/BulkUpload';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { ReceiptResults } from '@/components/ReceiptResults';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { FileUploadResult } from '@/types';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'single' | 'bulk'>('single');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const { getSuggestionsForItem } = useSmartSuggestions();

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('Uploading file...');
    setExtractedData(null);
    setCurrentFileName(file.name);

    try {
      // First, upload the file to Supabase Storage
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      setCurrentStep('Storing receipt image...');
      setProgress(10);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to store image: ${uploadError.message}`);
      }

      setProgress(20);
      setCurrentStep('Analyzing image structure...');

      // Enhanced progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 40) {
            setCurrentStep('Extracting text with AI vision...');
            return prev + Math.random() * 6;
          } else if (prev < 65) {
            setCurrentStep('Categorizing items intelligently...');
            return prev + Math.random() * 5;
          } else if (prev < 85) {
            setCurrentStep('Finalizing data extraction...');
            return prev + Math.random() * 3;
          }
          return prev;
        });
      }, 400);

      // Call the parse-receipt function with the image path
      const { data, error } = await supabase.functions.invoke('parse-receipt', {
        body: {
          imagePath: filePath,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        },
      });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setProgress(95);
      setCurrentStep('Saving to database...');

      // Enhance line items with smart suggestions
      if (data.lineItems && Array.isArray(data.lineItems)) {
        for (const item of data.lineItems) {
          if (!item.category || item.confidence < 0.6) {
            const suggestions = await getSuggestionsForItem(item.description);
            if (suggestions.length > 0) {
              item.category = suggestions[0].suggested_category_id;
              item.confidence = Math.max(item.confidence || 0, suggestions[0].confidence);
            }
          }
        }
      }

      // Save receipt to database with image metadata
      const { data: savedReceipt, error: saveError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          store_name: data.storeName,
          date: data.date,
          subtotal: data.subtotal,
          total: data.total,
          line_items: data.lineItems,
          discounts: data.discounts || [],
          taxes: data.taxes || [],
          additional_charges: data.additionalCharges || [],
          original_filename: file.name,
          image_bucket: 'receipt-images',
          image_path: filePath,
          mime_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setProgress(100);
      setCurrentStep('Complete!');
      setExtractedData(data);
      setReceiptId(savedReceipt.id);
      setImagePath(filePath);

      toast({
        title: "Receipt processed successfully",
        description: `Extracted ${data.lineItems?.length || 0} items from ${data.storeName}`,
      });
    } catch (error) {
      console.error('Receipt processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process receipt';
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setCurrentStep('');
        setCurrentFileName('');
      }, 1000);
    }
  };

  const handleBulkUpload = async (results: FileUploadResult[]) => {
    toast({
      title: "Bulk processing completed",
      description: `Successfully processed ${results.length} receipts with enhanced categorization.`,
    });
  };

  const handleNewReceipt = () => {
    setExtractedData(null);
    setReceiptId(null);
    setImagePath(null);
    setProgress(0);
    setCurrentStep('');
    setCurrentFileName('');
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
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onNewReceipt={handleNewReceipt} />
        <div className="flex-1 bg-gradient-background">
          <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 shadow-soft">
            <div className="px-4 py-2 flex items-center justify-end">
              {user && (
                <UserProfileDropdown user={user} onSignOut={handleSignOut} />
              )}
            </div>
          </header>

          <section className="py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Toggle between single and bulk upload */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant={processingMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setProcessingMode('single')}
                    >
                      Single Upload
                    </Button>
                    <Button
                      variant={processingMode === 'bulk' ? 'default' : 'outline'}
                      onClick={() => setProcessingMode('bulk')}
                    >
                      Bulk Upload
                    </Button>
                  </div>

                  {processingMode === 'single' ? (
                    <ReceiptUpload onFileSelect={handleFileUpload} />
                  ) : (
                    <BulkUpload onComplete={handleBulkUpload} />
                  )}
                  
                  <ProcessingProgress 
                    isProcessing={isProcessing} 
                    progress={progress} 
                    currentStep={currentStep}
                    fileName={currentFileName}
                    estimatedTime={Math.max(10 - Math.floor(progress / 10), 1)}
                  />
                </div>
                
                {extractedData && receiptId && (
                  <div className="space-y-6">
                    <ReceiptResults 
                      receiptData={extractedData} 
                      receiptId={receiptId}
                      imagePath={imagePath}
                      onStartOver={handleNewReceipt}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;