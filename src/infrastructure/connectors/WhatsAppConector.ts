import { ConectorMetadata } from '../../core/domain/models/conector';
import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { BaseConector } from '../../core/sdk/ConectorSDK';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    ConnectionState,
    delay,
    Browsers,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import * as fs from 'fs';
import pino from 'pino';
import * as QRCodeImage from 'qrcode';

export class WhatsAppConector extends BaseConector {
    public metadata: ConectorMetadata = {
        id: 'whatsapp_sync',
        name: 'WhatsApp Sync',
        description: 'Recibe tus resultados y chatea con Kolearning por WhatsApp.',
        icon: 'MessageCircle',
        version: '1.2.0',
        author: 'Kolearning Team',
        category: 'Conectores de Canal'
    };

    private socket: any = null;
    public isConnected: boolean = false;
    private authDir: string = path.join(process.cwd(), '.whatsapp_auth');
    private logger: any;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isConnecting: boolean = false;

    public get isActive(): boolean {
        return this.isConnected && this.socket !== null;
    }

    constructor() {
        super();
        try {
            this.logger = pino({ level: 'info' });
        } catch (e) {
            console.warn('[WhatsAppConector] Pino fallback a console logger');
            this.logger = { info: console.log, error: console.error, warn: console.warn, debug: console.log, silent: false };
        }
    }

    register(): void {
        console.log(`[WhatsAppConector] --- REGISTRO DE CONECTOR ---`);

        // Siempre intentar conectar si no lo está (idempotente)
        this.connectToWhatsApp().catch(err => {
            console.error(`[WhatsAppConector] Error en conexión:`, err);
        });

        // Asegurar hooks de integración (idempotente gracias a HookRegistry)
        this.initializeHooks();

        // Si ya tenemos un socket, asegurar que tiene sus listeners (Baileys ev.on es acumulativo, 
        // pero Baileys suele manejar sus propios eventos internos. Aquí solo añadimos los nuestros)
        if (this.socket) {
            this.setupSocketListeners();
        }
    }

    private initializeHooks() {
        console.log(`[WhatsAppConector] Configurando hooks en HookRegistry...`);

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

        // Mirror de mensajes del chat web a WhatsApp
        HookRegistry.addAction('on_assistant_message', async (data) => {
            if (!this.isConnected || !this.socket) return;

            let target = process.env.WHATSAPP_TARGET_NUMBER;
            if (!target && this.socket.user) {
                target = this.socket.user.id.split(':')[0];
            }

            if (!target) return;

            const formattedNumber = target.includes('@s.whatsapp.net')
                ? target
                : `${target.replace(/\D/g, '')}@s.whatsapp.net`;

            try {
                await this.socket.sendMessage(formattedNumber, {
                    text: `🆕 *Kolearning Web:*\n\n${data.message}`
                });
            } catch (error) {
                console.error(`[WhatsAppConector] Error en mirror de mensaje:`, error);
            }
        });
    }

    private async connectToWhatsApp() {
        if (this.isConnecting || this.isConnected) {
            console.log(`[WhatsAppConector] Ya hay una conexión en curso o activa. Omitiendo.`);
            return;
        }

        console.log(`[WhatsAppConector] --- INICIANDO CONNECT TO WHATSAPP ---`);
        this.isConnecting = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (!fs.existsSync(this.authDir)) {
            fs.mkdirSync(this.authDir, { recursive: true });
        }

        console.log(`[WhatsAppConector] Cargando AuthState desde: ${this.authDir}`);
        const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

        console.log(`[WhatsAppConector] Obteniendo versión de WhatsApp Web...`);
        let version: [number, number, number] = [2, 3000, 1015901307]; // Fallback
        try {
            const latest = await fetchLatestBaileysVersion();
            version = latest.version;
            console.log(`[WhatsAppConector] ✅ Versión obtenida: v${version.join('.')}`);
        } catch (err) {
            console.warn(`[WhatsAppConector] ⚠️ Error obteniendo versión, usando fallback: v${version.join('.')}`);
        }

        console.log(`[WhatsAppConector] Iniciando Socket...`);
        this.socket = makeWASocket({
            version,
            auth: state,
            logger: this.logger,
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '110.0.5563.147'],
            syncFullHistory: false
        });

        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        if (!this.socket) return;
        console.log(`[WhatsAppConector] Configurando listeners de socket...`);

