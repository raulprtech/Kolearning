export class ConectorManager {
    // Usar un Map global para persistir entre recargas en modo desarrollo
    static get registeredConectores() {
        if (!globalThis.conectorManager) {
            globalThis.conectorManager = new Map();
        }
        return globalThis.conectorManager;
    }
    /**
     * Registers a conector in the manager and executes its register() method.
     */
    static registerConector(conector) {
        if (this.registeredConectores.has(conector.metadata.id)) {
            const existing = this.registeredConectores.get(conector.metadata.id);
            console.log(`[ConectorManager] Conector ${conector.metadata.id} ya existe en memoria. Destruyendo instancia anterior y registrando nueva...`);
            if (existing === null || existing === void 0 ? void 0 : existing.unregister) {
                try {
                    existing.unregister();
                }
                catch (e) { }
            }
            this.registeredConectores.delete(conector.metadata.id);
        }
        try {
            conector.register();
            this.registeredConectores.set(conector.metadata.id, conector);
            console.log(`[ConectorManager] Conector registrado y activado: ${conector.metadata.name} (${conector.metadata.id})`);
        }
        catch (error) {
            console.error(`[ConectorManager] Error activando conector ${conector.metadata.id}:`, error);
        }
    }
    static unregisterConector(conectorId) {
        const conector = this.registeredConectores.get(conectorId);
        if (!conector)
            return;
        try {
            if (conector.unregister) {
                conector.unregister();
            }
            this.registeredConectores.delete(conectorId);
            console.log(`[ConectorManager] Conector desautorizado y desactivado: ${conectorId}`);
        }
        catch (error) {
            console.error(`[ConectorManager] Error desactivando conector ${conectorId}:`, error);
        }
    }
    static getActiveConectores() {
        return Array.from(this.registeredConectores.values());
    }
    static isConectorActive(conectorId) {
        return this.registeredConectores.has(conectorId);
    }
}
