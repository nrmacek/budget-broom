import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

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
    <Card className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Processing Receipt</h2>
        <p className="text-muted-foreground">
          Processing <span className="font-medium">{fileName}</span>
        </p>
      </div>

      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {progress}% complete
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : step.active ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${
                step.completed ? 'text-success' :
                step.active ? 'text-primary' :
                'text-muted-foreground'
              }`}>
                {step.label}
              </h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}