/**
 * ConectorSDK: A base class or utility set for external connectors.
 * In a real-world scenario, this would be its own NPM package.
 */
export class BaseConector {
    /**
     * unregister: Standard cleanup.
     */
    unregister() {
        console.log(`[SDK] Unregistering conector: ${this.metadata.id}`);
    }
    /**
     * Helper to log with conector context
     */
    log(message, ...args) {
        console.log(`[Conector:${this.metadata.id}] ${message}`, ...args);
    }
}
export { DataRegistry } from '../domain/services/DataRegistry';
export { HookRegistry } from '../domain/services/HookRegistry';
export { UISlotRegistry } from '../domain/services/UISlotRegistry';
