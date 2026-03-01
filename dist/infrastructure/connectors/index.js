import { ConectorManager } from '../services/ConectorManager';
import { TelegramConector } from './TelegramConector';
import { SocratesConector } from './SocratesConector';
import { WebNotificationConector } from './WebNotificationConector';
import { GoogleTasksConector } from './GoogleTasksConector';
import { WhatsAppConector } from './WhatsAppConector';
/**
 * initializeConectores: Bootstraps the active conectores based on user preferences.
 */
export const initializeConectores = (enabledConectorIds) => {
    console.log('[Conectores] Initializing conectores...', enabledConectorIds);
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
    if (enabledConectorIds.includes('whatsapp_sync')) {
        const whatsapp = new WhatsAppConector();
        ConectorManager.registerConector(whatsapp);
    }
};
