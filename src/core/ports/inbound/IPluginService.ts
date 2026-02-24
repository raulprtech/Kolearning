export interface PluginMetadata {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'Integrations' | 'Learning' | 'Tools' | 'Personalities';
}

export interface IUserPlugin {
    pluginId: string;
    isEnabled: boolean;
    settings: Record<string, any>;
}

export interface IPluginService {
    /**
     * Returns a list of all available plugins in the system
     */
    getAvailablePlugins(): Promise<PluginMetadata[]>;

    /**
     * Returns the plugins enabled/configured by a specific user
     */
    getUserPlugins(userId: string): Promise<IUserPlugin[]>;

    /**
     * Enables or disables a plugin for a user
     */
    togglePlugin(userId: string, pluginId: string, enabled: boolean): Promise<void>;

    /**
     * Updates settings for a specific plugin
     */
    updatePluginSettings(userId: string, pluginId: string, settings: Record<string, any>): Promise<void>;
}
