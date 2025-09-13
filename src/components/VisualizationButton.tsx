import React from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

interface VisualizationButtonProps {
  messageId: string;
  messageText: string;
  onCreateVisualization: (messageId: string, messageText: string) => void;
  onViewVisualization: (messageId: string) => void;
  visualizationState: any;
}

export const VisualizationButton: React.FC<VisualizationButtonProps> = ({
  messageId,
  messageText,
  onCreateVisualization,
  onViewVisualization,
  visualizationState
}) => {
  const handleClick = () => {
    if (visualizationState?.content) {
      onViewVisualization(messageId);
    } else {
      onCreateVisualization(messageId, messageText);
    }
  };

  const handleTryAgain = () => {
    onCreateVisualization(messageId, messageText);
  };

  const buttonText = visualizationState?.isGenerating
    ? 'Generating...'
    : visualizationState?.content
    ? 'View Visualization'
    : 'Create Visualization';

  // If visualization exists and is not generating, show both buttons
  if (visualizationState?.content && !visualizationState?.isGenerating) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleClick}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 min-h-[44px] touch-manipulation"
        >
          <BarChart3 className="w-4 h-4" />
          <span>{buttonText}</span>
        </button>
        
        <button
          onClick={handleTryAgain}
          className="flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 min-h-[44px] touch-manipulation"
          title="Generate a new visualization"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Try Again</span>
        </button>
      </div>
    );
  }

  // Default single button for initial creation or when generating
  return (
    <button
      onClick={handleClick}
      disabled={visualizationState?.isGenerating}
      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
    >
      <BarChart3 className={`w-4 h-4 ${visualizationState?.isGenerating ? 'animate-pulse' : ''}`} />
      <span>{buttonText}</span>
    </button>
  );
};