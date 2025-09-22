import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Eye, EyeOff } from 'lucide-react';

export const ThemeToggle = () => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (isPreviewMode) {
      document.documentElement.classList.add('preview-theme');
    } else {
      document.documentElement.classList.remove('preview-theme');
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('preview-theme');
    };
  }, [isPreviewMode]);

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={togglePreview}
      className={`gap-2 transition-all duration-200 ${
        isPreviewMode 
          ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20' 
          : 'hover:bg-accent/10'
      }`}
    >
      {isPreviewMode ? (
        <>
          <EyeOff className="h-4 w-4" />
          Exit Preview
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Preview Style
        </>
      )}
    </Button>
  );
};