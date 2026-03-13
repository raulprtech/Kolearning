import { ConectorManager } from '../services/ConectorManager';
import { WhatsAppConector } from './WhatsAppConector';
import { SandboxConectorProxy } from '../../core/sandbox/SandboxProxy';
import path from 'path';

/**
 * Server-only connector initializer.
 * This file imports modules that require Node.js APIs (fs, child_process, crypto, sharp)
 * and must NEVER be imported from client-side code ("use client" components).
 * 
 * Use this from API routes or server components only.
 */
export const initializeServerConectores = async (enabledConectorIds: string[]) => {
    console.log('[Conectores:Server] Initializing server-only conectores...', enabledConectorIds);

    if (enabledConectorIds.includes('whatsapp_sync')) {
        const existing = ConectorManager.getActiveConectores().find(c => c.metadata.id === 'whatsapp_sync');

        if (existing) {
            console.log('[Conectores:Server] Conector whatsapp_sync ya activo. Asegurando registro de hooks...');
            existing.register(); // Re-registrar hooks si se perdieron
            return;
        }

        try {
            // Verificar dependencias críticas
            console.log('[Conectores:Server] Verificando dependencias para WhatsApp...');
            try {
                require.resolve('jimp');
                require.resolve('sharp');
                console.log('[Conectores:Server] ✅ jimp y sharp están presentes.');
            } catch (depErr) {
                console.warn('[Conectores:Server] ⚠️ Advertencia: jimp o sharp no encontrados. Baileys podría fallar al procesar el QR.');
            }

            const whatsapp = new WhatsAppConector();
            ConectorManager.registerConector(whatsapp);
        } catch (error) {
            console.error('[Conectores:Server] ❌ Error fatal inicializando WhatsAppConector:', error);
            throw error; // Re-lanzar para que la API devuelva 500
        }
    }

    if (enabledConectorIds.includes('telegram_sync')) {
        if (!ConectorManager.getActiveConectores().find(c => c.metadata.id === 'telegram_sync')) {
            const telegramProxy = new SandboxConectorProxy({
                id: 'telegram_sync',
                name: 'Telegram Sync',
                description: 'Aislado en Sandbox para mayor seguridad.',
                icon: 'MessageSquareShare',
                category: 'Conectores de Canal'
            }, path.resolve('src/infrastructure/connectors/sandboxed/TelegramWorker.ts'));
            ConectorManager.registerConector(telegramProxy);
        }
    }

    if (enabledConectorIds.includes('persona_socrates')) {
        if (!ConectorManager.getActiveConectores().find(c => c.metadata.id === 'persona_socrates')) {
            const socratesProxy = new SandboxConectorProxy({
                id: 'persona_socrates',
                name: 'Sócrates',
                description: 'Tutor filosófico aislado en Sandbox.',
                icon: 'Brain',
                category: 'Módulos de Estudio Alternativos'
            }, path.resolve('src/infrastructure/connectors/sandboxed/SocratesWorker.ts'));
            ConectorManager.registerConector(socratesProxy);
        }
    }

    if (enabledConectorIds.includes('google_tasks_sync')) {
        if (!ConectorManager.getActiveConectores().find(c => c.metadata.id === 'google_tasks_sync')) {
            const googleProxy = new SandboxConectorProxy({
                id: 'google_tasks_sync',
                name: 'Google Tasks Sync',
                description: 'Sincronización aislada de tareas.',
                icon: 'CheckSquare',
                category: 'Conectores de Exportación'
            }, path.resolve('src/infrastructure/connectors/sandboxed/GoogleTasksWorker.ts'));
            ConectorManager.registerConector(googleProxy);
        }
    }
};
