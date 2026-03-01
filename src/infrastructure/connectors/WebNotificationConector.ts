import { IConector, ConectorMetadata } from '../../core/domain/models/conector';
import { HookRegistry } from '../../core/domain/services/HookRegistry';

export class WebNotificationConector implements IConector {
    public metadata: ConectorMetadata = {
        id: 'web_notifications',
        name: 'Notificaciones Web',
        description: 'Recibe alertas en tu navegador cuando Kolearning complete una tarea.',
        icon: 'Bell',
        version: '1.0.0',
        author: 'Kolearning Team'
    };

    register(): void {
        HookRegistry.addAction('on_task_executed', (data) => {
            console.log(`[WebNotificationConector] Intentando enviar notificación para: ${data.id}`);

            if (!("Notification" in window)) {
                console.warn("[WebNotificationConector] Este navegador no soporta notificaciones de escritorio.");
                return;
            }

            if (Notification.permission === "granted") {
                this.showNotification(data);
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        this.showNotification(data);
                    }
                });
            }
        });

        console.log(`[WebNotificationConector] Conector registrada.`);
    }

    private showNotification(data: any) {
        new Notification("Kolearning: Tarea Completada", {
            body: `La tarea "${data.id}" ha finalizado con éxito.\n${data.description || ''}`,
            icon: '/favicon.ico'
        });
    }

    unregister(): void {
        console.log(`[WebNotificationConector] Unregistering (TBD)`);
    }
}
