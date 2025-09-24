import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertTriangle, Brain, Database, FileText } from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  details?: string;
}

interface ProcessingProgressProps {
  isProcessing: boolean;
  progress: number;
  currentStep?: string;
  steps?: ProcessingStep[];
  fileName?: string;
  estimatedTime?: number;
}

export function ProcessingProgress({ 
  isProcessing, 
  progress, 
  currentStep,
  steps,
  fileName,
  estimatedTime
}: ProcessingProgressProps) {
  if (!isProcessing) return null;

  const defaultSteps: ProcessingStep[] = [
    {
      id: 'upload',
      name: 'File Upload',
      description: 'Uploading and validating file',
      status: 'completed',
      icon: FileText,
    },
    {
      id: 'ocr',
      name: 'Text Recognition',
      description: 'Extracting text from image',
      status: progress > 25 ? 'completed' : progress > 10 ? 'processing' : 'pending',
      icon: Brain,
      progress: Math.min((progress / 25) * 100, 100),
    },
    {
      id: 'categorization',
      name: 'Smart Categorization',
      description: 'AI is categorizing items',
      status: progress > 75 ? 'completed' : progress > 50 ? 'processing' : 'pending',
      icon: Brain,
      progress: progress > 50 ? Math.min(((progress - 50) / 25) * 100, 100) : 0,
    },
    {
      id: 'save',
      name: 'Saving Data',
      description: 'Storing receipt information',
      status: progress > 95 ? 'completed' : progress > 85 ? 'processing' : 'pending',
      icon: Database,
      progress: progress > 85 ? Math.min(((progress - 85) / 10) * 100, 100) : 0,
    },
  ];

  const processingSteps = steps || defaultSteps;

  const getStepIcon = (step: ProcessingStep) => {
    const IconComponent = step.icon;
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepBadge = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="p-6 bg-gradient-card backdrop-blur-sm border shadow-glow">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Processing Receipt</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {fileName && <span>{fileName}</span>}
              {estimatedTime && (
                <>
                  <span>•</span>
                  <span>~{estimatedTime}s remaining</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3 bg-gradient-subtle shadow-inner" 
          />
        </div>

        {/* Step Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Processing Steps</h4>
          <div className="space-y-3">
            {processingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{step.name}</span>
                    {getStepBadge(step)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  
                  {step.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.details}
                    </p>
                  )}

                  {step.status === 'processing' && typeof step.progress === 'number' && (
                    <Progress value={step.progress} className="mt-2 h-1" />
                  )}
                </div>

                {/* Step number indicator */}
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  ${step.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    step.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    step.status === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-muted text-muted-foreground'}
                `}>
                  {step.status === 'completed' ? '✓' : index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-hero/10 p-3 rounded-lg">
          <Brain className="h-4 w-4 text-primary" />
          <span>AI is analyzing receipt structure and categorizing items intelligently</span>
        </div>
      </div>
    </Card>
  );
}