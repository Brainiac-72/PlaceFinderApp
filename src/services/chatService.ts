import { supabase } from '../utils/supabase';

export interface ChatSession {
  id: string;
  property_id: string;
  seeker_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  property?: any;
  owner?: any;
  seeker?: any;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attached_property_id?: string;
  attached_property?: any;
}

export const chatService = {
  async getUserChats(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        property:property_id(*),
        owner:owner_id(*),
        seeker:seeker_id(*)
      `)
      .or(`seeker_id.eq.${userId},owner_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }

    return data || [];
  },

  async getOrCreateChat(propertyId: string, seekerId: string, ownerId: string): Promise<string | null> {
    // Check if chat exists
    const { data: existingChats, error: fetchError } = await supabase
      .from('chats')
      .select('id')
      .eq('property_id', propertyId)
      .eq('seeker_id', seekerId)
      .eq('owner_id', ownerId)
      .limit(1);

    if (fetchError) {
      console.error('Error checking chat:', fetchError);
      return null;
    }

    if (existingChats && existingChats.length > 0) {
      return existingChats[0].id;
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        property_id: propertyId,
        seeker_id: seekerId,
        owner_id: ownerId
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating chat:', createError);
      return null;
    }

    return newChat.id;
  },

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*, attached_property:properties(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  },

  async sendMessage(chatId: string, senderId: string, content: string, attachedPropertyId?: string): Promise<ChatMessage | null> {
    const insertData: any = {
      chat_id: chatId,
      sender_id: senderId,
      content: content
    };
    if (attachedPropertyId) {
      insertData.attached_property_id = attachedPropertyId;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select('*, attached_property:properties(*)')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // Update the updated_at timestamp of the chat
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return data;
  },
  
  async getChatDetails(chatId: string): Promise<ChatSession | null> {
      const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        property:property_id(*),
        owner:owner_id(*),
        seeker:seeker_id(*)
      `)
      .eq('id', chatId)
      .single();
      
      if (error) {
          console.error("Error fetching chat details", error);
          return null;
      }
      return data;
  }
};
