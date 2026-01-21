import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, X, CheckCircle, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { FileUploadResult } from '@/types';

interface FileUploadState {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: FileUploadResult;
  error?: string;
  progress: number;
}

interface BulkUploadProps {
  onComplete: (results: FileUploadResult[]) => void;
  onBeforeProcess?: () => Promise<boolean>;
}

export function BulkUpload({ onComplete, onBeforeProcess }: BulkUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const handleFileSelection = useCallback((newFiles: FileList) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/csv'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10; // Limit bulk uploads

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach(file => {
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`);
        return;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (files.length + validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed in bulk upload`);
      return;
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "File validation errors",
        description: errors.join(', '),
      });
    }

    if (validFiles.length > 0) {
      const newFileStates = validFiles.map(file => ({
        file,
        status: 'pending' as const,
        progress: 0,
      }));

      setFiles(prev => [...prev, ...newFileStates]);
    }
  }, [files.length, toast]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = async () => {
    if (!user || files.length === 0) return;

    // Check usage limits before processing if callback provided
    if (onBeforeProcess) {
      const allowed = await onBeforeProcess();
      if (!allowed) {
        return; // Parent component handles the upgrade modal
      }
    }

    setIsProcessing(true);
    let completedCount = 0;
    const results: FileUploadResult[] = [];

    try {
      // Process files in parallel but with concurrency limit
      const concurrencyLimit = 3;
      const chunks: FileUploadState[][] = [];
      
      for (let i = 0; i < files.length; i += concurrencyLimit) {
        chunks.push(files.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (fileState, chunkIndex) => {
          const globalIndex = chunks.slice(0, chunks.indexOf(chunk)).flat().length + chunkIndex;
          return processFile(fileState.file, globalIndex);
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults.filter(result => result !== null));
        
        completedCount += chunk.length;
        setOverallProgress((completedCount / files.length) * 100);
      }

      // Save all results to database
      if (results.length > 0) {
        const receipts = results.map(result => ({
          user_id: user.id,
          store_name: result.storeName,
          date: result.date,
          subtotal: result.subtotal,
          total: result.total,
          line_items: result.lineItems,
          discounts: result.discounts || [],
          taxes: result.taxes || [],
          additional_charges: result.additionalCharges || [],
          original_filename: result.originalFilename,
        }));

        const { error: insertError } = await supabase
          .from('receipts')
          .insert(receipts.map(r => ({
            ...r,
            line_items: r.line_items as any,
            discounts: r.discounts as any,
            taxes: r.taxes as any,
            additional_charges: r.additional_charges as any,
          })));

        if (insertError) {
          throw insertError;
        }

        toast({
          title: "Bulk upload completed",
          description: `Successfully processed ${results.length} of ${files.length} files.`,
        });

        onComplete(results);
      }
    } catch (error) {
      console.error('Bulk processing error:', error);
      toast({
        variant: "destructive",
        title: "Bulk processing failed",
        description: "Some files could not be processed. Please check individual file errors.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File, index: number): Promise<any | null> => {
    try {
      // Update file status to processing
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'processing', progress: 10 } : f
      ));

      // Upload file to Supabase Storage first
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 30 } : f
      ));

      // Call parse-receipt with the stored image path
      const response = await supabase.functions.invoke('parse-receipt', {
        body: {
          imagePath: fileName,
          mimeType: file.type,
          fileName: file.name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = {
        ...response.data,
        originalFilename: file.name,
      };

      // Update file status to completed
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'completed', progress: 100, result } : f
      ));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      // Update file status to error
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', progress: 0, error: errorMessage } : f
      ));

      return null;
    }
  };

  const getStatusIcon = (status: FileUploadState['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: FileUploadState['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card className="border-2 border-dashed transition-all duration-200 ease-in-out hover:shadow-glow bg-gradient-card/50 backdrop-blur-sm">
        <div
          className="p-12 text-center transition-all duration-300 rounded-lg border-border hover:border-primary/50 hover:bg-gradient-subtle/30"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              handleFileSelection(files);
            }
          }}
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-hero shadow-glow">
            <Upload className="h-10 w-10 text-white" />
          </div>
          
          <h3 className="mb-4 text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-raleway">Bulk Receipt Upload</h3>
          <p className="mb-6 text-muted-foreground text-lg">
            Drop multiple files here or click to select up to 10 receipts
          </p>
          
          <div className="mb-8 flex justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-subtle/50 px-3 py-2 rounded-full">
              <Image className="h-4 w-4" />
              <span className="font-medium">Images</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-subtle/50 px-3 py-2 rounded-full">
              <FileText className="h-4 w-4" />
              <span className="font-medium">PDFs</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-subtle/50 px-3 py-2 rounded-full">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="font-medium">CSVs</span>
            </div>
          </div>
          
          <Button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*,.pdf,.csv';
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) handleFileSelection(files);
              };
              input.click();
            }}
            disabled={isProcessing}
            variant="hero"
            size="lg"
            className="transition-all duration-200 hover:scale-105 shadow-glow"
          >
            {isProcessing ? 'Processing...' : 'Select Files'}
          </Button>
          
          <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
            Images, PDFs, CSVs up to 10MB · Secure & private <Lock className="h-3 w-3" />
          </p>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Files to Process ({files.length})
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={isProcessing}
              >
                Clear All
              </Button>
              <Button
                onClick={processFiles}
                disabled={isProcessing || files.length === 0}
              >
                {isProcessing ? 'Processing...' : 'Process All Files'}
              </Button>
            </div>
          </div>

          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
          )}

          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {files.map((fileState, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(fileState.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {fileState.file.name}
                      </span>
                      {getStatusBadge(fileState.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {(fileState.file.size / 1024 / 1024).toFixed(1)} MB
                    </div>

                    {fileState.status === 'processing' && (
                      <Progress value={fileState.progress} className="mt-2" />
                    )}

                    {fileState.error && (
                      <div className="text-sm text-red-600 mt-1">
                        {fileState.error}
                      </div>
                    )}

                    {fileState.result && (
                      <div className="text-sm text-green-600 mt-1">
                        Extracted {fileState.result.lineItems?.length || 0} items
                      </div>
                    )}
                  </div>

                  {!isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}