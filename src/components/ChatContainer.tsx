import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';
import { ChatInput } from './ChatInput';
import { VisualizationView } from './VisualizationView';
import { VisualizationLoadingView } from './VisualizationLoadingView';
import { useChat } from '../hooks/useChat';
import { useVisualization } from '../hooks/useVisualization';

interface ChatContainerProps {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  sidebarOpen, 
  onCloseSidebar 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    inputValue,
    setInputValue,
    sendMessage,
    toggleMessageExpansion,
    loadConversation,
    startNewConversation,
    currentConversationId,
    updateVisualizationStatus
  } = useChat();

  const {
    generateVisualization,
    showVisualization,
    hideVisualization,
    getVisualization,
    currentVisualization,
    isGenerating,
    scrollToMessageId,
    clearScrollToMessage
  } = useVisualization(updateVisualizationStatus);
  // Register service worker for PWA
  useEffect(() => {
    // Initial scroll to bottom on component mount
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  // Handle viewport adjustments for mobile keyboards
  useEffect(() => {
    // If we need to scroll to a specific message, do that instead
    if (scrollToMessageId) {
      const messageElement = document.getElementById(`message-${scrollToMessageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearScrollToMessage();
        return;
      }
    }
    
    // Otherwise, scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    const handleResize = () => {
      // Force scroll to bottom when keyboard appears/disappears
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [messagesEndRef, messages, scrollToMessageId, clearScrollToMessage]);

  // Show loading view when generating visualization
  if (isGenerating) {
    return <VisualizationLoadingView />;
  }

  // Show visualization view if one is currently active
  if (currentVisualization) {
    const visualization = getVisualization(currentVisualization);
    if (visualization?.content) {
      return (
        <VisualizationView
          content={visualization.content}
          onBack={hideVisualization}
        />
      );
    }
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-20 md:pb-24 px-3 md:px-4">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-4 pt-4">
          {messages.map((message) => (
            <div key={message.id} id={`message-${message.id}`}>
              <MessageBubble
                message={message}
                onToggleExpansion={toggleMessageExpansion}
                onCreateVisualization={generateVisualization}
                onViewVisualization={showVisualization}
                visualizationState={getVisualization(message.id)}
              />
            </div>
          ))}
        
          {isLoading && <LoadingIndicator />}
        
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={sendMessage}
        disabled={isLoading}
      />
    </div>
  );
};