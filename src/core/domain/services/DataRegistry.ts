import { SearchResult } from '../../../lib/paper-utils';

/**
 * DataRegistry: Centralizes data providers registered by connectors.
 */
export class DataRegistry {
    private static providers: Map<string, IDataProvider> = new Map();

    static registerProvider(conectorId: string, provider: IDataProvider) {
        this.providers.set(conectorId, provider);
        console.log(`[DataRegistry] Provider registrado para: ${conectorId}`);
    }

    static unregisterProvider(conectorId: string) {
        this.providers.delete(conectorId);
    }

    static getProvider(conectorId: string): IDataProvider | undefined {
        return this.providers.get(conectorId);
    }

    static getAllProviders(): [string, IDataProvider][] {
        return Array.from(this.providers.entries());
    }
}

export interface IDataProvider {
    search(query: string): Promise<SearchResult[]>;
    import(id: string): Promise<any>; // Returns a paper/document object
}
