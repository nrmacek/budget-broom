import { useState, useCallback } from 'react';
import { Upload, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ReceiptUploadProps {
  onFileSelect: (file: File) => void;
}

export function ReceiptUpload({ onFileSelect }: ReceiptUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/csv'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG, WebP), PDF, or CSV file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    onFileSelect(file);
    
    toast({
      title: "File uploaded successfully",
      description: `Processing ${file.name}...`,
    });
  }, [onFileSelect]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (type === 'application/pdf') return <FileText className="h-8 w-8" />;
    if (type === 'text/csv') return <FileSpreadsheet className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  return (
    <Card className="border-2 border-dashed transition-all duration-200 ease-in-out hover:shadow-glow bg-gradient-card/50 backdrop-blur-sm">
      <div
        className={`p-12 text-center transition-all duration-300 rounded-lg ${
          isDragOver 
            ? 'border-primary bg-gradient-hero/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-gradient-subtle/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-hero shadow-glow">
          <Upload className="h-10 w-10 text-white" />
        </div>
        
        <h3 className="mb-4 text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Upload Your Receipt</h3>
        <p className="mb-8 text-muted-foreground text-lg">
          Drag and drop your receipt here, or click to browse
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
            input.accept = 'image/*,.pdf,.csv';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileSelection(file);
            };
            input.click();
          }}
          disabled={isProcessing}
          variant="hero"
          size="lg"
          className="transition-all duration-200 hover:scale-105 shadow-glow"
        >
          {isProcessing ? 'Processing...' : 'Choose File'}
        </Button>
        
        <p className="mt-4 text-xs text-muted-foreground">
          Maximum file size: 10MB
        </p>
      </div>
    </Card>
  );
}