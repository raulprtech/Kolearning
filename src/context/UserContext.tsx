'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User, TutorSession } from '@/types';

// Helper to compare whether two dates fall on the same calendar day.
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Fetch a user's document from Supabase. Returns null if not found.
async function getUserData(uid: string): Promise<User | null> {
  const supabase = createSupabaseBrowserClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();
    if (error) {
      throw error;
    }
    return data as User;
  } catch (err) {
    console.error('Failed to fetch user data:', err);
    return null;
  }
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  decrementEnergy: (cost?: number) => void;
  addEnergy: (amount: number) => void;
  addCoins: (amount: number) => void;
  subtractCoins: (amount: number) => void;
  addDominionPoints: (amount: number) => void;
  completeSessionForToday: () => void;
  tutorSession: TutorSession | null;
  setTutorSession: React.Dispatch<React.SetStateAction<TutorSession | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorSession, setTutorSession] = useState<TutorSession | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Listen to auth state and load user profile
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        if (session?.user) {
          try {
            const userData = await getUserData(session.user.id);
            setUser(userData);
          } catch (error) {
            console.error("Error fetching user data on auth change:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Recover energy every minute if at least 2 hours have passed since last recovery
    const interval = setInterval(() => {
      setUser((currentUser) => {
        if (!currentUser || currentUser.energy >= 10) return currentUser;
        const now = Date.now();
        const lastRecoveryString = localStorage.getItem(
          'lastEnergyRecoveryTimestamp'
        );
        const lastRecovery = lastRecoveryString
          ? parseInt(lastRecoveryString, 10)
          : now;
        const hoursPassed = (now - lastRecovery) / (1000 * 60 * 60);
        if (hoursPassed >= 2) {
          const energyToRecover = Math.floor(hoursPassed / 2);
          const newEnergy = Math.min(10, currentUser.energy + energyToRecover);
          if (newEnergy > currentUser.energy) {
            localStorage.setItem('lastEnergyRecoveryTimestamp', now.toString());
            // Persist updated energy
            supabase
              .from('users')
              .update({ energy: newEnergy })
              .eq('id', currentUser.id)
              .catch((err) => console.error('Failed to update energy:', err));
            return { ...currentUser, energy: newEnergy };
          }
        }
        return currentUser;
      });
    }, 60000);

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [supabase]);

  const decrementEnergy = (cost: number = 1) => {
    if (!user || user.energy < cost) return;
    const newEnergy = user.energy - cost;
    setUser({ ...user, energy: newEnergy });
    supabase
      .from('users')
      .update({ energy: newEnergy })
      .eq('id', user.id)
      .catch((err) => console.error('Failed to decrement energy:', err));
  };

  const addEnergy = (amount: number) => {
    if (!user) return;
    const newEnergy = user.energy + amount;
    setUser({ ...user, energy: newEnergy });
    supabase
      .from('users')
      .update({ energy: newEnergy })
      .eq('id', user.id)
      .catch((err) => console.error('Failed to add energy:', err));
  };

  const addCoins = (amount: number) => {
    if (!user) return;
    const newCoins = (user.coins || 0) + amount;
    setUser({ ...user, coins: newCoins });
    supabase
      .from('users')
      .update({ coins: newCoins })
      .eq('id', user.id)
      .catch((err) => console.error('Failed to add coins:', err));
  };

  const subtractCoins = (amount: number) => {
    if (!user) return;
    const currentCoins = user.coins || 0;
    if (currentCoins < amount) return;
    const newCoins = currentCoins - amount;
    setUser({ ...user, coins: newCoins });
    supabase
      .from('users')
      .update({ coins: newCoins })
      .eq('id', user.id)
      .catch((err) => console.error('Failed to subtract coins:', err));
  };

  const addDominionPoints = (amount: number) => {
    if (!user) return;
    const newPoints = (user.dominion_points || 0) + amount;
    setUser({ ...user, dominion_points: newPoints });
    supabase
      .from('users')
      .update({ dominion_points: newPoints })
      .eq('id', user.id)
      .catch((err) => console.error('Failed to add dominion points:', err));
  };

  const completeSessionForToday = () => {
    if (!user) return;
    const today = new Date();
    const lastSessionDate =
      user.last_session_completed_at ? new Date(user.last_session_completed_at) : null;
    let newStreak = user.current_streak || 0;
    let weeklyActivity = user.weekly_activity
      ? [...user.weekly_activity]
      : Array(7).fill(false);
    const todayIndex = (today.getDay() + 6) % 7; // Monday = 0

    if (lastSessionDate) {
      if (!isSameDay(today, lastSessionDate)) {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (isSameDay(yesterday, lastSessionDate)) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    } else {
      newStreak = 1;
    }

    // reset weekly activity if new week
    if (lastSessionDate && today.getDay() < lastSessionDate.getDay()) {
      weeklyActivity = Array(7).fill(false);
    }

    weeklyActivity[todayIndex] = true;

    const updatedUser: User = {
      ...user,
      current_streak: newStreak,
      last_session_completed_at: today.toISOString(),
      weekly_activity: weeklyActivity,
    };
    setUser(updatedUser);
    supabase
      .from('users')
      .update({
        current_streak: newStreak,
        last_session_completed_at: updatedUser.last_session_completed_at,
        weekly_activity: weeklyActivity,
      })
      .eq('id', user.id)
      .catch((err) => console.error('Failed to complete session:', err));
  };

  const value: UserContextType = {
    user,
    isLoading,
    setUser,
    decrementEnergy,
    addEnergy,
    addCoins,
    subtractCoins,
    addDominionPoints,
    completeSessionForToday,
    tutorSession,
    setTutorSession,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useUserContext(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

export function useUser(): UserContextType {
  return useUserContext();
}
