export class SkillManager {
    /**
     * Registers a skill in the manager and executes its register() method.
     */
    static registerSkill(skill) {
        if (this.registeredSkills.has(skill.metadata.id)) {
            console.warn(`[SkillManager] Skill ${skill.metadata.id} is already registered.`);
            return;
        }
        try {
            skill.register();
            this.registeredSkills.set(skill.metadata.id, skill);
            console.log(`[SkillManager] Skill registered and activated: ${skill.metadata.name} (${skill.metadata.id})`);
        }
        catch (error) {
            console.error(`[SkillManager] Error activating skill ${skill.metadata.id}:`, error);
        }
    }
    static getActiveSkills() {
        return Array.from(this.registeredSkills.values());
    }
    static isSkillActive(skillId) {
        return this.registeredSkills.has(skillId);
    }
}
SkillManager.registeredSkills = new Map();
