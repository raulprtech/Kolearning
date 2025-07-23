

'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, TutorSession } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
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

// Mock data fetching function
async function getUserData(uid: string): Promise<User | null> {
    const mockTimestamp = {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;

    return {
        uid: 'mock-user-id',
        email: 'test@example.com',
        createdAt: mockTimestamp,
        lastSessionAt: mockTimestamp,
        currentStreak: 5,
        coins: 142,
        energy: 10,
        dominionPoints: 40,
        rank: 'G',
        lastSessionCompletedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
        weeklyActivity: [true, true, false, false, true, true, false],
    };
}

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};


export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tutorSession, setTutorSession] = useState<TutorSession | null>(null);

  useEffect(() => {
    // In a real app, you'd get the UID from the session.
    const uid = 'mock-user-id'; 
    getUserData(uid).then(setUser);

    const energyRecoveryInterval = setInterval(() => {
        setUser(currentUser => {
            if (!currentUser || currentUser.energy >= 10) {
                return currentUser;
            }

            const now = new Date().getTime();
            const lastRecoveryString = localStorage.getItem('lastEnergyRecoveryTimestamp');
            const lastRecovery = lastRecoveryString ? parseInt(lastRecoveryString, 10) : now;
            
            const hoursPassed = (now - lastRecovery) / (1000 * 60 * 60);

            if (hoursPassed >= 2) {
                const energyToRecover = Math.floor(hoursPassed / 2);
                const newEnergy = Math.min(10, currentUser.energy + energyToRecover);

                if (newEnergy > currentUser.energy) {
                    localStorage.setItem('lastEnergyRecoveryTimestamp', now.toString());
                    return { ...currentUser, energy: newEnergy };
                }
            }
            
            return currentUser;
        });
    }, 60000); // Check every minute

    return () => clearInterval(energyRecoveryInterval);

  }, []);

  const decrementEnergy = (cost: number = 1) => {
    setUser(currentUser => {
      if (currentUser && currentUser.energy >= cost) {
        return { ...currentUser, energy: currentUser.energy - cost };
      }
      return currentUser;
    });
  };

  const addEnergy = (amount: number) => {
    setUser(currentUser => {
        if (currentUser) {
            return { ...currentUser, energy: currentUser.energy + amount };
        }
        return currentUser;
    });
  };

  const addCoins = (amount: number) => {
    setUser(currentUser => {
        if (currentUser) {
            return { ...currentUser, coins: currentUser.coins + amount };
        }
        return currentUser;
    });
  };

  const subtractCoins = (amount: number) => {
      setUser(currentUser => {
          if (currentUser && currentUser.coins >= amount) {
              return { ...currentUser, coins: currentUser.coins - amount };
          }
          return currentUser;
      });
  };

  const addDominionPoints = (amount: number) => {
    setUser(currentUser => {
        if (currentUser) {
            return { ...currentUser, dominionPoints: (currentUser.dominionPoints || 0) + amount };
        }
        return currentUser;
    });
  };

  const completeSessionForToday = () => {
    setUser(currentUser => {
        if (!currentUser) return null;

        const today = new Date();
        const lastSessionDate = currentUser.lastSessionCompletedAt ? new Date(currentUser.lastSessionCompletedAt) : null;
        
        let newStreak = currentUser.currentStreak;
        let newWeeklyActivity = [...(currentUser.weeklyActivity || Array(7).fill(false))];

        const todayIndex = (today.getDay() + 6) % 7; // Monday is 0, Sunday is 6
        newWeeklyActivity[todayIndex] = true;

        if (lastSessionDate) {
            if (isSameDay(today, lastSessionDate)) {
                // Same day, do nothing to streak
            } else {
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);

                if (isSameDay(yesterday, lastSessionDate)) {
                    // Consecutive days, increase streak
                    newStreak += 1;
                } else {
                    // Gap in days, reset streak to 1
                    newStreak = 1;
                }
            }
        } else {
            // First session ever
            newStreak = 1;
        }

        // Shift weekly activity if a new week starts
        if (lastSessionDate && today.getDay() < lastSessionDate.getDay()) {
            newWeeklyActivity = Array(7).fill(false);
            newWeeklyActivity[todayIndex] = true;
        }

        return {
            ...currentUser,
            currentStreak: newStreak,
            lastSessionCompletedAt: today.toISOString(),
            weeklyActivity: newWeeklyActivity,
        };
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, decrementEnergy, addEnergy, addCoins, subtractCoins, addDominionPoints, completeSessionForToday, tutorSession, setTutorSession }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
