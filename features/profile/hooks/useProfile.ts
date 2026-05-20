import { useEffect, useState } from 'react';
import { profileService } from '../services/profileService';
import type { ProfileData } from '../types/profile.types';

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await profileService.fetchCurrentProfile();
        setProfile(data);
        setError(null);
      } catch {
        setError('No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return { profile, loading, error };
}
