import { ConectorManager } from '../services/ConectorManager';
import { TelegramConector } from './TelegramConector';
import { SocratesConector } from './SocratesConector';
import { WebNotificationConector } from './WebNotificationConector';
import { GoogleTasksConector } from './GoogleTasksConector';
// NOTE: WhatsAppConector is NOT imported here because it depends on
// Node-only modules (baileys, sharp, fs, child_process, node:crypto).
// It must only be initialized server-side via API routes.
// See: src/infrastructure/connectors/index.server.ts

/**
 * initializeConectores: Bootstraps the active conectores based on user preferences.
 * Only initializes CLIENT-SAFE connectors. Server-only connectors (WhatsApp)
 * must be initialized via the /api/connectors/initialize API route.
 */
export const initializeConectores = (enabledConectorIds: string[]) => {
    console.log('[Conectores] Initializing client-safe conectores...', enabledConectorIds);

    if (enabledConectorIds.includes('telegram_sync')) {
        const telegram = new TelegramConector('MOCK_TOKEN');
        ConectorManager.registerConector(telegram);
    }

    if (enabledConectorIds.includes('persona_socrates')) {
        const socrates = new SocratesConector();
        ConectorManager.registerConector(socrates);
    }

    if (enabledConectorIds.includes('web_notifications')) {
        const webNotify = new WebNotificationConector();
        ConectorManager.registerConector(webNotify);
    }

    if (enabledConectorIds.includes('google_tasks_sync')) {
        const googleTasks = new GoogleTasksConector();
        ConectorManager.registerConector(googleTasks);
    }

    // WhatsApp is skipped here — it's server-only.
    // If 'whatsapp_sync' is in the list, log a reminder.
    if (enabledConectorIds.includes('whatsapp_sync')) {
        console.log('[Conectores] WhatsApp is server-only. Use /api/connectors/initialize to start it.');
    }
};
