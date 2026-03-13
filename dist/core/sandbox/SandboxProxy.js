import { Worker } from 'worker_threads';
import { HookRegistry } from '../domain/services/HookRegistry';
import path from 'path';
export class SandboxConectorProxy {
    constructor(metadata, workerScriptPath) {
        this.metadata = metadata;
        this.workerScriptPath = workerScriptPath;
        this.worker = null;
        this.pendingFilters = new Map();
    }
    register() {
        console.log(`[SandboxProxy] Launching worker for ${this.metadata.id} (Script: ${this.workerScriptPath})...`);
        const loaderPath = path.resolve(__dirname, 'worker-loader.js');
        this.worker = new Worker(loaderPath, {
            workerData: {
                metadata: this.metadata,
                scriptPath: this.workerScriptPath
            }
        });
        this.worker.on('message', (msg) => {
            this.handleWorkerMessage(msg);
        });
        this.worker.on('error', (err) => {
            console.error(`[SandboxProxy] Worker error in ${this.metadata.id}:`, err);
        });
        this.worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`[SandboxProxy] Worker stopped with exit code ${code}`);
            }
        });
    }
    handleWorkerMessage(msg) {
        switch (msg.type) {
            case 'REGISTER_HOOK':
                const { hookType, tag } = msg.payload;
                if (hookType === 'ACTION') {
                    HookRegistry.addAction(tag, (...args) => {
                        var _a;
                        (_a = this.worker) === null || _a === void 0 ? void 0 : _a.postMessage({
                            type: 'EXECUTE_HOOK',
                            payload: { hookType: 'ACTION', tag, args, correlationId: Math.random().toString(36).substring(7) }
                        });
                    });
                }
                else if (hookType === 'FILTER') {
                    HookRegistry.addFilter(tag, (value, ...args) => {
                        return new Promise((resolve) => {
                            var _a;
                            const correlationId = Math.random().toString(36).substring(7);
                            this.pendingFilters.set(correlationId, resolve);
                            (_a = this.worker) === null || _a === void 0 ? void 0 : _a.postMessage({
                                type: 'EXECUTE_HOOK',
                                payload: { hookType: 'FILTER', tag, args: [value, ...args], correlationId }
                            });
                        });
                    });
                }
                break;
            case 'HOOK_RESULT':
                const { correlationId, result } = msg.payload;
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
    unregister() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
