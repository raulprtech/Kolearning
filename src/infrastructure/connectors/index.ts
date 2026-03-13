import { ConectorManager } from '../services/ConectorManager';
import { WebNotificationConector } from './WebNotificationConector';

/**
 * initializeConectores: Bootstraps the active conectores based on user preferences.
 * Now using SandboxConectorProxy for isolated execution where possible.
 */
export const initializeConectores = (enabledConectorIds: string[]) => {
    console.log('[Conectores] Initializing conectores (with Sandboxing support)...', enabledConectorIds);

    // telegram_sync and persona_socrates are server-only due to Sandbox Worker Node APIs
    if (enabledConectorIds.includes('telegram_sync') || enabledConectorIds.includes('persona_socrates')) {
        console.log('[Conectores] Some conectores are server-only. Use /api/connectors/initialize to start them.');
    }

    if (enabledConectorIds.includes('web_notifications')) {
        const webNotify = new WebNotificationConector();
        ConectorManager.registerConector(webNotify);
    }

    // google_tasks_sync is also server-only
    if (enabledConectorIds.includes('google_tasks_sync')) {
        console.log('[Conectores] google_tasks_sync is server-only.');
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
