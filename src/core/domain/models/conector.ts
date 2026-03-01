export interface ConectorMetadata {
    id: string;
    name: string;
    description: string;
    author?: string;
    version?: string;
    icon?: string;
}

/**
 * IConector: The interface that every "conector" must implement.
 */
export interface IConector {
    metadata: ConectorMetadata;

    /**
     * register: Called when the conector is enabled.
     * This is where the conector should register its hooks in the HookRegistry.
     */
    register(): void;

    /**
     * unregister: Cleanup when the conector is disabled or removed.
     */
    unregister?(): void;
}
