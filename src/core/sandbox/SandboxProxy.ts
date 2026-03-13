import { IConector, ConectorMetadata } from '../domain/models/conector';
import { HookRegistry } from '../domain/services/HookRegistry';
import { SandboxMessage, ExecuteHookPayload, HookResultPayload, RegisterHookPayload } from './types';
import path from 'path';
import { Worker } from 'worker_threads';

export class SandboxConectorProxy implements IConector {
    private worker: Worker | null = null;
    private pendingFilters = new Map<string, (result: any) => void>();

    constructor(
        public metadata: ConectorMetadata,
        private workerScriptPath: string
    ) { }

    register(): void {
        console.log(`[SandboxProxy] Launching worker for ${this.metadata.id} (Script: ${this.workerScriptPath})...`);
        
        const loaderPath = path.resolve(__dirname, 'worker-loader.js');
        this.worker = new Worker(loaderPath, {
            workerData: { 
                metadata: this.metadata,
                scriptPath: this.workerScriptPath
            }
        });

        this.worker.on('message', (msg: SandboxMessage) => {
            this.handleWorkerMessage(msg);
        });

        this.worker.on('error', (err: Error) => {
            console.error(`[SandboxProxy] Worker error in ${this.metadata.id}:`, err);
        });

        this.worker.on('exit', (code: number) => {
            if (code !== 0) {
                console.error(`[SandboxProxy] Worker stopped with exit code ${code}`);
            }
        });
    }

    private handleWorkerMessage(msg: SandboxMessage) {
        switch (msg.type) {
            case 'REGISTER_HOOK':
                const { hookType, tag } = msg.payload as RegisterHookPayload;
                if (hookType === 'ACTION') {
                    HookRegistry.addAction(tag, (...args) => {
                        this.worker?.postMessage({
                            type: 'EXECUTE_HOOK',
                            payload: { hookType: 'ACTION', tag, args, correlationId: Math.random().toString(36).substring(7) }
                        });
                    });
                } else if (hookType === 'FILTER') {
                    HookRegistry.addFilter(tag, (value, ...args) => {
                        return new Promise((resolve) => {
                            const correlationId = Math.random().toString(36).substring(7);
                            this.pendingFilters.set(correlationId, resolve);
                            this.worker?.postMessage({
                                type: 'EXECUTE_HOOK',
                                payload: { hookType: 'FILTER', tag, args: [value, ...args], correlationId }
                            });
                        });
                    });
                }
                break;

            case 'HOOK_RESULT':
                const { correlationId, result } = msg.payload as HookResultPayload;
                const resolve = this.pendingFilters.get(correlationId);
                if (resolve) {
                    resolve(result);
                    this.pendingFilters.delete(correlationId);
                }
                break;

            case 'LOG':
                console.log(`[Worker:${this.metadata.id}]`, msg.payload);
                break;
        }
    }

    unregister(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
