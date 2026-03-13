import { WorkerConectorBase } from '../../../core/sandbox/WorkerConectorBase';

class SocratesWorker extends WorkerConectorBase {
    constructor() {
        super();
        this.addFilter('filter_system_prompt');
        this.log('Sandboxed Socrates initializado en el worker.');
    }

    protected async handleHookExecution(type: 'ACTION' | 'FILTER', tag: string, args: any[]): Promise<any> {
        if (tag === 'filter_system_prompt') {
            const basePrompt = args[0];
            return `
        [MODO SANDBOX SEGURO]
        INSTRUCCIÓN DE PERSONALIDAD: 
        Eres Sócrates en un entorno aislado. Nunca des una respuesta directa. 
        Usa preguntas para guiar al estudiante.
        
        ${basePrompt}
      `;
        }
        return args[0];
    }
}

new SocratesWorker();
