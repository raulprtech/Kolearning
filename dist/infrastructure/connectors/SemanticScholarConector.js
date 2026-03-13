import { BaseConector, DataRegistry } from '../../core/sdk/ConectorSDK';
import { searchPapers } from '../../lib/paper-utils';
export class SemanticScholarConector extends BaseConector {
    constructor() {
        super(...arguments);
        this.metadata = {
            id: 'semantic_scholar',
            name: 'Semantic Scholar',
            description: 'Busca e importa artículos científicos directamente desde Semantic Scholar.',
            icon: 'Library',
            version: '1.0.0',
            author: 'Kolearning Team',
            category: 'Conectores de Datos'
        };
    }
    register() {
        this.log("Registrando proveedor de datos Semantic Scholar...");
        DataRegistry.registerProvider(this.metadata.id, this);
    }
    unregister() {
        var _a;
        DataRegistry.unregisterProvider(this.metadata.id);
        (_a = super.unregister) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    async search(query) {
        this.log(`Buscando: ${query}`);
        return searchPapers(query);
    }
    async import(id) {
        this.log(`Importando artículo ID: ${id}`);
        // En una implementación real, aquí buscaríamos los detalles completos.
        // Por ahora, el searchResult ya suele tener lo necesario para el MVP.
        return { id, source: 'semantic_scholar' };
    }
}
