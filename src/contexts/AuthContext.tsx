'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const currentUser = session?.user
      setUser(currentUser ?? null)
      
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
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

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Force clear local state immediately
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if signOut fails, clear local state
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }, [supabase])

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