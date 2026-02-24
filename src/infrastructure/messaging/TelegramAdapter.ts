import { IMessagingService } from '../../core/ports/outbound/IMessagingService';

export class TelegramAdapter implements IMessagingService {
    private botToken: string;

    constructor(token: string) {
        this.botToken = token;
    }

    async sendMessage(userId: string, message: string): Promise<void> {
        console.log(`[TelegramAdapter] Intentando enviar mensaje a ${userId} via Telegram...`);
        // Simulación de llamada a la API de Telegram
        // const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        // await fetch(url, { ... });

        return Promise.resolve();
    }

    async isActive(): Promise<boolean> {
        return !!this.botToken;
    }

    onMessageReceived(callback: (userId: string, message: string) => void): void {
        console.log(`[TelegramAdapter] Listener de mensajes configurado.`);
        // Aquí se implementaría el webhook o long polling de Telegram
    }
}
