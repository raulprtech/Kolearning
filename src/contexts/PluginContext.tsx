"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PluginMetadata, IUserPlugin } from '../core/ports/inbound/IPluginService';
import { PluginService } from '../infrastructure/services/PluginService';
import { useAuth } from './AuthContext';
import { initializeSkills } from '../infrastructure/skills';

interface PluginContextType {
    availablePlugins: PluginMetadata[];
    userPlugins: IUserPlugin[];
    isLoading: boolean;
    togglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;
    isPluginEnabled: (pluginId: string) => boolean;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const PluginProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [availablePlugins, setAvailablePlugins] = useState<PluginMetadata[]>([]);
    const [userPlugins, setUserPlugins] = useState<IUserPlugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const pluginService = new PluginService();

    useEffect(() => {
        const loadPlugins = async () => {
            try {
                const available = await pluginService.getAvailablePlugins();
                setAvailablePlugins(available);

                if (user) {
                    const enabled = await pluginService.getUserPlugins(user.id);
                    setUserPlugins(enabled);

                    // Boostrap skills based on enabled plugins
                    const activeIds = enabled.filter(p => p.isEnabled).map(p => p.pluginId);
                    initializeSkills(activeIds);
                }
            } catch (error) {
                console.error("Error loading plugins:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPlugins();
    }, [user]);

    const togglePlugin = async (pluginId: string, enabled: boolean) => {
        if (!user) return;

        await pluginService.togglePlugin(user.id, pluginId, enabled);

        // Update local state
        setUserPlugins(prev => {
            const existing = prev.find(p => p.pluginId === pluginId);
            if (existing) {
                return prev.map(p => p.pluginId === pluginId ? { ...p, isEnabled: enabled } : p);
            } else {
                return [...prev, { pluginId, isEnabled: enabled, settings: {} }];
            }
        });
    };

    const isPluginEnabled = (pluginId: string) => {
        return userPlugins.find(p => p.pluginId === pluginId)?.isEnabled || false;
    };

    return (
        <PluginContext.Provider value={{ availablePlugins, userPlugins, isLoading, togglePlugin, isPluginEnabled }}>
            {children}
        </PluginContext.Provider>
    );
};

export const usePlugins = () => {
    const context = useContext(PluginContext);
    if (context === undefined) {
        throw new Error('usePlugins must be used within a PluginProvider');
    }
    return context;
};
