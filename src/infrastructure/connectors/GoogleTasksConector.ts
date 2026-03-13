import { ConectorMetadata } from '../../core/domain/models/conector';
import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { BaseConector } from '../../core/sdk/ConectorSDK';

export class GoogleTasksConector extends BaseConector {
    public metadata: ConectorMetadata = {
        id: 'google_tasks_sync',
        name: 'Google Tasks Sync',
        description: 'Sincroniza los resultados de tus tareas con Google Tasks.',
        icon: 'CheckSquare',
        version: '1.0.0',
        author: 'Kolearning Team',
        category: 'Conectores de Exportación'
    };

    register(): void {
        HookRegistry.addAction('on_task_executed', async (data) => {
            console.log(`[GoogleTasksConector] Recibida notificación de tarea: ${data.id}. Ignorando en este MVP si no hay token de acceso.`);
            // En una implementación completa, aquí llamaríamos a googleTasksSyncFlow
            // Para este MVP, solo registramos la intención en el log.
        });

        console.log(`[GoogleTasksConector] Conector registrada.`);
    }

    unregister(): void {
        console.log(`[GoogleTasksConector] Unregistering (TBD)`);
    }
}
