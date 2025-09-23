import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Loader2, Receipt } from 'lucide-react';

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface ProcessingProgressProps {
  fileName: string;
  isProcessing: boolean;
  onComplete: () => void;
}

export function ProcessingProgress({ fileName, isProcessing, onComplete }: ProcessingProgressProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'upload',
      label: 'File Upload',
      description: 'Validating and preprocessing file',
      completed: true,
      active: false
    },
    {
      id: 'ocr',
      label: 'Text Extraction',
      description: 'Reading text from receipt using OCR',
      completed: false,
      active: true
    },
    {
      id: 'parsing',
      label: 'Data Parsing',
      description: 'Structuring line items and details',
      completed: false,
      active: false
    },
    {
      id: 'categorization',
      label: 'Categorization',
      description: 'Assigning categories to items',
      completed: false,
      active: false
    }
  ]);

  const [progress, setProgress] = useState(25);

  useEffect(() => {
    if (!isProcessing) return;

    // Advance through steps every 2-3 seconds while processing
    const stepInterval = setInterval(() => {
      setSteps(prev => {
        const activeStepIndex = prev.findIndex(step => step.active);
        const nextIncompleteIndex = prev.findIndex(step => !step.completed && !step.active);
        
        if (nextIncompleteIndex === -1) return prev; // All steps completed or active
        
        return prev.map((step, index) => {
          if (index === activeStepIndex) {
            return { ...step, completed: true, active: false };
          } else if (index === nextIncompleteIndex) {
            return { ...step, active: true };
          }
          return step;
        });
      });
      
      setProgress(prev => Math.min(prev + 15, 90)); // Progress up to 90%, then wait for completion
    }, 2500);

    return () => clearInterval(stepInterval);
  }, [isProcessing]);

  // Handle completion when processing finishes
  useEffect(() => {
    if (!isProcessing && progress > 0) {
      // Complete all steps and progress
      setSteps(prev => prev.map(step => ({ ...step, completed: true, active: false })));
      setProgress(100);
      
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [isProcessing, onComplete, progress]);

  return (
    <Card className="p-8 bg-gradient-card shadow-large">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-hero/10 backdrop-blur-sm border border-primary/20 rounded-full mb-6">
          <Receipt className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI Processing</span>
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Processing Receipt</h2>
        <p className="text-muted-foreground text-lg">
          Processing <span className="font-semibold text-primary">{fileName}</span>
        </p>
      </div>

      <div className="mb-8">
        <Progress value={progress} className="h-3 bg-gradient-subtle" />
        <p className="text-sm text-muted-foreground mt-3 text-center font-medium">
          {progress}% complete
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-subtle/30 transition-all duration-300">
            <div className="flex-shrink-0 mt-1">
              {step.completed ? (
                <CheckCircle className="h-6 w-6 text-success drop-shadow-sm" />
              ) : step.active ? (
                <Loader2 className="h-6 w-6 text-primary animate-spin drop-shadow-sm" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${
                step.completed ? 'text-success' :
                step.active ? 'text-primary' :
                'text-muted-foreground'
              }`}>
                {step.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}