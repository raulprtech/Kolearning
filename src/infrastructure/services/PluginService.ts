import { IPluginService, PluginMetadata, IUserPlugin } from '../../core/ports/inbound/IPluginService';

// Simulación de almacenamiento local para el MVP
let mockUserPlugins: IUserPlugin[] = [
    { pluginId: 'telegram_messaging', isEnabled: false, settings: {} },
    { pluginId: 'persona_socrates', isEnabled: false, settings: {} }
];

export class PluginService implements IPluginService {
    async getAvailablePlugins(): Promise<PluginMetadata[]> {
        return [
            {
                id: 'telegram_messaging',
                name: 'Telegram Sync',
                description: 'Recibe repasos y chatea con Koli directamente desde Telegram.',
                icon: 'MessageSquareShare',
                category: 'Integrations'
            },
            {
                id: 'persona_socrates',
                name: 'Sócrates (AI Persona)',
                description: 'Transforma a Koli en un tutor filosófico que usa el método socrático.',
                icon: 'Brain',
                category: 'Personalities'
            }
        ];
    }

    async getUserPlugins(userId: string): Promise<IUserPlugin[]> {
        // En una implementación real, esto consultaría la tabla 'user_plugins' en Supabase
        return mockUserPlugins;
    }

    async togglePlugin(userId: string, pluginId: string, enabled: boolean): Promise<void> {
        const plugin = mockUserPlugins.find(p => p.pluginId === pluginId);
        if (plugin) {
            plugin.isEnabled = enabled;
        } else {
            mockUserPlugins.push({ pluginId, isEnabled: enabled, settings: {} });
        }
        console.log(`[PluginService] Plugin ${pluginId} ${enabled ? 'activado' : 'desactivado'} para el usuario ${userId}`);
        return Promise.resolve();
    }

    async updatePluginSettings(userId: string, pluginId: string, settings: Record<string, any>): Promise<void> {
        const plugin = mockUserPlugins.find(p => p.pluginId === pluginId);
        if (plugin) {
            plugin.settings = { ...plugin.settings, ...settings };
        }
        return Promise.resolve();
    }
}
