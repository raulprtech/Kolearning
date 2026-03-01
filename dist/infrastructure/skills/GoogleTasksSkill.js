import { HookRegistry } from '../../core/domain/services/HookRegistry';
export class GoogleTasksSkill {
    constructor() {
        this.metadata = {
            id: 'google_tasks_sync',
            name: 'Google Tasks Sync',
            description: 'Sincroniza los resultados de tus tareas con Google Tasks.',
            icon: 'CheckSquare',
            version: '1.0.0',
            author: 'Kolearning Team'
        };
    }
    register() {
        HookRegistry.addAction('on_task_executed', async (data) => {
            console.log(`[GoogleTasksSkill] Recibida notificación de tarea: ${data.id}. Ignorando en este MVP si no hay token de acceso.`);
            // En una implementación completa, aquí llamaríamos a googleTasksSyncFlow
            // Para este MVP, solo registramos la intención en el log.
        });
        console.log(`[GoogleTasksSkill] Skill registrada.`);
    }
    unregister() {
        console.log(`[GoogleTasksSkill] Unregistering (TBD)`);
    }
}
