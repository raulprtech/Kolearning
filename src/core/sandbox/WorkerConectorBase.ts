import { parentPort, workerData } from 'worker_threads';
import { SandboxMessage, ExecuteHookPayload, HookResultPayload } from './types';

export abstract class WorkerConectorBase {
    protected metadata = workerData.metadata;

    constructor() {
        if (!parentPort) throw new Error('Must run in a worker thread');

        parentPort.on('message', async (msg: SandboxMessage) => {
            if (msg.type === 'EXECUTE_HOOK') {
                const { hookType, tag, args, correlationId } = msg.payload as ExecuteHookPayload;
                try {
                    const result = await this.handleHookExecution(hookType, tag, args);
                    parentPort?.postMessage({
                        type: 'HOOK_RESULT',
                        payload: { correlationId, result }
                    });
                } catch (error) {
                    console.error(`[Worker] Error executing hook ${tag}:`, error);
                }
            }
        });
    }

    protected abstract handleHookExecution(type: 'ACTION' | 'FILTER', tag: string, args: any[]): Promise<any>;

    protected addAction(tag: string) {
        parentPort?.postMessage({
            type: 'REGISTER_HOOK',
            payload: { hookType: 'ACTION', tag }
        });
    }

    protected addFilter(tag: string) {
        parentPort?.postMessage({
            type: 'REGISTER_HOOK',
            payload: { hookType: 'FILTER', tag }
        });
    }

    protected log(message: any) {
        parentPort?.postMessage({
            type: 'LOG',
            payload: message
        });
    }
}
