import { SkillManager } from '../services/SkillManager';
import { TelegramSkill } from './TelegramSkill';
import { SocratesSkill } from './SocratesSkill';

/**
 * initializeSkills: Bootstraps the active skills based on user preferences.
 */
export const initializeSkills = (enabledPluginIds: string[]) => {
    console.log('[Skills] Initializing skills...', enabledPluginIds);

    if (enabledPluginIds.includes('telegram_messaging') || enabledPluginIds.includes('telegram_sync')) {
        const telegram = new TelegramSkill('MOCK_TOKEN');
        SkillManager.registerSkill(telegram);
    }

    if (enabledPluginIds.includes('persona_socrates')) {
        const socrates = new SocratesSkill();
        SkillManager.registerSkill(socrates);
    }
};
