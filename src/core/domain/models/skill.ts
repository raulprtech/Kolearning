export interface SkillMetadata {
    id: string;
    name: string;
    description: string;
    author?: string;
    version?: string;
    icon?: string;
}

/**
 * ISkill: The interface that every plugin or "skill" must implement.
 */
export interface ISkill {
    metadata: SkillMetadata;

    /**
     * register: Called when the skill is enabled.
     * This is where the skill should register its hooks in the HookRegistry.
     */
    register(): void;

    /**
     * unregister: Cleanup when the skill is disabled or removed.
     */
    unregister?(): void;
}
