import { WorkerConectorBase } from '../../../core/sandbox/WorkerConectorBase';

class TelegramWorker extends WorkerConectorBase {
    constructor() {
        super();
        this.addAction('on_message_sent');
        this.addFilter('filter_user_message');
        this.addAction('on_atoms_generated');
        this.log('Telegram worker inicializado.');
    }

    protected async handleHookExecution(type: 'ACTION' | 'FILTER', tag: string, args: any[]): Promise<any> {
        if (type === 'ACTION') {
            if (tag === 'on_message_sent') {
                const data = args[0];
                this.log(`[TelegramWorker] Detectado mensaje enviado: ${data.content}`);
                // Aquí iría la integración real con Telegram API via fetch
            }
            if (tag === 'on_atoms_generated') {
                const atoms = args[0];
                this.log(`[TelegramWorker] ${atoms.length} nuevos átomos generados.`);
            }
        } else if (type === 'FILTER') {
            if (tag === 'filter_user_message') {
                const content = args[0];
                if (content.toLowerCase().includes('telegram')) {
                    return content + " (Enviado con soporte de Telegram activo en Sandbox)";
                }
                return content;
            }
        }
        return args[0];
    }
}

new TelegramWorker();
