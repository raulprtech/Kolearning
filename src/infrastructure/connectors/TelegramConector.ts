import { IConector, ConectorMetadata } from '../../core/domain/models/conector';
import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { TelegramAdapter } from '../messaging/TelegramAdapter';

export class TelegramConector implements IConector {
    public metadata: ConectorMetadata = {
        id: 'telegram_sync',
        name: 'Telegram Sync',
        description: 'Sincroniza tus repasos con Telegram y permite responder desde allí.',
        icon: 'MessageSquareShare',
        version: '1.0.0',
        author: 'Kolearning Team'
    };

    private adapter: TelegramAdapter;

    constructor(botToken: string) {
        this.adapter = new TelegramAdapter(botToken);
    }

    register(): void {
        // 1. Reaccionar cuando se envía un mensaje en el chat web
        HookRegistry.addAction('on_message_sent', (data) => {
            console.log(`[TelegramConector] Notificando mensaje a Telegram: ${data.content}`);
            // this.adapter.sendMessage('common_user', `Copia de tu mensaje: ${data.content}`);
        });

        // 2. Interceptar el mensaje del usuario para transformarlo si es necesario
        HookRegistry.addFilter('filter_user_message', (content: string) => {
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

    unregister(): void {
        console.log(`[TelegramConector] Unregistering conector hooks (TBD)`);
    }
}
