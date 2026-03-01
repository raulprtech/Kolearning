import { describe, it, expect, beforeEach } from 'vitest';
import { ConectorService } from './ConectorService';

describe('ConectorService', () => {
    let conectorService: ConectorService;

    beforeEach(() => {
        conectorService = new ConectorService();
    });

    it('should return available connectors', async () => {
        const available = await conectorService.getAvailableConectores();
        expect(available.length).toBeGreaterThan(0);
        expect(available.find(p => p.id === 'whatsapp_sync')).toBeDefined();
    });

    it('should toggle a connector', async () => {
        const userId = 'user-123';
        const conectorId = 'telegram_sync';

        await conectorService.toggleConector(userId, conectorId, true);
        let userConectores = await conectorService.getUserConectores(userId);
        expect(userConectores.find(p => p.conectorId === conectorId)?.isEnabled).toBe(true);

        await conectorService.toggleConector(userId, conectorId, false);
        userConectores = await conectorService.getUserConectores(userId);
        expect(userConectores.find(p => p.conectorId === conectorId)?.isEnabled).toBe(false);
    });

    it('should update connector settings', async () => {
        const userId = 'user-123';
        const conectorId = 'telegram_sync';
        const settings = { apiKey: '12345' };

        await conectorService.updateConectorSettings(userId, conectorId, settings);
        const userConectores = await conectorService.getUserConectores(userId);
        expect(userConectores.find(p => p.conectorId === conectorId)?.settings).toEqual(settings);
    });
});
