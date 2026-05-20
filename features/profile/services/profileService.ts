import { supabase } from '@/lib/supabase';
import type { ProfileData } from '../types/profile.types';

export const profileService = {
  async fetchCurrentProfile(): Promise<ProfileData | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return null;
    }

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, created_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        id: userId,
        fullName: null,
        email: userData.user.email ?? null,
        role: null,
      };
    }

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: userData.user.email ?? null,
      role: profile.role,
      createdAt: profile.created_at,
    };
  },
};
