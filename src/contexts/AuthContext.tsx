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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
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

      // Handle SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out')
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
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Initial session check with error handling
    ;(async () => {
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
          setSession(session)
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('[Auth] Initial session check failed:', error)
        setLoading(false)
      }
    })()

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile, router])

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