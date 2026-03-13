import { WorkerConectorBase } from '../../../core/sandbox/WorkerConectorBase';

class GoogleTasksWorker extends WorkerConectorBase {
    constructor() {
        super();
        this.addAction('on_task_executed');
        this.log('Google Tasks worker inicializado.');
    }

    protected async handleHookExecution(type: 'ACTION' | 'FILTER', tag: string, args: any[]): Promise<any> {
        if (tag === 'on_task_executed') {
            const data = args[0];
            this.log(`[GoogleTasksWorker] Recibida notificación de tarea: ${data.id}. Pendiente de sincronización con Google API.`);
        }
        return args[0];
    }
}

new GoogleTasksWorker();
