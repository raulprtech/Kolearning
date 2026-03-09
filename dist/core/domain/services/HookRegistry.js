/**
 * HookRegistry: A centralized event and data modification system.
 * Inspired by WordPress Hooks (Actions and Filters).
 */
export class HookRegistry {
    static get actions() {
        if (!globalThis.hookRegistryActions) {
            globalThis.hookRegistryActions = new Map();
        }
        return globalThis.hookRegistryActions;
    }
    static get filters() {
        if (!globalThis.hookRegistryFilters) {
            globalThis.hookRegistryFilters = new Map();
        }
        return globalThis.hookRegistryFilters;
    }
    /**
     * Action: Register a function to be executed when a specific event occurs.
     * Actions DO NOT return values to the caller.
     */
    static addAction(tag, handler) {
        if (!this.actions.has(tag)) {
            this.actions.set(tag, []);
        }
        const handlers = this.actions.get(tag);
        // Evitar duplicados (comparación básica de referencia)
        if (!handlers.includes(handler)) {
            handlers.push(handler);
            console.log(`[HookRegistry] Action registered for tag: ${tag} (${handlers.length} total)`);
        }
    }
    /**
     * Trigger an action. All registered handlers for this tag will execute.
     */
    static doAction(tag, ...args) {
        const handlers = this.actions.get(tag);
        if (handlers && handlers.length > 0) {
            console.log(`[HookRegistry] Executing actions for tag: ${tag} (${handlers.length} handlers)`);
            handlers.forEach(handler => {
                try {
                    handler(...args);
                }
                catch (error) {
                    console.error(`[HookRegistry] Error in action handler for ${tag}:`, error);
                }
            });
        }
    }
    /**
     * Filter: Register a function to modify a value.
     * Filters MUST return a value.
     */
    static addFilter(tag, handler) {
        if (!this.filters.has(tag)) {
            this.filters.set(tag, []);
        }
        const handlers = this.filters.get(tag);
        if (!handlers.includes(handler)) {
            handlers.push(handler);
            console.log(`[HookRegistry] Filter registered for tag: ${tag} (${handlers.length} total)`);
        }
    }
    /**
     * Apply filters to a value. The value passes through each handler sequentially.
     */
    static applyFilters(tag, value, ...args) {
        const handlers = this.filters.get(tag);
        if (!handlers)
            return value;
        console.log(`[HookRegistry] Applying filters for tag: ${tag} (${handlers.length} handlers)`);
        return handlers.reduce((acc, handler) => {
            try {
                const result = handler(acc, ...args);
                return result !== undefined ? result : acc;
            }
            catch (error) {
                console.error(`[HookRegistry] Error in filter handler for ${tag}:`, error);
                return acc;
            }
        }, value);
    }
}
