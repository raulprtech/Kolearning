/**
 * DataRegistry: Centralizes data providers registered by connectors.
 */
export class DataRegistry {
    static registerProvider(conectorId, provider) {
        this.providers.set(conectorId, provider);
        console.log(`[DataRegistry] Provider registrado para: ${conectorId}`);
    }
    static unregisterProvider(conectorId) {
        this.providers.delete(conectorId);
    }
    static getProvider(conectorId) {
        return this.providers.get(conectorId);
    }
    static getAllProviders() {
        return Array.from(this.providers.entries());
    }
}
DataRegistry.providers = new Map();
