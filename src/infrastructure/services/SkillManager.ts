import { ISkill } from '../../core/domain/models/skill';

export class SkillManager {
    private static registeredSkills: Map<string, ISkill> = new Map();

    /**
     * Registers a skill in the manager and executes its register() method.
     */
    static registerSkill(skill: ISkill) {
        if (this.registeredSkills.has(skill.metadata.id)) {
            console.warn(`[SkillManager] Skill ${skill.metadata.id} is already registered.`);
            return;
        }

        try {
            skill.register();
            this.registeredSkills.set(skill.metadata.id, skill);
            console.log(`[SkillManager] Skill registered and activated: ${skill.metadata.name} (${skill.metadata.id})`);
        } catch (error) {
            console.error(`[SkillManager] Error activating skill ${skill.metadata.id}:`, error);
        }
    }

    static getActiveSkills(): ISkill[] {
        return Array.from(this.registeredSkills.values());
    }

    static isSkillActive(skillId: string): boolean {
        return this.registeredSkills.has(skillId);
    }
}
