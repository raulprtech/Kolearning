import { HookRegistry } from '../../core/domain/services/HookRegistry';
export class WhatsAppSkill {
    constructor() {
        this.metadata = {
            id: 'whatsapp_sync',
            name: 'WhatsApp Sync',
            description: 'Recibe tus resultados de aprendizaje por WhatsApp.',
            icon: 'MessageCircle',
            version: '1.0.0',
            author: 'Kolearning Team'
        };
    }
    register() {
        HookRegistry.addAction('on_task_executed', (data) => {
            var _a;
            console.log(`[WhatsAppSkill] [MOCK] Enviando mensaje de WhatsApp para tarea: ${data.id}`);
            console.log(`[WhatsAppSkill] Contenido: ${((_a = data.result) === null || _a === void 0 ? void 0 : _a.summary) || 'Tarea completada'}`);
        });
        console.log(`[WhatsAppSkill] Skill registrada (Modo Mock).`);
    }
    unregister() {
        console.log(`[WhatsAppSkill] Unregistering (TBD)`);
    }
}
