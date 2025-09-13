import React from 'react';
import { BarChart3 } from 'lucide-react';
import { GroupMessage as GroupMessageType } from '../types';

interface GroupMessageProps {
  message: GroupMessageType;
  currentUserId: string;
  onViewVisualization?: (messageId: string, visualizationData: string) => void;
  onCreateVisualization?: (messageId: string, messageContent: string) => void;
}

const formatMessageContent = (content: string, mentions: string[]): JSX.Element => {
  if (mentions.length === 0) {
    return <span className="text-gray-300">{content}</span>;
  }

  let formattedContent = content;
  mentions.forEach(mention => {
    const mentionRegex = new RegExp(`@${mention}`, 'gi');
    formattedContent = formattedContent.replace(
      mentionRegex,
      `<span class="bg-blue-600/20 text-blue-300 px-1 rounded">@${mention}</span>`
    );
  });

  return (
    <span 
      className="text-gray-300"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export const GroupMessage: React.FC<GroupMessageProps> = ({
  message,
  currentUserId,
  onViewVisualization,
  onCreateVisualization
}) => {
  const isOwnMessage = message.user_id === currentUserId;
  const isAstraMessage = message.message_type === 'astra';
  const hasVisualization = message.visualization_data;

  const handleVisualizationClick = () => {
    if (hasVisualization && onViewVisualization) {
      onViewVisualization(message.id, message.visualization_data!);
    } else if (isAstraMessage && onCreateVisualization) {
      onCreateVisualization(message.id, message.message_content);
    }
  };

  return (
    <div className={`flex mb-4 ${isOwnMessage && !isAstraMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {(!isOwnMessage || isAstraMessage) && (
        <div className="flex-shrink-0 mr-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isAstraMessage 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
              : 'bg-gray-600 text-white'
          }`}>
            {isAstraMessage ? '🚀' : message.user_name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwnMessage && !isAstraMessage ? 'ml-auto' : ''}`}>
        {/* User name and timestamp */}
        {(!isOwnMessage || isAstraMessage) && (
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-sm font-medium ${
              isAstraMessage ? 'text-blue-300' : 'text-gray-300'
            }`}>
              {message.user_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isOwnMessage && !isAstraMessage
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
            : isAstraMessage
            ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white border border-blue-500/20'
            : 'bg-gray-700 text-white'
        }`}>
          <div className="break-words text-sm leading-relaxed">
            {formatMessageContent(message.message_content, message.mentions)}
          </div>

          {/* Show original prompt for Astra messages */}
          {isAstraMessage && message.astra_prompt && (
            <div className="mt-2 pt-2 border-t border-gray-600/50">
              <div className="text-xs text-gray-400 mb-1">Responding to:</div>
              <div className="text-xs text-gray-300 italic">"{message.astra_prompt}"</div>
            </div>
          )}

          {/* Visualization button for Astra messages */}
          {isAstraMessage && (onViewVisualization || onCreateVisualization) && (
            <div className="mt-3">
              <button
                onClick={handleVisualizationClick}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{hasVisualization ? 'View Visualization' : 'Create Visualization'}</span>
              </button>
            </div>
          )}

          {/* Timestamp for own messages */}
          {isOwnMessage && !isAstraMessage && (
            <div className="text-xs opacity-70 mt-2">
              {formatTime(message.created_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};