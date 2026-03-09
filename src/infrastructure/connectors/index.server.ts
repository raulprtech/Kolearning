import { ConectorManager } from '../services/ConectorManager';
import { WhatsAppConector } from './WhatsAppConector';

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
};
