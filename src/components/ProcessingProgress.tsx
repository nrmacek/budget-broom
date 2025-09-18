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
  onComplete: () => void;
}

export function ProcessingProgress({ fileName, onComplete }: ProcessingProgressProps) {
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
    const processSteps = async () => {
      // Simulate OCR processing
      setTimeout(() => {
        setSteps(prev => prev.map(step => 
          step.id === 'ocr' 
            ? { ...step, completed: true, active: false }
            : step.id === 'parsing'
            ? { ...step, active: true }
            : step
        ));
        setProgress(50);
      }, 2000);

      // Simulate parsing
      setTimeout(() => {
        setSteps(prev => prev.map(step => 
          step.id === 'parsing' 
            ? { ...step, completed: true, active: false }
            : step.id === 'categorization'
            ? { ...step, active: true }
            : step
        ));
        setProgress(75);
      }, 4000);

      // Simulate categorization
      setTimeout(() => {
        setSteps(prev => prev.map(step => 
          step.id === 'categorization' 
            ? { ...step, completed: true, active: false }
            : step
        ));
        setProgress(100);
        
        setTimeout(() => {
          onComplete();
        }, 1000);
      }, 6000);
    };

    processSteps();
  }, [onComplete]);

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