import { useState, useCallback, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

type ChatRow = Database['public']['Tables']['astra_chats']['Row'];
type ChatInsert = Database['public']['Tables']['astra_chats']['Insert'];

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export const useChats = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a new conversation ID
  const createNewConversation = useCallback(() => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    setCurrentMessages([]);
    return newConversationId;
  }, []);

  // Log a chat message to the database
  const logChatMessage = useCallback(async (
    prompt: string,
    response: string,
    conversationId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const chatConversationId = conversationId || currentConversationId || createNewConversation();
      
      const chatData: ChatInsert = {
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || 'Unknown User',
        prompt,
        response,
        conversation_id: chatConversationId,
        session_id: user.id, // Using user ID as session ID for simplicity
      };

      const { data, error } = await supabase
        .from('astra_chats')
        .insert(chatData)
        .select()
        .single();

      if (error) {
        console.error('Error logging chat message:', error);
        setError('Failed to save chat message');
        return null;
      }

      // Update current messages if this is for the active conversation
      if (chatConversationId === currentConversationId) {
        const newMessage: ChatMessage = {
          id: data.id,
          prompt: data.prompt,
          response: data.response,
          createdAt: data.created_at,
        };
        setCurrentMessages(prev => [...prev, newMessage]);
      }

      // Refresh conversations list
      await fetchConversations();

      return chatConversationId;
    } catch (err) {
      console.error('Error in logChatMessage:', err);
      setError('Failed to save chat message');
      return null;
    }
  }, [user, currentConversationId, createNewConversation]);

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('astra_chats')
        .select('conversation_id, prompt, response, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations');
        return;
      }

      // Group messages by conversation_id
      const conversationMap = new Map<string, {
        messages: ChatRow[];
        firstMessage: ChatRow;
        lastMessage: ChatRow;
      }>();

      data.forEach((chat) => {
        const convId = chat.conversation_id || 'default';
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            messages: [],
            firstMessage: chat,
            lastMessage: chat,
          });
        }
        const conv = conversationMap.get(convId)!;
        conv.messages.push(chat);
        
        // Update first and last messages
        if (new Date(chat.created_at) < new Date(conv.firstMessage.created_at)) {
          conv.firstMessage = chat;
        }
        if (new Date(chat.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = chat;
        }
      });

      // Convert to conversation list
      const conversationList: Conversation[] = Array.from(conversationMap.entries()).map(
        ([id, { messages, firstMessage, lastMessage }]) => ({
          id,
          title: firstMessage.prompt.length > 50 
            ? firstMessage.prompt.substring(0, 50) + '...'
            : firstMessage.prompt,
          lastMessage: lastMessage.response.length > 100
            ? lastMessage.response.substring(0, 100) + '...'
            : lastMessage.response,
          createdAt: firstMessage.created_at,
          messageCount: messages.length,
        })
      );

      // Sort by creation date (newest first)
      conversationList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setConversations(conversationList);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load a specific conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Don't reload if it's already the current conversation
    if (conversationId === currentConversationId && currentMessages.length > 0) {
      return;
    }
    try {
      setLoading(true);
      
      // Clear current messages first to show loading state
      setCurrentMessages([]);
      setCurrentConversationId(conversationId);
      
      const { data, error } = await supabase
        .from('astra_chats')
        .select('id, prompt, response, created_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading conversation:', error);
        setError('Failed to load conversation');
        return;
      }

      const messages: ChatMessage[] = data.map(chat => ({
        id: chat.id,
        prompt: chat.prompt,
        response: chat.response,
        createdAt: chat.created_at,
      }));

      setCurrentMessages(messages);
      
      setLoading(false);
    } catch (err) {
      console.error('Error in loadConversation:', err);
      setError('Failed to load conversation');
      setLoading(false);
    }
  }, [user, currentConversationId, currentMessages.length]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('astra_chats')
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        setError('Failed to delete conversation');
        return;
      }

      // If we deleted the current conversation, start a new one
      if (conversationId === currentConversationId) {
        createNewConversation();
      }

      // Refresh conversations list
      await fetchConversations();
    } catch (err) {
      console.error('Error in deleteConversation:', err);
      setError('Failed to delete conversation');
    }
  }, [user, currentConversationId, createNewConversation, fetchConversations]);

  // Create a new conversation and clear current messages
  const startNewConversation = useCallback(() => {
    const newConversationId = createNewConversation();
    setCurrentMessages([]);
    return newConversationId;
  }, [createNewConversation]);
  // Initialize conversations when user logs in
  useEffect(() => {
    if (user) {
      fetchConversations();
      if (!currentConversationId) {
        createNewConversation();
      }
    }
  }, [user, fetchConversations, currentConversationId, createNewConversation]);

  return {
    conversations,
    currentConversationId,
    currentMessages,
    loading,
    error,
    logChatMessage,
    fetchConversations,
    loadConversation,
    deleteConversation,
    createNewConversation,
    startNewConversation,
    setError,
  };
};