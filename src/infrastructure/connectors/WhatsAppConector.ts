import { IConector, ConectorMetadata } from '../../core/domain/models/conector';
import { HookRegistry } from '../../core/domain/services/HookRegistry';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    ConnectionState,
    delay
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import * as fs from 'fs';
import pino from 'pino';
import * as QRCodeImage from 'qrcode';

export class WhatsAppConector implements IConector {
    public metadata: ConectorMetadata = {
        id: 'whatsapp_sync',
        name: 'WhatsApp Sync',
        description: 'Recibe tus resultados y chatea con Kolearning por WhatsApp.',
        icon: 'MessageCircle',
        version: '1.2.0',
        author: 'Kolearning Team'
    };

    private socket: any = null;
    private isConnected: boolean = false;
    private authDir: string = path.join(process.cwd(), '.whatsapp_auth');
    private logger = pino({ level: 'silent' });

    register(): void {
        console.log(`[WhatsAppConector] Inicializando conexión...`);

        this.connectToWhatsApp().catch(err => {
            console.error(`[WhatsAppConector] Error crítico:`, err);
        });

        // Suscribirse a eventos de la plataforma para notificar por WA
        HookRegistry.addAction('on_task_executed', async (data) => {
            if (!this.isConnected || !this.socket) return;

            const targetNumber = process.env.WHATSAPP_TARGET_NUMBER;
            if (!targetNumber) return;

            const formattedNumber = targetNumber.includes('@s.whatsapp.net')
                ? targetNumber
                : `${targetNumber.replace(/\D/g, '')}@s.whatsapp.net`;

            const message = `🚀 *Kolearning - Tarea Completada*\n\n` +
                `📝 *Título:* ${data.title || 'Nueva Tarea'}\n` +
                `💡 *Resumen:* ${data.result?.summary || 'No hay resumen disponible'}\n\n` +
                `_¡Sigue aprendiendo!_`;

            try {
                await this.socket.sendMessage(formattedNumber, { text: message });
            } catch (error) {
                console.error(`[WhatsAppConector] Error enviando notificación:`, error);
            }
        });
    }

    private async connectToWhatsApp() {
        if (!fs.existsSync(this.authDir)) {
            fs.mkdirSync(this.authDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

        this.socket = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: this.logger,
            browser: ['Kolearning', 'Chrome', '1.0.0']
        });

        this.socket.ev.on('creds.update', saveCreds);

        this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('[WhatsAppConector] Nuevo código QR generado.');
                const qrPath = path.join(this.authDir, 'last_qr.png');
                try {
                    await QRCodeImage.toFile(qrPath, qr);
                    console.log(`[WhatsAppConector] QR guardado en: ${qrPath}`);
                } catch (err) {
                    console.error('[WhatsAppConector] Error guardando imagen QR:', err);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.isConnected = false;
                if (shouldReconnect) {
                    this.connectToWhatsApp();
                } else {
                    const qrPath = path.join(this.authDir, 'last_qr.png');
                    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
                }
            } else if (connection === 'open') {
                console.log('[WhatsAppConector] ✅ WhatsApp conectado.');
                this.isConnected = true;
                const qrPath = path.join(this.authDir, 'last_qr.png');
                if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
            }
        });

        // Chat Bidireccional
        this.socket.ev.on('messages.upsert', async (m: any) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (text) {
                console.log(`[WhatsAppConector] Mensaje de ${sender}: ${text}`);

                await this.socket.sendPresenceUpdate('composing', sender);
                await delay(500);

                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/ai/sync-chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: text,
                            userName: msg.pushName || 'Usuario WA',
                            userId: sender.split('@')[0]
                        })
                    });


                    if (response.ok) {
                        const data = await response.json();
                        await this.socket.sendMessage(sender, {
                            text: data.response || "No pude generar una respuesta."
                        });
                    } else {
                        throw new Error("Error en el orquestador.");
                    }

                } catch (error) {
                    console.error("[WhatsAppConector] Error contactando orquestador:", error);
                    await this.socket.sendMessage(sender, { text: "Lo siento, tuve un problema al procesar tu mensaje. Reintenta en un momento." });
                }
            }
        });
    }

    unregister(): void {
        if (this.socket) {
            this.socket.end(undefined);
            this.isConnected = false;
        }
    }
}
