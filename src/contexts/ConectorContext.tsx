"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConectorMetadata, IUserConector } from '../core/ports/inbound/IConectorService';
import { ConectorService } from '../infrastructure/services/ConectorService';
import { useAuth } from './AuthContext';
import { initializeConectores } from '../infrastructure/connectors';
import { ConectorManager } from '../infrastructure/services/ConectorManager';

interface ConectorContextType {
    availableConectores: ConectorMetadata[];
    userConectores: IUserConector[];
    isLoading: boolean;
    toggleConector: (conectorId: string, enabled: boolean) => Promise<void>;
    isConectorEnabled: (conectorId: string) => boolean;
}

const ConectorContext = createContext<ConectorContextType | undefined>(undefined);

export const ConectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [availableConectores, setAvailableConectores] = useState<ConectorMetadata[]>([]);
    const [userConectores, setUserConectores] = useState<IUserConector[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const conectorService = new ConectorService();

    useEffect(() => {
        const loadConectores = async () => {
            try {
                const available = await conectorService.getAvailableConectores();
                setAvailableConectores(available);

                if (user) {
                    const enabled = await conectorService.getUserConectores(user.id);
                    setUserConectores(enabled);

                    // Bootstrap conectores based on enabled preferences
                    const activeIds = enabled.filter(p => p.isEnabled).map(p => p.conectorId);
                    initializeConectores(activeIds);
                }
            } catch (error) {
                console.error("Error loading conectores:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadConectores();
    }, [user]);

    const toggleConector = async (conectorId: string, enabled: boolean) => {
        if (!user) return;

        await conectorService.toggleConector(user.id, conectorId, enabled);

        if (enabled) {
            initializeConectores([conectorId]);
        } else {
            ConectorManager.unregisterConector(conectorId);
        }

        // Update local state
        setUserConectores(prev => {
            const existing = prev.find(p => p.conectorId === conectorId);
            if (existing) {
                return prev.map(p => p.conectorId === conectorId ? { ...p, isEnabled: enabled } : p);
            } else {
                return [...prev, { conectorId, isEnabled: enabled, settings: {} }];
            }
        });
    };

    const isConectorEnabled = (conectorId: string) => {
        return userConectores.find(p => p.conectorId === conectorId)?.isEnabled || false;
    };

    return (
        <ConectorContext.Provider value={{ availableConectores, userConectores, isLoading, toggleConector, isConectorEnabled }}>
            {children}
        </ConectorContext.Provider>
    );

};

export const useConectores = () => {
    const context = useContext(ConectorContext);
    if (context === undefined) {
        throw new Error('useConectores must be used within a ConectorProvider');
    }
    return context;
};
