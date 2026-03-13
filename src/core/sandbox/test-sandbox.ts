import { SandboxConectorProxy } from './SandboxProxy';
import { HookRegistry } from '../domain/services/HookRegistry';
import path from 'path';

async function test() {
    console.log('--- Iniciando Test de Sandbox ---');
    console.log('PID:', process.pid);

    const metadata = {
        id: 'persona_socrates_sandbox',
        name: 'Sócrates Sandboxed',
        description: 'PoC de aislamiento',
        icon: 'Brain',
        category: 'Módulos de Estudio Alternativos' as any
    };

    const workerPath = path.resolve('src/infrastructure/connectors/sandboxed/SocratesWorker.ts');
    const proxy = new SandboxConectorProxy(metadata, workerPath);

    console.log('1. Registrando el Proxy en el hilo principal...');
    proxy.register();

    // Esperar un poco a que el worker inicialice
    await new Promise(r => setTimeout(r, 1000));

    console.log('2. Aplicando filtro "filter_system_prompt" desde el hilo principal...');
    const originalPrompt = "Eres un asistente de inteligencia artificial.";
    const filteredPrompt = await HookRegistry.applyFilters('filter_system_prompt', originalPrompt);

    console.log('RESULTADO DEL FILTRO (debería estar modificado por el worker):');
    console.log(filteredPrompt);

    if (filteredPrompt.includes('[MODO SANDBOX SEGURO]')) {
        console.log('✅ TEST PASSED: El worker modificó el prompt exitosamente.');
    } else {
        console.log('❌ TEST FAILED: El prompt no fue modificado.');
    }

    console.log('3. Limpiando...');
    proxy.unregister();
    process.exit(0);
}

test().catch(console.error);
