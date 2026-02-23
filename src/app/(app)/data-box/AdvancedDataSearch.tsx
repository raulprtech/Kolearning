"use client";

import React, { useState, useCallback } from 'react';
import { Search, Loader2, Upload, BookOpen, AlertCircle, Check, Download, ExternalLink } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchPapers, SearchResult } from '@/lib/paper-utils';
import { uploadLocalPdf } from '@/lib/paper-actions';
import { useToast } from '@/hooks/use-toast';
import { ZoteroImportDialog } from './ZoteroImportDialog';

interface AdvancedDataSearchProps {
    onAddPaper: (paper: any) => void;
    onPrefillManual?: (paper: any) => void;
}

export function AdvancedDataSearch({ onAddPaper, onPrefillManual }: AdvancedDataSearchProps) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [searchInitiated, setSearchInitiated] = useState(false);
    const [isZoteroOpen, setIsZoteroOpen] = useState(false);

    // Plugin-like configuration
    const [enabledSources, setEnabledSources] = useState({
        semanticScholar: true,
        zotero: true,
        bibtex: true,
        arxiv: true
    });

    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const toggleSource = (source: keyof typeof enabledSources) => {
        setEnabledSources(prev => ({ ...prev, [source]: !prev[source] }));
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        setSearchInitiated(true);
        try {
            const searchResults = await searchPapers(query);
            setResults(searchResults);
        } catch (error) {
            toast({
                title: "Error de búsqueda",
                description: "No se pudieron obtener resultados de Semantic Scholar.",
                variant: "destructive",
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const parseBibTeX = (content: string): Partial<SearchResult>[] => {
        const entries = content.split(/@\w+\s*{/);
        const results: Partial<SearchResult>[] = [];

        for (let i = 1; i < entries.length; i++) {
            const entry = entries[i];
            const titleMatch = entry.match(/title\s*=\s*[{"](.+?)[}"]/i);
            const authorMatch = entry.match(/author\s*=\s*[{"](.+?)[}"]/i);
            const yearMatch = entry.match(/year\s*=\s*[{"]?(\d{4})["]?/i);
            const doiMatch = entry.match(/doi\s*=\s*[{"](.+?)[}"]/i);
            const journalMatch = entry.match(/(journal|conference|booktitle)\s*=\s*[{"](.+?)[}"]/i);

            if (titleMatch) {
                results.push({
                    title: titleMatch[1],
                    authors: authorMatch ? authorMatch[1].split(/\s+and\s+/i).map(a => a.trim()) : [],
                    year: yearMatch ? parseInt(yearMatch[1]) : null,
                    doi: doiMatch ? doiMatch[1] : null,
                    venue: journalMatch ? journalMatch[2] : undefined,
                    url: null,
                    pdfUrl: null
                });
            }
        }
        return results;
    };

    const processFiles = useCallback(async (files: File[]) => {
        const pdfFile = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
        const bibFile = files.find(f => f.name.toLowerCase().endsWith('.bib'));

        if (pdfFile) {
            toast({
                title: "Subiendo PDF",
                description: `Preparando "${pdfFile.name}"...`,
            });
            setIsSearching(true);
            try {
                const formData = new FormData();
                formData.append('file', pdfFile);
                const uploadedUrl = await uploadLocalPdf(formData);

                toast({
                    title: "PDF Subido",
                    description: "Por favor, añade los detalles del artículo.",
                });

                const pdfData = {
                    title: pdfFile.name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
                    authors: [],
                    year: new Date().getFullYear(),
                    doi: null,
                    venue: undefined,
                    url: null,
                    pdfUrl: uploadedUrl
                };

                if (onPrefillManual) {
                    onPrefillManual(pdfData);
                } else {
                    onAddPaper(pdfData);
                }
            } catch (error) {
                toast({
                    title: "Error al subir PDF",
                    description: "No se pudo subir el archivo.",
                    variant: "destructive",
                });
            } finally {
                setIsSearching(false);
            }
        } else if (bibFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const parsedResults = parseBibTeX(content);

                if (parsedResults.length > 0) {
                    toast({
                        title: "Importación BibTeX",
                        description: `Se detectó ${parsedResults.length} referencia(s).`,
                    });

                    if (onPrefillManual && parsedResults.length === 1) {
                        onPrefillManual(parsedResults[0]);
                    } else if (onPrefillManual && parsedResults.length > 1) {
                        onPrefillManual(parsedResults[0]);
                        toast({
                            title: "Múltiples referencias",
                            description: "Solamente se preparó el primer artículo para la captura manual.",
                        });
                    } else {
                        parsedResults.forEach(paper => {
                            onAddPaper(paper);
                        });
                    }
                } else {
                    toast({
                        title: "Error de importación",
                        description: "No se encontraron entradas válidas en el archivo .bib",
                        variant: "destructive"
                    });
                }
            };
            reader.readAsText(bibFile);
        } else {
            toast({
                title: "Archivo no válido",
                description: "Por favor sube un archivo PDF o .bib",
                variant: "destructive",
            });
        }
    }, [toast, onAddPaper, onPrefillManual]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        await processFiles(files);
    }, [processFiles]);

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            await processFiles(files);
            // Reset input so the same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [processFiles]);

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row gap-2 items-center">
                <div className="relative flex-1 w-full group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    {enabledSources.semanticScholar ? (
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Buscar en la biblioteca global..."
                            className="pl-10 h-12 bg-black text-white placeholder:text-gray-400 rounded-full border-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                    ) : (
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Búsqueda desactivada (activa Semantic Scholar)"
                            disabled
                            className="pl-10 h-12 bg-muted/50 text-muted-foreground rounded-full border-none"
                        />
                    )}
                    <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !enabledSources.semanticScholar}
                            className="rounded-full bg-[#C8B6FF] hover:bg-[#B8A6EF] text-black h-9 px-6 font-medium"
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Buscar'}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2">
                    {enabledSources.zotero && (
                        <Button
                            variant="outline"
                            onClick={() => setIsZoteroOpen(true)}
                            className="rounded-full h-10 gap-2 border-border/50 hover:bg-muted text-sm px-4 text-orange-600 border-orange-200 bg-orange-50/30 transition-all active:scale-95"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22,5.26c0-0.41-0.34-0.75-0.75-0.75H2.74C2.33,4.52,2,4.86,2,5.26v1.49c0,0.41,0.33,0.75,0.74,0.75h18.52 c0.41,0,0.74-0.33,0.74-0.75V5.26z M3.8,19.48c0,0.41,0.33,0.74,0.74,0.74h14.91c0.41,0,0.74-0.33,0.74-0.74V8.49H3.8V19.48z" /></svg>
                            Zotero
                        </Button>
                    )}
                </div>
            </div>

            <ZoteroImportDialog
                isOpen={isZoteroOpen}
                onOpenChange={setIsZoteroOpen}
                onImport={(item) => {
                    onAddPaper({
                        title: item.title,
                        authors: item.authors,
                        year: item.year?.toString() || new Date().getFullYear().toString(),
                        doi: item.doi || '',
                        venue: item.venue || '',
                        url: item.url || '',
                        abstract: item.abstract || '',
                        pdfUrl: null,
                        importSource: 'Zotero'
                    });
                }}
            />

            <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/50">
                <span className="font-bold mr-2">Fuentes:</span>
                <Badge
                    variant={enabledSources.semanticScholar ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSource('semanticScholar')}
                >
                    Semantic Scholar {enabledSources.semanticScholar ? 'ON' : 'OFF'}
                </Badge>
                <Badge
                    variant={enabledSources.zotero ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSource('zotero')}
                >
                    Zotero {enabledSources.zotero ? 'ON' : 'OFF'}
                </Badge>
                <Badge
                    variant={enabledSources.arxiv ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSource('arxiv')}
                >
                    ArXiv {enabledSources.arxiv ? 'ON' : 'OFF'}
                </Badge>
                <Badge
                    variant="secondary"
                    className="cursor-not-allowed opacity-70"
                >
                    Carga Manual (Obligatorio)
                </Badge>
            </div>

            <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-2 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent py-1">
                Busca nuevos artículos usando palabras clave / títulos
            </p>

            {/* BibTeX Dropzone */}
            {!searchInitiated && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        mt-8 border-2 border-dashed rounded-2xl p-12 transition-all duration-300
                        flex flex-col items-center justify-center gap-4 group cursor-pointer
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/30 hover:bg-muted/50'}
                    `}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileInput}
                        accept=".pdf,.bib"
                    />
                    <div className={`p-4 rounded-full transition-transform duration-300 ${isDragging ? 'scale-110 bg-primary/20' : 'bg-muted group-hover:scale-105'}`}>
                        <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium">Arrastra y suelta un documento para agregarlo</p>
                        <p className="text-sm text-muted-foreground">También puedes soltar un archivo BibTeX para importar múltiples referencias</p>
                    </div>
                </div>
            )}

            {/* Search Results */}
            {searchInitiated && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isSearching ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="animate-pulse bg-muted/20 border-border/50">
                                <CardContent className="p-4 space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                    <div className="h-3 bg-muted rounded w-1/4" />
                                </CardContent>
                            </Card>
                        ))
                    ) : results.length > 0 ? (
                        results.map((paper, idx) => (
                            <Card key={idx} className="group overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-4 flex flex-col h-full">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{paper.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{paper.authors.join(', ')}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {paper.year && <Badge variant="secondary" className="text-[10px] py-0">{paper.year}</Badge>}
                                            {paper.venue && <Badge variant="outline" className="text-[10px] py-0 max-w-[150px] truncate">{paper.venue}</Badge>}
                                            {paper.pdfUrl && <Badge className="text-[10px] py-0 bg-green-100 text-green-700 hover:bg-green-100 flex gap-1 items-center italic"> <Check className="h-2 w-2" /> PDF disponible</Badge>}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {paper.url && (
                                                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-full transition-colors">
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                </a>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => onAddPaper(paper)}
                                            className="rounded-full gap-2 transition-transform active:scale-95"
                                        >
                                            {paper.pdfUrl ? <Download className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                            Añadir a la Caja
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center space-y-4 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                            <div className="bg-muted p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                                <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">No se encontraron resultados</p>
                                <p className="text-sm text-muted-foreground">Prueba con diferentes palabras clave o un DOI</p>
                            </div>
                            <Button variant="ghost" onClick={() => setSearchInitiated(false)}>Limpiar búsqueda</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const Plus = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
