"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUserConector } from '../core/ports/inbound/IConectorService';
import { ConectorMetadata } from '../core/domain/models/conector';
import { ConectorService } from '../infrastructure/services/ConectorService';
import { useAuth } from './AuthContext';
import { initializeConectores } from '../infrastructure/connectors';

// Server-only connector IDs — these must NOT be initialized client-side.
// They are initialized via the /api/connectors/initialize API route.
const SERVER_ONLY_CONNECTORS = ['whatsapp_sync', 'telegram_sync', 'persona_socrates', 'google_tasks_sync'];

interface ConectorContextType {
    availableConectores: ConectorMetadata[];
    userConectores: IUserConector[];
    isLoading: boolean;
    toggleConector: (conectorId: string, enabled: boolean) => Promise<void>;
    isConectorEnabled: (conectorId: string) => boolean;
}

const ConectorContext = createContext<ConectorContextType | undefined>(undefined);

/**
 * Calls the server API to initialize/disable server-only connectors.
 */
async function toggleServerConnector(conectorIds: string[], enabled: boolean) {
    if (conectorIds.length === 0) return;
    
    try {
        await fetch('/api/connectors/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conectorIds,
                action: enabled ? 'enable' : 'disable'
            })
        });
    } catch (error) {
        console.error(`[ConectorContext] Failed to ${enabled ? 'enable' : 'disable'} server connectors [${conectorIds.join(', ')}]:`, error);
    }
}

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

                    const activeIds = enabled.filter(p => p.isEnabled).map(p => p.conectorId);

                    // Split into client-safe and server-only
                    const clientIds = activeIds.filter(id => !SERVER_ONLY_CONNECTORS.includes(id));
                    const serverIds = activeIds.filter(id => SERVER_ONLY_CONNECTORS.includes(id));

                    // Initialize client-safe connectors directly
                    if (clientIds.length > 0) {
                        initializeConectores(clientIds);
                    }

                    // Initialize server-only connectors via API
                    if (serverIds.length > 0) {
                        toggleServerConnector(serverIds, true);
                    }
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

        if (SERVER_ONLY_CONNECTORS.includes(conectorId)) {
            // Delegate to the server API
            await toggleServerConnector([conectorId], enabled);
        } else {
            // Handle client-safe connectors directly
            if (enabled) {
                initializeConectores([conectorId]);
            } else {
                // For client connectors, we'd need a client-side unregister
                // ConectorManager is safe to import since it doesn't use Node APIs
                const { ConectorManager } = await import('../infrastructure/services/ConectorManager');
                ConectorManager.unregisterConector(conectorId);
            }
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
