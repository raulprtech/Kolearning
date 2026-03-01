import { IConectorService, ConectorMetadata, IUserConector } from '../../core/ports/inbound/IConectorService';

// Simulation of local storage for MVP
let mockUserConectores: IUserConector[] = [
    { conectorId: 'telegram_sync', isEnabled: false, settings: {} },
    { conectorId: 'persona_socrates', isEnabled: false, settings: {} }
];

export class ConectorService implements IConectorService {
    async getAvailableConectores(): Promise<ConectorMetadata[]> {
        return [
            {
                id: 'web_notifications',
                name: 'Notificaciones Web',
                description: 'Recibe alertas directamente en tu navegador cuando Kolearning complete una tarea.',
                icon: 'Bell',
                category: 'Integrations'
            },
            {
                id: 'google_tasks_sync',
                name: 'Google Tasks Sync',
                description: 'Sincroniza los resúmenes y planes de Kolearning con tus listas de tareas de Google.',
                icon: 'CheckSquare',
                category: 'Integrations'
            },
            {
                id: 'whatsapp_sync',
                name: 'WhatsApp (Beta)',
                description: 'Envía los resultados de tus tareas directamente a tu WhatsApp.',
                icon: 'MessageCircle',
                category: 'Integrations'
            },
            {
                id: 'telegram_sync',
                name: 'Telegram Sync',
                description: 'Recibe repasos y chatea con Kolearning directamente desde Telegram.',
                icon: 'Send',
                category: 'Integrations'
            },
            {
                id: 'persona_socrates',
                name: 'Sócrates (AI Persona)',
                description: 'Transforma a Kolearning en un tutor filosófico que usa el método socrático.',
                icon: 'Brain',
                category: 'Personalities'
            }
        ];
    }

    async getUserConectores(userId: string): Promise<IUserConector[]> {
        return mockUserConectores;
    }

    async toggleConector(userId: string, conectorId: string, enabled: boolean): Promise<void> {
        const conector = mockUserConectores.find(p => p.conectorId === conectorId);
        if (conector) {
            conector.isEnabled = enabled;
        } else {
            mockUserConectores.push({ conectorId, isEnabled: enabled, settings: {} });
        }
        console.log(`[ConectorService] Conector ${conectorId} ${enabled ? 'activado' : 'desactivado'} para el usuario ${userId}`);
        return Promise.resolve();
    }

    async updateConectorSettings(userId: string, conectorId: string, settings: Record<string, any>): Promise<void> {
        const conector = mockUserConectores.find(p => p.conectorId === conectorId);
        if (conector) {
            conector.settings = { ...conector.settings, ...settings };
        }
        return Promise.resolve();
    }
}
