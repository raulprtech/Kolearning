import { IConector, ConectorMetadata } from '../domain/models/conector';

/**
 * ConectorSDK: A base class or utility set for external connectors.
 * In a real-world scenario, this would be its own NPM package.
 */
export abstract class BaseConector implements IConector {
    abstract metadata: ConectorMetadata;
    
    /**
     * register: Standard hook registration.
     */
    abstract register(): void;

    /**
     * unregister: Standard cleanup.
     */
    unregister?(): void {
        console.log(`[SDK] Unregistering conector: ${this.metadata.id}`);
    }

    /**
     * Helper to log with conector context
     */
    protected log(message: string, ...args: any[]) {
        console.log(`[Conector:${this.metadata.id}] ${message}`, ...args);
    }
}

// Explicit re-exports to avoid naming collisions
export type { IConector, ConectorMetadata } from '../domain/models/conector';
export type { IConectorService, IUserConector } from '../ports/inbound/IConectorService';
export { DataRegistry } from '../domain/services/DataRegistry';
export type { IDataProvider } from '../domain/services/DataRegistry';
export { HookRegistry } from '../domain/services/HookRegistry';
export { UISlotRegistry } from '../domain/services/UISlotRegistry';
export type { UISlotItem } from '../domain/services/UISlotRegistry';
