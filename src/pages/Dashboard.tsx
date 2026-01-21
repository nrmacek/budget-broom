import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, LogOut, User, Sparkles, Lock } from 'lucide-react';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { BulkUpload } from '@/components/BulkUpload';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { ReceiptResults } from '@/components/ReceiptResults';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, PRICING_CONFIG } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileUploadResult } from '@/types';
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

interface UsageData {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  tier: 'free' | 'plus' | 'pro';
}

const Dashboard = () => {
  const { user, signOut, session } = useAuth();
  const { subscriptionData, refreshSubscription, createCheckout } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'single' | 'bulk'>('single');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { getSuggestionsForItem } = useSmartSuggestions();

  // Check if user is on Pro tier
  const isPro = subscriptionData?.product_id === PRICING_CONFIG.pro.product_id;

  // Check usage and return whether processing is allowed
  const checkUsageAllowed = async (): Promise<UsageData | null> => {
    if (!session) return null;
    
    setIsCheckingUsage(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-usage', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Failed to check usage:', error);
        toast({
          title: "Usage check failed",
          description: "Unable to verify your usage limits. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      return data as UsageData;
    } catch (error) {
      console.error('Error checking usage:', error);
      return null;
    } finally {
      setIsCheckingUsage(false);
    }
  };

  // Increment usage after successful processing
  const incrementUsage = async () => {
    if (!session) return;
    
    try {
      const { error } = await supabase.functions.invoke('increment-usage', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Failed to increment usage:', error);
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  // Get the next tier name for upgrade prompt
  const getNextTierName = (currentTier: string): string => {
    if (currentTier === 'free') return 'Plus';
    if (currentTier === 'plus') return 'Pro';
    return 'Pro';
  };

  // Handle upgrade button click
  const handleUpgrade = async () => {
    const tier = usageData?.tier || 'free';
    const priceId = tier === 'free' 
      ? PRICING_CONFIG.plus.monthly_price_id 
      : PRICING_CONFIG.pro.monthly_price_id;
    
    const url = await createCheckout(priceId);
    if (url) {
      window.open(url, '_blank');
    }
    setShowUpgradeModal(false);
  };

  // Handle checkout success/cancel feedback
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      // Refresh subscription to get the latest plan info
      refreshSubscription().then(() => {
        // Determine plan name from subscription data
        let planName = 'your plan';
        if (subscriptionData.product_id === PRICING_CONFIG.plus.product_id) {
          planName = 'Plus';
        } else if (subscriptionData.product_id === PRICING_CONFIG.pro.product_id) {
          planName = 'Pro';
        }

        toast({
          title: `🎉 Welcome to ${planName}!`,
          description: "Your subscription is now active.",
        });
      });

      // Remove the query param from URL
      window.history.replaceState({}, '', '/dashboard');
    }

    if (canceled === 'true') {
      toast({
        title: "Checkout canceled",
        description: "You can upgrade anytime from your profile menu.",
      });

      // Remove the query param from URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    // Check usage before processing
    const usage = await checkUsageAllowed();
    if (!usage) return;

    if (!usage.allowed) {
      setUsageData(usage);
      setPendingFile(file);
      setShowUpgradeModal(true);
      return;
    }

    await processFile(file);
  };

  const processFile = async (file: File) => {
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
          is_return: data.isReturn || false,
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

      // Increment usage after successful processing
      await incrementUsage();

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
    // Increment usage for each successfully processed receipt
    for (let i = 0; i < results.length; i++) {
      await incrementUsage();
    }

    toast({
      title: "Bulk processing completed",
      description: `Successfully processed ${results.length} receipts with enhanced categorization.`,
    });
    
    // Navigate to receipt history to view all processed receipts
    setTimeout(() => {
      navigate('/receipt-history');
    }, 1500);
  };

  // Check usage before allowing bulk upload
  const handleBulkUploadStart = async () => {
    const usage = await checkUsageAllowed();
    if (!usage) return false;

    if (!usage.allowed) {
      setUsageData(usage);
      setShowUpgradeModal(true);
      return false;
    }

    return true;
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
              {!extractedData ? (
                <div className="space-y-6">
                  {/* Toggle between single and bulk upload */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant={processingMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setProcessingMode('single')}
                    >
                      Single Upload
                    </Button>
                    
                    {isPro ? (
                      <Button
                        variant={processingMode === 'bulk' ? 'default' : 'outline'}
                        onClick={() => setProcessingMode('bulk')}
                      >
                        Bulk Upload
                      </Button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              disabled
                              className="gap-2 opacity-60"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Bulk Upload
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Pro feature - upgrade to unlock</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {isProcessing ? (
                    <ProcessingProgress 
                      isProcessing={isProcessing} 
                      progress={progress} 
                      currentStep={currentStep}
                      fileName={currentFileName}
                      estimatedTime={Math.max(10 - Math.floor(progress / 10), 1)}
                    />
                  ) : (
                    processingMode === 'single' || !isPro ? (
                      <ReceiptUpload onFileSelect={handleFileUpload} />
                    ) : (
                      <BulkUpload onComplete={handleBulkUpload} />
                    )
                  )}
                </div>
              ) : (
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
          </section>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Monthly Limit Reached
            </DialogTitle>
            <DialogDescription className="pt-2">
              You've used all {usageData?.limit || 0} receipts this month on the {usageData?.tier || 'free'} plan.
              {usageData?.tier !== 'pro' && (
                <span className="block mt-2">
                  Upgrade to <strong>{getNextTierName(usageData?.tier || 'free')}</strong> for {usageData?.tier === 'free' ? '500' : '2,500'} receipts per month!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowUpgradeModal(false);
                setPendingFile(null);
              }}
            >
              Maybe Later
            </Button>
            {usageData?.tier !== 'pro' && (
              <Button onClick={handleUpgrade}>
                Upgrade Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Dashboard;