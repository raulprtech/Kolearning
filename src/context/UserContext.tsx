
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, TutorSession } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  decrementEnergy: (cost?: number) => void;
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
    };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tutorSession, setTutorSession] = useState<TutorSession | null>(null);

  useEffect(() => {
    // In a real app, you'd get the UID from the session.
    const uid = 'mock-user-id'; 
    getUserData(uid).then(setUser);
  }, []);

  const decrementEnergy = (cost: number = 1) => {
    setUser(currentUser => {
      if (currentUser && currentUser.energy >= cost) {
        return { ...currentUser, energy: currentUser.energy - cost };
      }
      return currentUser;
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, decrementEnergy, tutorSession, setTutorSession }}>
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
