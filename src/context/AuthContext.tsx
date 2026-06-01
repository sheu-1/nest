import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { storage } from '../utils/storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete session handling for WebBrowser
WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'tenant' | 'landlord';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: UserRole;
  onboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>; // only used during onboarding signup
  switchRole: () => Promise<void>; // toggle between tenant and landlord
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<{ error: any }>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>('tenant');
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Load role from storage first (set during onboarding)
      const storedRole = await storage.getRole();
      if (storedRole) setRoleState(storedRole);

      const isCompleted = await storage.getOnboardingCompleted();
      setOnboardingCompletedState(isCompleted);

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const session = data?.session ?? null;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // 1. Try to read their role from Supabase user_metadata first
          let currentRole = session.user.user_metadata?.role as UserRole | undefined;
          
          // 2. If missing, check the DB profiles table
          if (!currentRole) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            if (profile?.role) {
              currentRole = profile.role as UserRole;
            }
          }

          if (currentRole) {
            setRoleState(currentRole);
            await storage.setRole(currentRole); // Keep local in sync
          }
        }
      } catch (e: any) {
        console.warn('Session restoration failed:', e);
        // Only clear and force signout if it's explicitly an auth error (not a network request error!)
        const errorMsg = e?.message?.toLowerCase() || '';
        const isNetworkError = errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('failed to fetch');
        
        if (!isNetworkError) {
          setSession(null);
          setUser(null);
          try {
            await supabase.auth.signOut();
          } catch (_) {}
        }
      }

      setIsLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        let currentRole = session.user.user_metadata?.role as UserRole | undefined;
        
        if (!currentRole) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (profile?.role) {
            currentRole = profile.role as UserRole;
          }
        }

        if (currentRole) {
          setRoleState(currentRole);
          await storage.setRole(currentRole);
        }
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only called during onboarding before signup
  const setRole = async (newRole: UserRole) => {
    await storage.setRole(newRole);
    setRoleState(newRole);
  };

  const completeOnboarding = async () => {
    await storage.setOnboardingCompleted();
    setOnboardingCompletedState(true);
  };

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    return await supabase.auth.signInWithPassword(credentials);
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    return await supabase.auth.signUp(credentials);
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = Linking.createURL('/(auth)/sign-in');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const parsed = Linking.parse(result.url);
          const access_token = parsed.queryParams?.access_token as string | undefined;
          const refresh_token = parsed.queryParams?.refresh_token as string | undefined;

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
            return { error: null };
          }
        }
      }
      return { error: new Error('Google Sign In cancelled.') };
    } catch (err: any) {
      console.error('Google OAuth Error:', err);
      return { error: err };
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const redirectUrl = Linking.createURL('/reset-password');
      return await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    } catch (err: any) {
      return { error: err };
    }
  };

  const switchRole = async () => {
    const newRole: UserRole = role === 'tenant' ? 'landlord' : 'tenant';
    setRoleState(newRole);
    await storage.setRole(newRole);

    // Update Supabase user_metadata
    try {
      await supabase.auth.updateUser({ data: { role: newRole } });
    } catch (e) {
      console.warn('Failed to update user_metadata role:', e);
    }

    // Update profiles table
    if (user) {
      try {
        await supabase.from('profiles').upsert({ id: user.id, role: newRole });
      } catch (e) {
        console.warn('Failed to update profiles role:', e);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear onboarding so next user starts fresh
    await storage.setRole('tenant');
    setRoleState('tenant');
  };

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, role, onboardingCompleted,
      setRole, switchRole, completeOnboarding, signIn, signUp, signInWithGoogle, resetPasswordForEmail, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
