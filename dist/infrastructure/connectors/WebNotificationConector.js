import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { BaseConector } from '../../core/sdk/ConectorSDK';
export class WebNotificationConector extends BaseConector {
    constructor() {
        super(...arguments);
        this.metadata = {
            id: 'web_notifications',
            name: 'Notificaciones Web',
            description: 'Recibe alertas en tu navegador cuando Kolearning complete una tarea.',
            icon: 'Bell',
            version: '1.0.0',
            author: 'Kolearning Team',
            category: 'Conectores de Canal'
        };
    }
    register() {
        HookRegistry.addAction('on_task_executed', (data) => {
            console.log(`[WebNotificationConector] Intentando enviar notificación para: ${data.id}`);
            if (!("Notification" in window)) {
                console.warn("[WebNotificationConector] Este navegador no soporta notificaciones de escritorio.");
                return;
            }
            if (Notification.permission === "granted") {
                this.showNotification(data);
            }
            else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        this.showNotification(data);
                    }
                });
            }
        });
        console.log(`[WebNotificationConector] Conector registrada.`);
    }
    showNotification(data) {
        new Notification("Kolearning: Tarea Completada", {
            body: `La tarea "${data.id}" ha finalizado con éxito.\n${data.description || ''}`,
            icon: '/favicon.ico'
        });
    }
    unregister() {
        console.log(`[WebNotificationConector] Unregistering (TBD)`);
    }
}
