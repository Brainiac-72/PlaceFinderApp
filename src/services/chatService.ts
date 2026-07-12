import { supabase } from '../utils/supabase';

export interface ChatSession {
  id: string;
  property_id: string;
  seeker_id: string;
  landlord_id: string;
  created_at: string;
  updated_at: string;
  property?: any;
  landlord?: any;
  seeker?: any;
  last_message?: ChatMessage;
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

/**
 * Service object encapsulating all database interactions for the Chat/Messaging feature.
 * Connects directly to the 'chats' and 'messages' tables in Supabase.
 */
export const chatService = {
  async getUserChats(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        property:property_id(*),
        landlord:landlord_id(*),
        seeker:seeker_id(*)
      `)
      .or(`seeker_id.eq.${userId},landlord_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
    
    const chats = data || [];
    
    // Deduplicate chats so we only show one chat per unique person pair
    const uniqueChatsMap = new Map<string, ChatSession>();
    for (const chat of chats) {
      const otherUserId = chat.seeker_id === userId ? chat.landlord_id : chat.seeker_id;
      if (!uniqueChatsMap.has(otherUserId)) {
         uniqueChatsMap.set(otherUserId, chat);
      } else {
         const existing = uniqueChatsMap.get(otherUserId)!;
         if (new Date(chat.updated_at) > new Date(existing.updated_at)) {
            uniqueChatsMap.set(otherUserId, chat);
         }
      }
    }
    
    const uniqueChats = Array.from(uniqueChatsMap.values());
    
    // Fetch the last message for each chat
    for (const chat of uniqueChats) {
       const { data: msgs } = await supabase
         .from('messages')
         .select('*')
         .eq('chat_id', chat.id)
         .order('created_at', { ascending: false })
         .limit(1);
         
       if (msgs && msgs.length > 0) {
         const msg = msgs[0];
         // Parse any attached property encoded in the content
         const match = msg.content.match(/^\[ATTACHED_PROPERTY:([a-zA-Z0-9-]+)\]([\s\S]*)$/);
         if (match) {
           msg.attached_property_id = match[1];
           msg.content = match[2];
         }
         chat.last_message = msg;
       }
    }

    return uniqueChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async getOrCreateChat(propertyId: string, seekerId: string, landlordId: string): Promise<string | null> {
    // Check if chat exists
    const { data: existingChats, error: fetchError } = await supabase
      .from('chats')
      .select('id')
      .eq('seeker_id', seekerId)
      .eq('landlord_id', landlordId)
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
        landlord_id: landlordId
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
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    const messages = data || [];
    
    // Manually parse attached_property_id from content
    for (const msg of messages) {
       if (msg.content) {
         const match = msg.content.match(/^\[ATTACHED_PROPERTY:([a-zA-Z0-9-]+)\]([\s\S]*)$/);
         if (match) {
           msg.attached_property_id = match[1];
           msg.content = match[2];
         }
       }
    }
    
    // Fetch attached properties if any
    const propertyIds = messages.map(m => m.attached_property_id).filter(Boolean);
    if (propertyIds.length > 0) {
       const { data: props } = await supabase.from('properties').select('*').in('id', propertyIds);
       if (props) {
         for (const msg of messages) {
           if (msg.attached_property_id) {
             msg.attached_property = props.find(p => p.id === msg.attached_property_id);
           }
         }
       }
    }
    
    return messages;
  },

  async sendMessage(chatId: string, senderId: string, content: string, attachedPropertyId?: string): Promise<ChatMessage | null> {
    const finalContent = attachedPropertyId ? `[ATTACHED_PROPERTY:${attachedPropertyId}]${content}` : content;
    const insertData: any = {
      chat_id: chatId,
      sender_id: senderId,
      content: finalContent
    };
    
    // Fallback: Check if receiver_id is needed by fetching chat details
    const chatDetails = await this.getChatDetails(chatId);
    if (chatDetails) {
       insertData.receiver_id = chatDetails.seeker_id === senderId ? chatDetails.landlord_id : chatDetails.seeker_id;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    
    if (data) {
       const match = data.content.match(/^\[ATTACHED_PROPERTY:([a-zA-Z0-9-]+)\]([\s\S]*)$/);
       if (match) {
         data.attached_property_id = match[1];
         data.content = match[2];
       }
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
        landlord:landlord_id(*),
        seeker:seeker_id(*)
      `)
      .eq('id', chatId)
      .single();
      
      if (error) {
          console.error("Error fetching chat details", error);
          return null;
      }
      return data;
  },
  
  async getUnreadMessagesCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', userId);
      
    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
    return count || 0;
  }
};
