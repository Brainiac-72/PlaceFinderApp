import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export type UserProfile = {
  id: string;
  role: 'owner' | 'seeker' | 'admin';
  full_name?: string;
  phone_number?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    // Only fetch if session exists
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (!error && data) {
      setProfile(data as UserProfile);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If auth initialization takes > 5s, force loading to false
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn("AuthProvider: Initialization timeout triggered");
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        // Parallelizing: Get session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error("Supabase getSession error:", error);
          }
          
          const currentUser = session?.user ?? null;
          setSession(session);
          setUser(currentUser);
          
          // CRITICAL PERFORMANCE OPTIMIZATION: 
          // Release the 'loading' block as soon as we have user info.
          // The profile fetch will happen in the background.
          setLoading(false);
          clearTimeout(timeoutId);

          if (currentUser) {
            // Trigger background fetch, don't await
            fetchProfile(currentUser.id);
          }
        }
      } catch (error) {
        console.error("Supabase getSession catch error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);
        
        if (currentUser) {
          fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        
        // Ensure loading is false on any auth state change
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
        session, 
        user, 
        profile, 
        loading, 
        refreshProfile: async () => {
          if (user) await fetchProfile(user.id);
        } 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
