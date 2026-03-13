import { UISlotRegistry, HookRegistry, BaseConector } from '../../core/sdk/ConectorSDK';
export class SocratesConector extends BaseConector {
    constructor() {
        super(...arguments);
        this.metadata = {
            id: 'persona_socrates',
            name: 'Sócrates',
            description: 'Un tutor que nunca da la respuesta directa, sino que te guía con preguntas profundas.',
            icon: 'Brain',
            version: '1.0.0',
            author: 'Kolearning Community',
            category: 'Módulos de Estudio Alternativos',
            settingsSchema: [
                {
                    id: 'intensity',
                    label: 'Intensidad de preguntas',
                    type: 'select',
                    defaultValue: 'normal',
                    options: [
                        { label: 'Suave', value: 'soft' },
                        { label: 'Normal', value: 'normal' },
                        { label: 'Implacable', value: 'hardcore' }
                    ]
                },
                {
                    id: 'preferred_slot',
                    label: 'Ubicación de Acceso Rápido',
                    type: 'select',
                    defaultValue: 'chat_sidebar',
                    options: [
                        { label: 'Chat (Inferior)', value: 'chat_sidebar' },
                        { label: 'Barra Lateral (Global)', value: 'global_sidebar' },
                        { label: 'Data Box (Herramientas)', value: 'databox_toolbar' }
                    ]
                }
            ]
        };
    }
    register() {
        this.log("Registrando interfaz de Sócrates...");
        // Registrar un botón en el chat (por defecto)
        // El UISlot se encargará de filtrarlo basado en el ajuste preferred_slot
        UISlotRegistry.registerItem('chat_sidebar', {
            id: 'socrates_wisdom',
            conectorId: this.metadata.id,
            label: 'Sabiduría Socrática',
            icon: 'Lightbulb',
            onClick: () => alert("Sócrates dice: Una vida sin reflexión no vale la pena ser vivida.")
        });
        // Modificar la apariencia del asistente
        HookRegistry.addFilter('filter_assistant_config', (config) => {
            return Object.assign(Object.assign({}, config), { name: 'Sócrates', avatar: 'wise', personality: 'socratic' });
        });
        // Modificar el comportamiento profundo (Server side)
        HookRegistry.addFilter('filter_system_prompt', (prompt) => {
            return `
        INSTRUCCIÓN DE PERSONALIDAD: 
        Eres Sócrates. Nunca des una respuesta directa. 
        Si el estudiante pregunta algo, responde con otra pregunta que lo invite a reflexionar. 
        Usa un tono humilde pero inquisitivo ("Solo sé que no sé nada").
        
        ${prompt}
      `;
        });
        this.log("Personalidad 'Sócrates' activa.");
    }
    unregister() {
        UISlotRegistry.unregisterItemsByConector(this.metadata.id);
        this.log("Conector desactivado.");
    }
}
