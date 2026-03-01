export class ConectorManager {
    /**
     * Registers a conector in the manager and executes its register() method.
     */
    static registerConector(conector) {
        if (this.registeredConectores.has(conector.metadata.id)) {
            console.warn(`[ConectorManager] Conector ${conector.metadata.id} is already registered.`);
            return;
        }
        try {
            conector.register();
            this.registeredConectores.set(conector.metadata.id, conector);
            console.log(`[ConectorManager] Conector registered and activated: ${conector.metadata.name} (${conector.metadata.id})`);
        }
        catch (error) {
            console.error(`[ConectorManager] Error activating conector ${conector.metadata.id}:`, error);
        }
    }
    static getActiveConectores() {
        return Array.from(this.registeredConectores.values());
    }
    static isConectorActive(conectorId) {
        return this.registeredConectores.has(conectorId);
    }
}
ConectorManager.registeredConectores = new Map();
