import { ConectorManager } from '../services/ConectorManager';
import { SocratesConector } from './SocratesConector';
import { WebNotificationConector } from './WebNotificationConector';
import { SandboxConectorProxy } from '../../core/sandbox/SandboxProxy';
import path from 'path';

/**
 * initializeConectores: Bootstraps the active conectores based on user preferences.
 * Now using SandboxConectorProxy for isolated execution where possible.
 */
export const initializeConectores = (enabledConectorIds: string[]) => {
    console.log('[Conectores] Initializing conectores (with Sandboxing support)...', enabledConectorIds);

    if (enabledConectorIds.includes('telegram_sync')) {
        const telegramProxy = new SandboxConectorProxy({
            id: 'telegram_sync',
            name: 'Telegram Sync',
            description: 'Aislado en Sandbox para mayor seguridad.',
            icon: 'MessageSquareShare',
            category: 'Conectores de Canal'
        }, path.resolve('src/infrastructure/connectors/sandboxed/TelegramWorker.ts'));
        ConectorManager.registerConector(telegramProxy);
    }

    if (enabledConectorIds.includes('persona_socrates')) {
        const socratesProxy = new SandboxConectorProxy({
            id: 'persona_socrates',
            name: 'Sócrates',
            description: 'Tutor filosófico aislado en Sandbox.',
            icon: 'Brain',
            category: 'Módulos de Estudio Alternativos'
        }, path.resolve('src/infrastructure/connectors/sandboxed/SocratesWorker.ts'));
        ConectorManager.registerConector(socratesProxy);
    }

    if (enabledConectorIds.includes('web_notifications')) {
        const webNotify = new WebNotificationConector();
        ConectorManager.registerConector(webNotify);
    }

    if (enabledConectorIds.includes('google_tasks_sync')) {
        const googleProxy = new SandboxConectorProxy({
            id: 'google_tasks_sync',
            name: 'Google Tasks Sync',
            description: 'Sincronización aislada de tareas.',
            icon: 'CheckSquare',
            category: 'Conectores de Exportación'
        }, path.resolve('src/infrastructure/connectors/sandboxed/GoogleTasksWorker.ts'));
        ConectorManager.registerConector(googleProxy);
    }

    if (enabledConectorIds.includes('semantic_scholar')) {
        const ss = new (require('./SemanticScholarConector').SemanticScholarConector)();
        ConectorManager.registerConector(ss);
    }

    // WhatsApp is skipped here — it's server-only.
    // If 'whatsapp_sync' is in the list, log a reminder.
    if (enabledConectorIds.includes('whatsapp_sync')) {
        console.log('[Conectores] WhatsApp is server-only. Use /api/connectors/initialize to start it.');
    }
};
