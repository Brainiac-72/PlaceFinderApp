import { supabase } from '../utils/supabase';
import { mapSupabaseProperty, Property } from '../utils/propertyUtils';

export const propertyService = {
  async getAllProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, profiles:owner_id(phone_number)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapSupabaseProperty);
  },

  async getMyProperties(userId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, profiles:owner_id(phone_number)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSupabaseProperty);
  },

  async getPropertyById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, profiles:owner_id(phone_number)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? mapSupabaseProperty(data) : null;
  },

  async incrementViewCount(propertyId: string) {
    // Fire and forget
    supabase.rpc('increment_view_count', { property_id: propertyId }).then(() => {});
    // Fallback if RPC isn't available
    supabase.from('properties').select('view_count').eq('id', propertyId).single().then(({ data }) => {
        if (data) {
            supabase.from('properties').update({ view_count: (data.view_count || 0) + 1 }).eq('id', propertyId).then(() => {});
        }
    });
  },

  async incrementShareCount(propertyId: string) {
    supabase.rpc('increment_share_count', { property_id: propertyId }).then(() => {});
    // Fallback
    supabase.from('properties').select('share_count').eq('id', propertyId).single().then(({ data }) => {
        if (data) {
            supabase.from('properties').update({ share_count: (data.share_count || 0) + 1 }).eq('id', propertyId).then(() => {});
        }
    });
  }
};
