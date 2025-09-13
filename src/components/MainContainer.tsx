import React, { useState } from 'react';
import { Header } from './Header';
import { ChatSidebar } from './ChatSidebar';
import { ChatContainer } from './ChatContainer';
import { GroupChat } from './GroupChat';
import { ChatModeToggle } from './ChatModeToggle';
import { ChatMode } from '../types';

export const MainContainer: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('private');

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Sidebar - only show for private chat mode */}
      {chatMode === 'private' && (
        <ChatSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onLoadConversation={(id) => {
            // This will be handled by ChatContainer
            setSidebarOpen(false);
          }}
          onStartNewConversation={() => {
            // This will be handled by ChatContainer
            setSidebarOpen(false);
          }}
        />
      )}
      
      <div className={`flex flex-col h-screen transition-all duration-300 ${
        sidebarOpen && chatMode === 'private' ? 'lg:ml-80' : ''
      }`}>
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={chatMode === 'private'}
          chatMode={chatMode}
        />
        
        {/* Chat Mode Toggle */}
        <div className="pt-16">
          <ChatModeToggle mode={chatMode} onModeChange={setChatMode} />
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {chatMode === 'private' ? (
            <ChatContainer 
              sidebarOpen={sidebarOpen}
              onCloseSidebar={() => setSidebarOpen(false)}
            />
          ) : (
            <GroupChat />
          )}
        </div>
      </div>
    </div>
  );
};