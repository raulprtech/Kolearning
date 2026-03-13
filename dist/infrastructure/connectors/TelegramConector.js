import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { TelegramAdapter } from '../messaging/TelegramAdapter';
import { BaseConector } from '../../core/sdk/ConectorSDK';
export class TelegramConector extends BaseConector {
    constructor(botToken) {
        super();
        this.metadata = {
            id: 'telegram_sync',
            name: 'Telegram Sync',
            description: 'Sincroniza tus repasos con Telegram y permite responder desde allí.',
            icon: 'MessageSquareShare',
            version: '1.0.0',
            author: 'Kolearning Team',
            category: 'Conectores de Canal'
        };
        this.adapter = new TelegramAdapter(botToken);
    }
    register() {
        // 1. Reaccionar cuando se envía un mensaje en el chat web
        HookRegistry.addAction('on_message_sent', (data) => {
            console.log(`[TelegramConector] Notificando mensaje a Telegram: ${data.content}`);
            // this.adapter.sendMessage('common_user', `Copia de tu mensaje: ${data.content}`);
        });
        // 2. Interceptar el mensaje del usuario para transformarlo si es necesario
        HookRegistry.addFilter('filter_user_message', (content) => {
            if (content.toLowerCase().includes('telegram')) {
                return content + " (Enviado con soporte de Telegram activo)";
            }
            return content;
        });
        // 3. Reaccionar a la generación de átomos
        HookRegistry.addAction('on_atoms_generated', (atoms) => {
            console.log(`[TelegramConector] ¡${atoms.length} nuevos átomos generados! Enviando resumen a Telegram...`);
        });
        console.log(`[TelegramConector] Hooks registrados con éxito.`);
    }
    unregister() {
        console.log(`[TelegramConector] Unregistering conector hooks (TBD)`);
    }
}
