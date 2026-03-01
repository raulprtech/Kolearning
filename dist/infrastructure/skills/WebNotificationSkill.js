import { HookRegistry } from '../../core/domain/services/HookRegistry';
export class WebNotificationSkill {
    constructor() {
        this.metadata = {
            id: 'web_notifications',
            name: 'Notificaciones Web',
            description: 'Recibe alertas en tu navegador cuando Koli complete una tarea.',
            icon: 'Bell',
            version: '1.0.0',
            author: 'Kolearning Team'
        };
    }
    register() {
        HookRegistry.addAction('on_task_executed', (data) => {
            console.log(`[WebNotificationSkill] Intentando enviar notificación para: ${data.id}`);
            if (!("Notification" in window)) {
                console.warn("[WebNotificationSkill] Este navegador no soporta notificaciones de escritorio.");
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
        console.log(`[WebNotificationSkill] Skill registrada.`);
    }
    showNotification(data) {
        new Notification("Koli: Tarea Completada", {
            body: `La tarea "${data.id}" ha finalizado con éxito.\n${data.description || ''}`,
            icon: '/favicon.ico'
        });
    }
    unregister() {
        console.log(`[WebNotificationSkill] Unregistering (TBD)`);
    }
}
