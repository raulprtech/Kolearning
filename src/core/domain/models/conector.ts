export interface SettingSchemaItem {
    id: string;
    label: string;
    type: 'boolean' | 'string' | 'number' | 'select' | 'password';
    defaultValue?: any;
    options?: { label: string, value: any }[]; // For select type
    description?: string;
}

export interface ConectorMetadata {
    id: string;
    name: string;
    description: string;
    author?: string;
    version?: string;
    icon: string;
    category: 'Conectores de Datos' | 'Conectores de Canal' | 'Conectores de Voz' | 'Conectores de Exportación' | 'Conectores de LMS' | 'Módulos de Gamificación' | 'Módulos de Analytics' | 'Módulos de Estudio Alternativos' | 'Launchers';
    settingsSchema?: SettingSchemaItem[];
}

/**
 * IConector: The interface that every "conector" must implement.
 */
export interface IConector {
    metadata: ConectorMetadata;

    /**
     * register: Called when the conector is enabled.
     * This is where the conector should register its hooks in the HookRegistry.
     */
    register(): void;

    /**
     * unregister: Cleanup when the conector is disabled or removed.
     */
    unregister?(): void;
}
