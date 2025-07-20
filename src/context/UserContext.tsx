
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  decrementEnergy: () => void;
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
        energy: 5,
    };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // In a real app, you'd get the UID from the session.
    const uid = 'mock-user-id'; 
    getUserData(uid).then(setUser);
  }, []);

  const decrementEnergy = () => {
    setUser(currentUser => {
      if (currentUser && currentUser.energy > 0) {
        return { ...currentUser, energy: currentUser.energy - 1 };
      }
      return currentUser;
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, decrementEnergy }}>
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
