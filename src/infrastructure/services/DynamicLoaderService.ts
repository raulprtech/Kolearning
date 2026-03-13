import { IConector } from '../../core/domain/models/conector';

/**
 * DynamicLoaderService: Responsible for loading connectors from external sources.
 * In Option B, this handles dynamic imports or loading from specialized directories.
 */
export class DynamicLoaderService {
    /**
     * Loads a conector from a module path or URL.
     * @param modulePath The path or URL to the connector's entry point.
     */
    static async loadFromPath(modulePath: string): Promise<IConector> {
        console.log(`[DynamicLoader] Attempting to load conector from: ${modulePath}`);
        
        try {
            // In a real Option B implementation, this might use:
            // 1. Dynamic import() for local files/packages
            // 2. A fetch + eval (or similar) for remote JS if in a sandbox
            // For now, we'll assume it's a dynamic import of a local path.
            
            const module = await import(modulePath);
            
            // Expected export: a class or a factory function
            const ConectorClass = module.default || module.Conector;
            
            if (!ConectorClass) {
                throw new Error(`Module at ${modulePath} does not have a default or 'Conector' export.`);
            }

            const instance = new ConectorClass() as IConector;
            
            if (!instance.metadata || typeof instance.register !== 'function') {
                throw new Error(`Module at ${modulePath} does not implement IConector interface.`);
            }

            return instance;
        } catch (error) {
            console.error(`[DynamicLoader] Failed to load conector from ${modulePath}:`, error);
            throw error;
        }
    }
}
