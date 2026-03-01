export class TelegramAdapter {
    constructor(token) {
        this.botToken = token;
    }
    async sendMessage(userId, message) {
        console.log(`[TelegramAdapter] Intentando enviar mensaje a ${userId} via Telegram...`);
        // Simulación de llamada a la API de Telegram
        // const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        // await fetch(url, { ... });
        return Promise.resolve();
    }
    async isActive() {
        return !!this.botToken;
    }
    onMessageReceived(callback) {
        console.log(`[TelegramAdapter] Listener de mensajes configurado.`);
        // Aquí se implementaría el webhook o long polling de Telegram
    }
}
