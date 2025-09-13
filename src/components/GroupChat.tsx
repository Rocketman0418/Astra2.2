import React, { useEffect, useRef, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { GroupMessage } from './GroupMessage';
import { MentionInput } from './MentionInput';
import { LoadingIndicator } from './LoadingIndicator';
import { VisualizationView } from './VisualizationView';
import { VisualizationLoadingView } from './VisualizationLoadingView';
import { useGroupChat } from '../hooks/useGroupChat';
import { useVisualization } from '../hooks/useVisualization';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
}

export const GroupChat: React.FC = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const {
    messages,
    loading,
    isAstraThinking,
    sendMessage,
    updateVisualizationData,
  } = useGroupChat();

  const {
    generateVisualization,
    showVisualization,
    hideVisualization,
    currentVisualization,
    isGenerating,
  } = useVisualization();

  // Fetch users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email')
          .neq('id', user?.id); // Exclude current user

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        setUsers(data || []);
      } catch (err) {
        console.error('Error in fetchUsers:', err);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAstraThinking]);

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    await sendMessage(message);
    setInputValue('');
  };

  // Handle visualization creation
  const handleCreateVisualization = async (messageId: string, messageContent: string) => {
    await generateVisualization(messageId, messageContent);
    
    // After generating, update the database with visualization data
    // This will be handled by the visualization hook
  };

  // Handle viewing visualization
  const handleViewVisualization = (messageId: string, visualizationData: string) => {
    showVisualization(messageId);
  };

  // Filter messages based on search
  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.message_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Show loading view when generating visualization
  if (isGenerating) {
    return <VisualizationLoadingView />;
  }

  // Show visualization view if one is currently active
  if (currentVisualization) {
    const message = messages.find(m => m.id === currentVisualization);
    if (message?.visualization_data) {
      return (
        <VisualizationView
          content={message.visualization_data}
          onBack={hideVisualization}
        />
      );
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Team Chat</h2>
              <p className="text-sm text-gray-400">
                {users.length + 1} members • Use @astra for AI help
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'No messages found' : 'No messages yet'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {searchQuery ? 'Try a different search term' : 'Start the conversation!'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <GroupMessage
                key={message.id}
                message={message}
                currentUserId={user?.id || ''}
                onViewVisualization={handleViewVisualization}
                onCreateVisualization={handleCreateVisualization}
              />
            ))}

            {isAstraThinking && (
              <div className="flex justify-start mb-4">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm">
                    🚀
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-2xl px-4 py-3 border border-blue-500/20">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Astra is thinking</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <MentionInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={loading}
          placeholder="Type a message... Use @astra for AI help"
          users={users}
        />
      </div>
    </div>
  );
};