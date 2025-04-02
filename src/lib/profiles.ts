
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

// Get a user's profile by ID
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    // Using the any type to bypass TypeScript errors since our database types
    // don't include the profiles table yet
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as Profile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

// Update a user's profile
export async function updateProfile(
  userId: string, 
  profileData: { username?: string; display_name?: string; avatar_url?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateProfile:', error);
    return { success: false, error: error.message };
  }
}
