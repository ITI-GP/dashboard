import { useEffect, useState } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { supabase } from '@/providers/supabaseClient';

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  isVerified: boolean;
  isCompany: boolean;
  isOwner: boolean;
  isRenter: boolean;
  created_at: string;
};

export const useCurrentUser = () => {
  const { data: identity } = useGetIdentity<any>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!identity?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', identity.email)
          .single();

        if (fetchError) throw fetchError;
        
        setUser(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [identity?.email]);

  return { user, loading, error };
};
