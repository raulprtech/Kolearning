"use client";

import React, { useState } from 'react';
import { Library, Plus, Search as SearchIcon, Upload, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdvancedDataSearch } from './AdvancedDataSearch';
import { SearchResult } from '@/lib/paper-utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface DataBoxHeaderProps {
    paperCount: number;
    onSearchResult: (result: SearchResult) => void;
    onOpenManualAdd: () => void;
}

export function DataBoxHeader({ paperCount, onSearchResult, onOpenManualAdd }: DataBoxHeaderProps) {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    return (
        <div className="p-8 border-b border-border bg-gradient-to-b from-card/50 to-background shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-2xl shadow-inner group">
                        <Library className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-headline font-bold tracking-tight">Caja de Datos</h1>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span>{paperCount} documentos en tu caja</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex bg-muted/30 p-1 rounded-xl border border-border/50 mr-4">
                        <Button variant="ghost" size="sm" className="bg-background shadow-sm rounded-lg px-4 text-xs font-bold">
                            Biblioteca
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-lg px-4 text-xs">
                            Colecciones
                        </Button>
                    </div>

                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 h-11 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Plus className="h-5 w-5" />
                                Agregar Datos
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-none shadow-2xl">
                            <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
                                <DialogHeader className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <SearchIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <DialogTitle className="text-2xl font-headline font-bold">Importar a tu Caja de Datos</DialogTitle>
                                    </div>
                                    <DialogDescription className="text-base">
                                        Busca por título o DOI, importa archivos BibTeX o conecta tu cuenta de Zotero.
                                    </DialogDescription>
                                </DialogHeader>

                                <AdvancedDataSearch onAddPaper={(res) => {
                                    onSearchResult(res);
                                    // Optionally close modal after add? 
                                    // Usually research tools allow adding multiple, so we keep it open.
                                }} />

                                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                        <Upload className="h-3 w-3" />
                                        También puedes arrastrar documentos directamente a la biblioteca
                                    </p>
                                    <Button variant="link" size="sm" onClick={() => {
                                        setIsSearchModalOpen(false);
                                        onOpenManualAdd();
                                    }} className="text-primary font-bold text-xs p-0 h-auto">
                                        Prefiero agregar los detalles manualmente
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
