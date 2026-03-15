'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error) {
        // Check for specific error code "PGRST116" which means "No rows returned"
        // This happens if the trigger failed or the user was created before the trigger existed
        if (error.code === 'PGRST116') {
          console.warn('[Auth] Profile not found, attempting to create default profile for:', currentUser.id);

          const newProfile = {
            id: currentUser.id,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Estudiante',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            daily_streak: 0,
            global_cognitive_credits: 500, // Default starting credits
            total_mastery_points: 0,
            learner_rank: 'G'
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('[Auth] Failed to create default profile:', createError.message);
            setProfile(null);
          } else {
            console.log('[Auth] Default profile created successfully');
            setProfile(createdProfile);
          }
        } else {
          console.error('[Auth] Error fetching profile:', error.message || error);
          setProfile(null);
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('[Auth] Unexpected error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event, session ? 'has session' : 'no session')

      // Handle TOKEN_REFRESHED event failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[Auth] Token refresh failed, signing out')
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        router.push('/login')
        return
      }

      console.log(`[Auth] State change: ${event}`, session ? `User: ${session.user.id}` : 'No session');
      
      // Handle SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setSession(session)
      const currentUser = session?.user
      setUser(currentUser ?? null)

      if (currentUser) {
        await fetchProfile(currentUser)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

      // Initial session check with error handling
      ; (async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error('[Auth] Session check error:', error)
            // If error contains refresh token issues, sign out
            if (error.message?.includes('refresh') || error.message?.includes('token')) {
              await supabase.auth.signOut()
            }
          }

          if (session) {
            console.log('[Auth] Initial session found:', session.user.id);
            setSession(session)
            setUser(session.user)
            await fetchProfile(session.user)
          } else {
            console.log('[Auth] No initial session found.');
            setLoading(false)
          }
        } catch (error) {
          console.error('[Auth] Initial session check failed:', error)
          setLoading(false)
        }
      })()

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile, router])

  // Safety timeout: if loading takes more than 5 seconds, force it to false
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Safety timeout: forcing loading to false after 5s');
        setLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [loading]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error during sign out:', error)
        throw error
      }
      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Failed to sign out:', error)
      // Even if there's an error, try to clear local state and redirect
      setUser(null)
      setProfile(null)
      setSession(null)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }
      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signOut,
    updateProfile,
  }), [user, profile, session, loading, signOut, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}