        this.socket.ev.on('creds.update', () => {
            console.log('[WhatsAppConector] 💾 Credenciales actualizadas');
            // useMultiFileAuthState lo maneja automáticamente si se pasó el saveCreds correcto
        });


        this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection) {
                console.log(`[WhatsAppConector] Estado de conexión: ${connection}`);
                if (lastDisconnect?.error) {
                    const error = (lastDisconnect.error as Boom);
                    console.error(`[WhatsAppConector] ❌ Desconexión detectada:`, error.message, error.output?.statusCode);
                }
            }

            if (qr) {
                console.log(`[WhatsAppConector] >>>> NUEVO QR RECIBIDO <<<<`);
                const qrPath = path.join(this.authDir, 'last_qr.png');
                try {
                    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
                    await QRCodeImage.toFile(qrPath, qr);
                    console.log(`[WhatsAppConector] ✅ QR guardado exitosamente.`);
                } catch (err) {
                    console.error('[WhatsAppConector] ❌ Error guardando imagen QR:', err);
                }
            }

            if (connection === 'close') {
                const disconnectError = lastDisconnect?.error as Boom;
                const statusCode = disconnectError?.output?.statusCode;
                const shouldReconnect = statusCode !== 401;

                this.isConnected = false;

                if (shouldReconnect) {
                    if (statusCode === 440 || statusCode === 401) {
                        this.unregister();
                        this.reconnectTimeout = setTimeout(() => {
                            this.isConnecting = false;
                            this.connectToWhatsApp();
                        }, 5000);
                    } else if (statusCode === 405) {
                        const qrPath = path.join(this.authDir, 'last_qr.png');
                        if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
                        try {
                            if (fs.existsSync(path.join(this.authDir, 'creds.json'))) {
                                fs.unlinkSync(path.join(this.authDir, 'creds.json'));
                            }
                        } catch (e) { }
                        this.reconnectTimeout = setTimeout(() => this.connectToWhatsApp(), 10000);
                    } else {
                        this.reconnectTimeout = setTimeout(() => this.connectToWhatsApp(), 5000);
                    }
                }
            } else if (connection === 'open') {
                console.log('[WhatsAppConector] ✅ WhatsApp conectado.');
                this.isConnected = true;
                this.isConnecting = false;
                const qrPath = path.join(this.authDir, 'last_qr.png');
                if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
            }
        });

        // Chat Bidireccional
        this.socket.ev.on('messages.upsert', async (m: any) => {
            console.log(`[WhatsAppConector] 📥 Evento messages.upsert recibido: ${m.messages.length} mensajes.`);
            const msg = m.messages[0];

            if (!msg.message) return;
            if (msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (text) {
                console.log(`[WhatsAppConector] 💬 Mensaje de ${sender}: "${text}"`);
                await this.socket.sendPresenceUpdate('composing', sender);
                await delay(500);

                try {
                    const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/ai/sync-chat`;
                    const response = await fetch(syncUrl, {
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
                    }
                } catch (error) {
                    console.error("[WhatsAppConector] Error contactando orquestador:", error);
                }
            }
        });
    }

    unregister(): void {
        console.log(`[WhatsAppConector] Unregister llamado. Destruyendo socket...`);
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.socket) {
            try { this.socket.end(undefined); } catch (e) { }
            try { this.socket.ws.close(); } catch (e) { }
            this.socket = null;
        }
        this.isConnected = false;
    }
}
