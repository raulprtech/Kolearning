export interface ConectorMetadata {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'Conectores de Datos' | 'Conectores de Canal' | 'Conectores de Voz' | 'Conectores de Exportación' | 'Conectores de LMS' | 'Módulos de Gamificación' | 'Módulos de Analytics' | 'Módulos de Estudio Alternativos' | 'Launchers';
}

export interface IUserConector {
    conectorId: string;
    isEnabled: boolean;
    settings: Record<string, any>;
}

export interface IConectorService {
    /**
     * Returns a list of all available conectores in the system
     */
    getAvailableConectores(): Promise<ConectorMetadata[]>;

    /**
     * Returns the conectores enabled/configured by a specific user
     */
    getUserConectores(userId: string): Promise<IUserConector[]>;

    /**
     * Enables or disables a conector for a user
     */
    toggleConector(userId: string, conectorId: string, enabled: boolean): Promise<void>;

    /**
     * Updates settings for a specific conector
     */
    updateConectorSettings(userId: string, conectorId: string, settings: Record<string, any>): Promise<void>;
}
