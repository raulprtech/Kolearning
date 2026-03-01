"use client";

import React, { useState, useEffect } from "react";
import { useConectores } from "@/contexts/ConectorContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    CheckSquare,
    MessageCircle,
    Send,
    Brain,
    Settings2,
    ShieldCheck,
    Zap,
    ExternalLink,
    Plus,
    Check,
    Search,
    Filter,
    RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

const iconMap: Record<string, any> = {
    Bell,
    CheckSquare,
    MessageCircle,
    Send,
    Brain
};

export default function ConnectorsPage() {
    const { availableConectores, userConectores, toggleConector, isLoading, isConectorEnabled } = useConectores();
    const [searchTerm, setSearchTerm] = useState("");

    if (isLoading) {
        return (
            <div className="container mx-auto p-8 flex justify-center items-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Cargando conectores...</p>
                </div>
            </div>
        );
    }

    const filteredConectores = availableConectores.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(availableConectores.map(p => p.category)));

    return (
        <div className="container mx-auto p-8 max-w-6xl space-y-12">
            <header className="space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                    <Zap className="w-6 h-6 fill-primary" />
                    <span className="font-bold tracking-widest text-xs uppercase">Power-ups</span>
                </div>
                <h1 className="text-4xl font-black font-headline tracking-tight sm:text-5xl">
                    Connectors
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                    Personaliza tu experiencia de aprendizaje activando herramientas y personalidades para Kolearning.
                </p>
            </header>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Busca herramientas o personalidades..."
                    className="pl-10 h-12 text-lg bg-card/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-8 p-1 bg-muted/20 border">
                    <TabsTrigger value="all" className="rounded-lg">Todos</TabsTrigger>
                    {categories.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="rounded-lg">{cat}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConectores.map(conector => (
                            <ConectorCard key={conector.id} conector={conector} />
                        ))}
                    </div>
                </TabsContent>

                {categories.map(cat => (
                    <TabsContent key={cat} value={cat}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredConectores.filter(c => c.category === cat).map(conector => (
                                <ConectorCard key={conector.id} conector={conector} />
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <footer className="mt-20 p-8 rounded-3xl bg-muted/30 border border-dashed flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">¿Necesitas otro conector?</h3>
                    <p className="text-sm text-muted-foreground">Estamos trabajando en integraciones para Notion, Obsidian y Slack.</p>
                </div>
                <Button variant="outline" className="rounded-full px-8">Explorar Roadmap</Button>
            </footer>
        </div>
    );
}

function ConectorCard({ conector }: { conector: any }) {
    const { toggleConector, isConectorEnabled } = useConectores();
    const Icon = iconMap[conector.icon] || Settings2;
    const isEnabled = isConectorEnabled(conector.id);

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2",
                isEnabled ? "border-primary/20 bg-primary/5" : "border-transparent bg-card"
            )}
        >
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className={cn(
                        "p-3 rounded-2xl transition-colors duration-300",
                        isEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {isEnabled ? 'On' : 'Off'}
                        </span>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => toggleConector(conector.id, checked)}
                        />
                    </div>
                </div>
                <CardTitle className="text-xl font-bold mt-4">{conector.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
                    {conector.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter bg-background/50">
                        {conector.category}
                    </Badge>
                    {isEnabled && (
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter gap-1">
                            <ShieldCheck className="w-3 h-3" /> Activo
                        </Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                {conector.id === 'whatsapp_sync' ? (
                    <WhatsAppConfigModal conector={conector} isEnabled={isEnabled} />
                ) : (
                    <Button variant="ghost" size="sm" className="w-full justify-between group mt-2" disabled={!isEnabled}>
                        Configurar {conector.name}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                )}
            </CardFooter>

            {/* Premium background accent */}
            {isEnabled && (
                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
            )}
        </Card>
    );
}

function WhatsAppConfigModal({ conector, isEnabled }: { conector: any, isEnabled: boolean }) {
    const [qrValue, setQrValue] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [status, setStatus] = useState<{ connected: boolean; hasQr: boolean }>({ connected: false, hasQr: false });

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/conector/whatsapp/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                if (data.hasQr) {
                    setQrValue(`/api/conector/whatsapp/qr?t=${Date.now()}`);
                } else {
                    setQrValue(null);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isEnabled) {
            checkStatus();
            interval = setInterval(checkStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [isEnabled]);

    const handleOpen = (open: boolean) => {
        if (open) {
            setIsChecking(true);
            checkStatus().finally(() => setIsChecking(false));
        }
    };

    return (
        <Dialog onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between group mt-2" disabled={!isEnabled}>
                    Configurar WhatsApp
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        Vincular WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        Escanea el código QR desde tu WhatsApp móvil para conectar.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-3xl border-2 border-dashed border-primary/20 min-h-[350px]">
                    {status.connected ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold">¡Conectado!</h3>
                            <p className="text-sm text-muted-foreground">Kolearning ya está listo para chatear contigo por WhatsApp.</p>
                        </div>
                    ) : qrValue ? (
                        <div className="space-y-4 text-center">
                            <div className="relative group">
                                <img src={qrValue} alt="WA QR Code" className="w-64 h-64 rounded-2xl shadow-2xl border-4 border-background transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none" />
                            </div>
                            <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-medium uppercase tracking-widest">Esperando escaneo...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-center py-8">
                            <div className={cn("p-4 bg-muted/50 rounded-full", isChecking && "animate-spin")}>
                                <RefreshCcw className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground max-w-[200px]">
                                {isChecking ? "Generando código QR..." : "Asegúrate de que el conector esté activo para generar el QR."}
                            </p>
                            {!isChecking && <Button variant="outline" size="sm" onClick={checkStatus}>Reintentar</Button>}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <div className="bg-primary/5 p-4 rounded-2xl w-full">
                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Instrucciones rápidas:</p>
                        <ol className="text-[12px] text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Ve a WhatsApp {">"} Dispositivos vinculados</li>
                            <li>Toca "Vincular un dispositivo"</li>
                            <li>Apunta tu cámara a este código</li>
                        </ol>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
