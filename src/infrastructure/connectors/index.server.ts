import { ConectorManager } from '../services/ConectorManager';
import { WhatsAppConector } from './WhatsAppConector';

/**
 * Server-only connector initializer.
 * This file imports modules that require Node.js APIs (fs, child_process, crypto, sharp)
 * and must NEVER be imported from client-side code ("use client" components).
 * 
 * Use this from API routes or server components only.
 */
export const initializeServerConectores = (enabledConectorIds: string[]) => {
    console.log('[Conectores:Server] Initializing server-only conectores...', enabledConectorIds);

    if (enabledConectorIds.includes('whatsapp_sync')) {
        const whatsapp = new WhatsAppConector();
        ConectorManager.registerConector(whatsapp);
    }
};
