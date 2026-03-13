import { BaseConector, ConectorMetadata, DataRegistry, IDataProvider } from '../../core/sdk/ConectorSDK';
import { searchPapers, SearchResult } from '../../lib/paper-utils';

export class SemanticScholarConector extends BaseConector implements IDataProvider {
    public metadata: ConectorMetadata = {
        id: 'semantic_scholar',
        name: 'Semantic Scholar',
        description: 'Busca e importa artículos científicos directamente desde Semantic Scholar.',
        icon: 'Library',
        version: '1.0.0',
        author: 'Kolearning Team',
        category: 'Conectores de Datos'
    };

    register(): void {
        this.log("Registrando proveedor de datos Semantic Scholar...");
        DataRegistry.registerProvider(this.metadata.id, this);
    }

    unregister(): void {
        DataRegistry.unregisterProvider(this.metadata.id);
        super.unregister?.();
    }

    async search(query: string): Promise<SearchResult[]> {
        this.log(`Buscando: ${query}`);
        return searchPapers(query);
    }

    async import(id: string): Promise<any> {
        this.log(`Importando artículo ID: ${id}`);
        // En una implementación real, aquí buscaríamos los detalles completos.
        // Por ahora, el searchResult ya suele tener lo necesario para el MVP.
        return { id, source: 'semantic_scholar' };
    }
}
