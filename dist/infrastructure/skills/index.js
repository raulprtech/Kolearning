import { SkillManager } from '../services/SkillManager';
import { TelegramSkill } from './TelegramSkill';
import { SocratesSkill } from './SocratesSkill';
import { WebNotificationSkill } from './WebNotificationSkill';
import { GoogleTasksSkill } from './GoogleTasksSkill';
import { WhatsAppSkill } from './WhatsAppSkill';
/**
 * initializeSkills: Bootstraps the active skills based on user preferences.
 */
export const initializeSkills = (enabledPluginIds) => {
    console.log('[Skills] Initializing skills...', enabledPluginIds);
    if (enabledPluginIds.includes('telegram_sync')) {
        const telegram = new TelegramSkill('MOCK_TOKEN');
        SkillManager.registerSkill(telegram);
    }
    if (enabledPluginIds.includes('persona_socrates')) {
        const socrates = new SocratesSkill();
        SkillManager.registerSkill(socrates);
    }
    if (enabledPluginIds.includes('web_notifications')) {
        const webNotify = new WebNotificationSkill();
        SkillManager.registerSkill(webNotify);
    }
    if (enabledPluginIds.includes('google_tasks_sync')) {
        const googleTasks = new GoogleTasksSkill();
        SkillManager.registerSkill(googleTasks);
    }
    if (enabledPluginIds.includes('whatsapp_sync')) {
        const whatsapp = new WhatsAppSkill();
        SkillManager.registerSkill(whatsapp);
    }
};
