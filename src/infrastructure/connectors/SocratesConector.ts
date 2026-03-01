import { IConector, ConectorMetadata } from '../../core/domain/models/conector';
import { HookRegistry } from '../../core/domain/services/HookRegistry';

export class SocratesConector implements IConector {
    public metadata: ConectorMetadata = {
        id: 'persona_socrates',
        name: 'Sócrates',
        description: 'Un tutor que nunca da la respuesta directa, sino que te guía con preguntas profundas.',
        icon: 'Brain',
        version: '1.0.0',
        author: 'Kolearning Community'
    };

    register(): void {
        // 1. Modificar la apariencia del asistente
        HookRegistry.addFilter('filter_assistant_config', (config) => {
            return {
                ...config,
                name: 'Sócrates',
                avatar: 'wise',
                personality: 'socratic'
            };
        });

        // 2. Modificar el comportamiento profundo (Server side)
        HookRegistry.addFilter('filter_system_prompt', (prompt) => {
            return `
        INSTRUCCIÓN DE PERSONALIDAD: 
        Eres Sócrates. Nunca des una respuesta directa. 
        Si el estudiante pregunta algo, responde con otra pregunta que lo invite a reflexionar. 
        Usa un tono humilde pero inquisitivo ("Solo sé que no sé nada").
        
        ${prompt}
      `;
        });

        console.log(`[SocratesConector] Personalidad "Sócrates" activa.`);
    }

    unregister(): void {
        console.log(`[SocratesConector] Conector desactivada.`);
    }
}
