"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ExternalLink, RefreshCw, Folder, FileText } from 'lucide-react';
import { fetchZoteroLibrary, fetchZoteroCollections } from '@/lib/paper-actions';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ZoteroImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (item: any) => void;
}

export function ZoteroImportDialog({ isOpen, onOpenChange, onImport }: ZoteroImportDialogProps) {
    const [userId, setUserId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [step, setStep] = useState<'login' | 'select'>('login');
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('all');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Check origin for security
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'ZOTERO_AUTH_SUCCESS') {
                const { apiKey, userID } = event.data.data;
                setApiKey(apiKey);
                setUserId(userID);
                handleFetchAndProceed(userID, apiKey);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleLogin = () => {
        const width = 600;
        const height = 700;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;

        window.open(
            '/api/auth/zotero/login',
            'ZoteroLogin',
            `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );
    };

    const handleFetchAndProceed = async (uid: string, key: string, collectionId?: string) => {
        setIsLoading(true);
        try {
            const [fetchedCollections, results] = await Promise.all([
                !collections.length ? fetchZoteroCollections(uid, key) : Promise.resolve(collections),
                fetchZoteroLibrary(uid, key, collectionId === 'all' ? undefined : collectionId)
            ]);

            if (!collections.length) setCollections(fetchedCollections);
            setItems(results);
            // Select all by default when loading a new list
            setSelectedItems(new Set(results.map((i: any) => i.id)));
            setStep('select');

            if (!collectionId) {
                toast({
                    title: "Zotero Conectado",
                    description: `Se han encontrado ${results.length} items y ${fetchedCollections.length} colecciones.`,
                });
            }
        } catch (error) {
            toast({
                title: "Error de conexión",
                description: "No se pudieron obtener tus datos de Zotero.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCollectionChange = (value: string) => {
        setSelectedCollection(value);
        handleFetchAndProceed(userId, apiKey, value);
    };

    const toggleItemSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleImportSelected = async () => {
        if (selectedItems.size === 0) return;

        setIsImporting(true);
        const itemsToImport = items.filter(item => selectedItems.has(item.id));

        toast({
            title: "Importación iniciada",
            description: `Agregando ${itemsToImport.length} items a tu Box...`,
        });

        // We process them sequentially or in small batches to avoid overwhelming the state/DB
        for (const item of itemsToImport) {
            await onImport(item);
        }

        toast({
            title: "Importación completada",
            description: `Se importaron ${itemsToImport.length} referencias exitosamente.`,
        });

        setIsImporting(false);
        onOpenChange(false);
        reset();
    };

    const handleImportAll = () => {
        items.forEach(item => onImport(item));
        toast({
            title: "Importación iniciada",
            description: `Agregando ${items.length} items a tu Box...`,
        });
        onOpenChange(false);
        reset();
    };

    const reset = () => {
        setStep('login');
        setItems([]);
        setCollections([]);
        setSelectedItems(new Set());
        setSelectedCollection('all');
        setUserId('');
        setApiKey('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(o) => { if (!isImporting) onOpenChange(o); if (!o && !isImporting) reset(); }}>
            <DialogContent className="sm:max-w-[550px] border-none shadow-2xl p-0 bg-background overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-br from-orange-50 dark:from-orange-500/10 to-background p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <DialogHeader className="mb-6 shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-headline font-bold text-foreground">
                            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                                <svg className="h-6 w-6 text-orange-600 dark:text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M22,5.26c0-0.41-0.34-0.75-0.75-0.75H2.74C2.33,4.52,2,4.86,2,5.26v1.49c0,0.41,0.33,0.75,0.74,0.75h18.52 c0.41,0,0.74-0.33,0.74-0.75V5.26z M3.8,19.48c0,0.41,0.33,0.74,0.74,0.74h14.91c0.41,0,0.74-0.33,0.74-0.74V8.49H3.8V19.48z" /></svg>
                            </div>
                            Sincronizar Zotero
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            Conecta tu biblioteca de Zotero para importar tus referencias de forma segura.
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'login' ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
                                <ExternalLink className="h-8 w-8 text-orange-600 dark:text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Conexión Segura</h3>
                                <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                    Te redirigiremos a Zotero.org para que autorices a Kolearning el acceso a tu biblioteca.
                                </p>
                            </div>
                            <Button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 text-lg font-bold"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Iniciar sesión con Zotero'}
                            </Button>
                        </div>
                    ) : (
                        <div className="py-4 flex flex-col h-full max-h-[60vh]">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-bold">
                                    <div className="p-1 bg-green-100 dark:bg-green-500/20 rounded-full">
                                        <Check className="h-4 w-4" />
                                    </div>
                                    Cuenta Conectada
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setStep('login')} className="h-8 text-xs font-medium" disabled={isImporting || isLoading}>
                                    <RefreshCw className="h-3 w-3 mr-1" /> Cambiar Cuenta
                                </Button>
                            </div>

                            <div className="flex items-center gap-3 mb-4 shrink-0">
                                <Select value={selectedCollection} onValueChange={handleCollectionChange} disabled={isLoading || isImporting}>
                                    <SelectTrigger className="w-full bg-background/50">
                                        <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Seleccionar colección" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toda la biblioteca</SelectItem>
                                        {collections.map(col => (
                                            <SelectItem key={col.id} value={col.id}>{col.name} ({col.numberOfItems})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-muted/30 border border-border/50 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
                                <div className="p-3 border-b border-border/50 bg-muted/50 flex justify-between items-center text-sm font-medium shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedItems.size === items.length && items.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedItems(new Set(items.map(i => i.id)));
                                                } else {
                                                    setSelectedItems(new Set());
                                                }
                                            }}
                                            disabled={isLoading || isImporting || items.length === 0}
                                        />
                                        <span>Seleccionar todos ({items.length})</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">{selectedItems.size} seleccionados</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {isLoading ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                            <p className="text-sm">Obteniendo referencias...</p>
                                        </div>
                                    ) : items.length > 0 ? (
                                        items.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`text-sm p-3 border rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${selectedItems.has(item.id) ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-muted/50'}`}
                                                onClick={() => !isImporting && toggleItemSelection(item.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedItems.has(item.id)}
                                                    onCheckedChange={() => !isImporting && toggleItemSelection(item.id)}
                                                    className="mt-1"
                                                    disabled={isImporting}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground line-clamp-2 leading-tight">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <FileText className="h-3 w-3" />
                                                        <span className="truncate">{item.authors.join(', ')}</span>
                                                        {item.year && <span>• {item.year}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                            <p className="text-sm">No se encontraron artículos en esta colección.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 shrink-0 mt-auto">
                                <Button
                                    onClick={handleImportSelected}
                                    disabled={selectedItems.size === 0 || isLoading || isImporting}
                                    className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold shadow-lg shadow-orange-200"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Importando {selectedItems.size} artículos...
                                        </>
                                    ) : (
                                        `Importar ${selectedItems.size} artículos seleccionados`
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
