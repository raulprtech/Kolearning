import { IConectorService, ConectorMetadata, IUserConector } from '../../core/ports/inbound/IConectorService';

declare global {
    var mockUserConectores: IUserConector[] | undefined;
}

// Simulation of local storage for MVP, persisting on server reloads
const getMockStorage = (): IUserConector[] => {
    const defaultConnectors = [
        { conectorId: 'telegram_sync', isEnabled: false, settings: {} },
        { conectorId: 'persona_socrates', isEnabled: false, settings: {} },
        { conectorId: 'semantic_scholar', isEnabled: true, settings: {} },
        { conectorId: 'zotero_sync', isEnabled: true, settings: {} }
    ];

    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('kolearning_connectors');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const result = [...parsed];
                for (const def of defaultConnectors) {
                    if (!result.find((p: any) => p.conectorId === def.conectorId)) {
                        result.push(def);
                    }
                }
                return result;
            } catch (e) {
                console.error('Error parsing saved connectors', e);
            }
        }
        localStorage.setItem('kolearning_connectors', JSON.stringify(defaultConnectors));
        return defaultConnectors;
    }

    if (!globalThis.mockUserConectores) {
        globalThis.mockUserConectores = defaultConnectors;
    } else {
        const result = [...globalThis.mockUserConectores];
        for (const def of defaultConnectors) {
            if (!result.find((p: any) => p.conectorId === def.conectorId)) {
                result.push(def);
            }
        }
        globalThis.mockUserConectores = result;
    }
    return globalThis.mockUserConectores!;
};

const saveMockStorage = (storage: IUserConector[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('kolearning_connectors', JSON.stringify(storage));
    } else {
        globalThis.mockUserConectores = storage;
    }
};

export class ConectorService implements IConectorService {
    async getAvailableConectores(): Promise<ConectorMetadata[]> {
        return [
            {
                id: 'web_notifications',
                name: 'Notificaciones Web',
                description: 'Recibe alertas directamente en tu navegador cuando Kolearning complete una tarea.',
                icon: 'Bell',
                category: 'Conectores de Canal'
            },
            {
                id: 'google_tasks_sync',
                name: 'Google Tasks Sync',
                description: 'Sincroniza los resúmenes y planes de Kolearning con tus listas de tareas de Google.',
                icon: 'CheckSquare',
                category: 'Conectores de Exportación'
            },
            {
                id: 'whatsapp_sync',
                name: 'WhatsApp (Beta)',
                description: 'Envía los resultados de tus tareas directamente a tu WhatsApp.',
                icon: 'MessageCircle',
                category: 'Conectores de Canal'
            },
            {
                id: 'telegram_sync',
                name: 'Telegram Sync',
                description: 'Recibe repasos y chatea con Kolearning directamente desde Telegram.',
                icon: 'Send',
                category: 'Conectores de Canal'
            },
            {
                id: 'persona_socrates',
                name: 'Sócrates (AI Persona)',
                description: 'Transforma a Kolearning en un tutor filosófico que usa el método socrático.',
                icon: 'Brain',
                category: 'Módulos de Estudio Alternativos'
            },
            {
                id: 'semantic_scholar',
                name: 'Semantic Scholar',
                description: 'Busca e importa artículos científicos directamente desde Semantic Scholar.',
                icon: 'Library',
                category: 'Conectores de Datos'
            },
            {
                id: 'zotero_sync',
                name: 'Zotero',
                description: 'Sincroniza y vincula tus colecciones y bibliografía de Zotero.',
                icon: 'BookOpen',
                category: 'Conectores de Datos'
            }
        ];
    }

    async getUserConectores(userId: string): Promise<IUserConector[]> {
        return getMockStorage();
    }

    async toggleConector(userId: string, conectorId: string, enabled: boolean): Promise<void> {
        const storage = getMockStorage();
        const conector = storage.find(p => p.conectorId === conectorId);
        if (conector) {
            conector.isEnabled = enabled;
        } else {
            storage.push({ conectorId, isEnabled: enabled, settings: {} });
        }
        saveMockStorage(storage);
        console.log(`[ConectorService] Conector ${conectorId} ${enabled ? 'activado' : 'desactivado'} para el usuario ${userId}`);
        console.log(`[ConectorService] Storage actual:`, JSON.stringify(storage));
        return Promise.resolve();
    }

    async updateConectorSettings(userId: string, conectorId: string, settings: Record<string, any>): Promise<void> {
        const storage = getMockStorage();
        const conector = storage.find(p => p.conectorId === conectorId);
        if (conector) {
            conector.settings = { ...conector.settings, ...settings };
            saveMockStorage(storage);
        }
        return Promise.resolve();
    }
}
