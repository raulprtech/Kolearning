"use client";

import React, { useState, useMemo } from 'react';
import { useProjects, Paper, ReadingStatus, PaperPriority, PaperStatus, PDFStatus, ImportSource } from '@/contexts/ProjectContext';
import {
    Library,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    ExternalLink,
    BookOpen,
    Clock,
    CheckCircle2,
    FileText,
    Tag,
    Calendar,
    User,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { AdvancedPaperSearch } from "./AdvancedPaperSearch";
import { Search as SearchIcon, Upload } from 'lucide-react';
import { SearchResult } from "@/lib/paper-utils";
import { downloadAndStorePdf, uploadLocalPdf } from '@/lib/paper-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const PaperBoxPage = () => {
    const { toast } = useToast();
    const { papers, isLoading, projects, updatePaper, deletePaper, addPaper, classifyPaper } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaperStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<PaperPriority | 'all'>('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
    const fileInputRefUploadMissing = React.useRef<HTMLInputElement>(null);
    const [uploadingPdfForPaper, setUploadingPdfForPaper] = useState<string | null>(null);

    const parsePaperUrl = (url?: string) => {
        if (!url) return { externalUrl: null, pdfUrl: null };
        if (url.includes('|')) {
            const [external, pdf] = url.split('|');
            return { externalUrl: external || null, pdfUrl: pdf || null };
        }
        if (url.includes('supabase.co')) {
            return { externalUrl: null, pdfUrl: url };
        }
        return { externalUrl: url, pdfUrl: null };
    };

    const handleUploadMissingPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !uploadingPdfForPaper) return;
        try {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            toast({ title: 'Subiendo PDF...', description: 'Acá se subirá el archivo, asegúrate de crear el bucket source-documents primero si ves errores.' });

            const uploadedUrl = await uploadLocalPdf(formData);
            if (uploadedUrl) {
                const paper = papers.find(p => p.id === uploadingPdfForPaper);
                if (paper) {
                    const { externalUrl } = parsePaperUrl(paper.url);
                    const newUrl = [externalUrl || '', uploadedUrl].join('|');
                    await updatePaper(paper.id, { url: newUrl, pdfStatus: 'available' });
                    toast({ title: 'PDF Subido', description: 'El archivo se ha subido correctamente.' });
                }
            } else {
                toast({ title: 'Error de Storage', description: 'El PDF no se guardó. (Asegúrate de que el bucket "source-documents" existe en Supabase)', variant: 'destructive' });
            }
        } catch (error) {
            console.error("Error subiendo PDF:", error);
            toast({ title: 'Error', description: 'Hubo un error inesperado al subir el PDF.', variant: 'destructive' });
        } finally {
            setUploadingPdfForPaper(null);
            if (fileInputRefUploadMissing.current) fileInputRefUploadMissing.current.value = '';
        }
    };

    // Form state for new paper
    const [newPaper, setNewPaper] = useState({
        title: '',
        authors: '',
        year: new Date().getFullYear().toString(),
        doi: '',
        journalConference: '',
        url: '',
        notes: '',
        priority: 'medium' as PaperPriority,
        tags: '',
        pdfUrl: ''
    });

    const handleSearchResult = async (result: SearchResult & { importSource?: ImportSource }) => {
        try {
            let finalPdfUrl: string | undefined = result.pdfUrl || undefined;
            let currentPdfStatus: PDFStatus = result.pdfUrl ? 'available' : 'not_available';

            if (result.pdfUrl) {
                toast({
                    title: "Descargando PDF",
                    description: "Se ha encontrado una versión gratuita. Guardándola en tu Box...",
                });
                const storedUrl = await downloadAndStorePdf(result.pdfUrl, result.title);
                if (storedUrl) {
                    finalPdfUrl = storedUrl;
                    currentPdfStatus = 'available';
                } else {
                    currentPdfStatus = 'not_available'; // If download failed
                }
            }

            console.log("Adding paper with data:", { result, currentPdfStatus, finalPdfUrl });

            const combinedSearchUrl = [result.url || '', finalPdfUrl || ''].join('|');

            await addPaper({
                title: result.title || 'Sin Título',
                authors: Array.isArray(result.authors) ? result.authors : [],
                year: result.year ? parseInt(result.year.toString()) : undefined,
                doi: result.doi || undefined,
                journalConference: result.venue || undefined,
                url: combinedSearchUrl === '|' ? undefined : combinedSearchUrl,
                pdfStatus: currentPdfStatus,
                importSource: result.importSource === 'Zotero' ? 'manual' : (result.importSource || 'ArXiv'),
                status: 'in_box',
                processingPercentage: 0,
                tags: [],
                readingStatus: 'unread',
                notes: result.abstract || undefined,
                priority: 'medium',
                projectId: undefined
            });

            toast({
                title: "Paper agregado",
                description: `"${result.title}" se ha añadido a tu Box${finalPdfUrl ? ' con su PDF' : ''}.`,
            });
        } catch (error) {
            console.error("Error adding search result:", error);
        }
    };

    const handleAddPaper = async () => {
        try {
            toast({ title: 'Guardando paper...', description: 'Por favor espera.' });

            const authorsArray = (newPaper.authors || '').split(',').map(a => a.trim()).filter(a => a !== '');
            const tagsArray = (newPaper.tags || '').split(',').map(t => t.trim()).filter(t => t !== '');

            const combinedManualUrl = [newPaper.url || '', newPaper.pdfUrl || ''].join('|');

            await addPaper({
                title: newPaper.title || 'Sin Título',
                authors: authorsArray,
                year: parseInt(String(newPaper.year)) || undefined,
                doi: newPaper.doi || undefined,
                journalConference: newPaper.journalConference || undefined,
                url: combinedManualUrl === '|' ? undefined : combinedManualUrl,
                pdfStatus: newPaper.pdfUrl ? 'available' : 'pending',
                importSource: 'manual',
                status: 'in_box',
                processingPercentage: 0,
                tags: tagsArray,
                readingStatus: 'unread',
                notes: newPaper.notes || undefined,
                priority: newPaper.priority || 'medium',
                projectId: undefined
            });

            setIsAddDialogOpen(false);
            setNewPaper({
                title: '',
                authors: '',
                year: new Date().getFullYear().toString(),
                doi: '',
                journalConference: '',
                url: '',
                notes: '',
                priority: 'medium',
                tags: '',
                pdfUrl: ''
            });
        } catch (error) {
            console.error("Local error in handleAddPaper:", error);
            toast({
                title: 'Error local',
                description: error instanceof Error ? error.message : String(error),
                variant: 'destructive'
            });
        }
    };

    const handleAssignToProject = async (projectId: string) => {
        if (!selectedPaperId) return;
        try {
            await updatePaper(selectedPaperId, { projectId, status: 'assigned' });
            setIsAssignDialogOpen(false);
            setSelectedPaperId(null);
            toast({
                title: "Paper asignado",
                description: "El paper ha sido vinculado al proyecto correctamente.",
            });
        } catch (error) {
            // Toast in context
        }
    };

    const filteredPapers = useMemo(() => {
        return papers.filter(paper => {
            const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || paper.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || paper.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [papers, searchQuery, statusFilter, priorityFilter]);

    const getStatusBadge = (status: PaperStatus) => {
        switch (status) {
            case 'in_box': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">En Box</Badge>;
            case 'assigned': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">Asignado</Badge>;
            case 'processing': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 animate-pulse">Procesando</Badge>;
            case 'ready': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Listo</Badge>;
            default: return null;
        }
    };

    const getPriorityColor = (priority: PaperPriority) => {
        switch (priority) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-orange-500';
            case 'low': return 'text-blue-500';
        }
    };

    const getPriorityLabel = (priority: PaperPriority) => {
        switch (priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Media';
            case 'low': return 'Baja';
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando tu Paper Box...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background/50 overflow-hidden">
            <input
                type="file"
                ref={fileInputRefUploadMissing}
                className="hidden"
                accept=".pdf"
                onChange={handleUploadMissingPdf}
            />
            <div className="flex flex-col sm:flex-row gap-4 px-8 py-4 bg-muted/20 border-b border-border/50 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrar mi biblioteca..."
                        className="pl-9 bg-background/50 border-none shadow-none focus-visible:ring-1 h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="w-40 bg-background/50 border-none shadow-none h-11">
                            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="in_box">En Box</SelectItem>
                            <SelectItem value="assigned">Asignado</SelectItem>
                            <SelectItem value="processing">Procesando</SelectItem>
                            <SelectItem value="ready">Listo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                        <SelectTrigger className="w-40 bg-background/50 border-none shadow-none h-11">
                            <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                    </Select>

                    <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 h-11 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Plus className="h-5 w-5" />
                                Agregar Paper
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-none shadow-2xl">
                            <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 overflow-y-auto max-h-[90vh]">
                                <DialogHeader className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <SearchIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <DialogTitle className="text-2xl font-headline font-bold text-foreground">Importar a tu Paper Box</DialogTitle>
                                    </div>
                                    <DialogDescription className="text-base">
                                        Busca por título o DOI, importa archivos BibTeX o conecta tu cuenta de Zotero.
                                    </DialogDescription>
                                </DialogHeader>

                                <AdvancedPaperSearch
                                    onAddPaper={(res) => {
                                        handleSearchResult(res);
                                    }}
                                    onPrefillManual={(data) => {
                                        setNewPaper({
                                            title: data.title || '',
                                            authors: data.authors?.join(', ') || '',
                                            year: data.year?.toString() || new Date().getFullYear().toString(),
                                            doi: data.doi || '',
                                            journalConference: data.venue || '',
                                            url: data.url || '',
                                            notes: data.abstract || '',
                                            priority: 'medium',
                                            tags: '',
                                            pdfUrl: data.pdfUrl || ''
                                        });
                                        setIsSearchModalOpen(false);
                                        setIsAddDialogOpen(true);
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Manual Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[525px] overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Agregar nuevo paper</DialogTitle>
                        <DialogDescription>
                            Ingresa los detalles del paper manualmente o impórtalo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" value={newPaper.title} onChange={e => setNewPaper({ ...newPaper, title: e.target.value })} placeholder="Quantum Computing for Beginners" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="authors">Autores (separados por coma)</Label>
                            <Input id="authors" value={newPaper.authors} onChange={e => setNewPaper({ ...newPaper, authors: e.target.value })} placeholder="John Doe, Jane Smith" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="year">Año</Label>
                                <Input id="year" type="number" value={newPaper.year} onChange={e => setNewPaper({ ...newPaper, year: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Prioridad</Label>
                                <Select value={newPaper.priority} onValueChange={(v) => setNewPaper({ ...newPaper, priority: v as PaperPriority })}>
                                    <SelectTrigger id="priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="medium">Media</SelectItem>
                                        <SelectItem value="low">Baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="doi">DOI (opcional)</Label>
                            <Input id="doi" value={newPaper.doi} onChange={e => setNewPaper({ ...newPaper, doi: e.target.value })} placeholder="10.1000/xyz123" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="journal">Revista / Conferencia</Label>
                            <Input id="journal" value={newPaper.journalConference} onChange={e => setNewPaper({ ...newPaper, journalConference: e.target.value })} placeholder="Nature, ICML, etc." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                            <Input id="tags" value={newPaper.tags} onChange={e => setNewPaper({ ...newPaper, tags: e.target.value })} placeholder="AI, Physics, Survey" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notas / Resumen inicial</Label>
                            <Textarea id="notes" value={newPaper.notes} onChange={e => setNewPaper({ ...newPaper, notes: e.target.value })} placeholder="Un breve resumen de por qué este paper es importante..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddPaper} disabled={!newPaper.title}>Guardar Paper</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign to Project Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar a Proyecto</DialogTitle>
                        <DialogDescription>
                            Selecciona a qué proyecto deseas vincular este artículo científico.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Proyectos Disponibles</Label>
                            <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                                {projects.length > 0 ? (
                                    projects.map(project => (
                                        <Button
                                            key={project.id}
                                            variant="outline"
                                            className="justify-start h-12 gap-3"
                                            onClick={() => handleAssignToProject(project.id)}
                                        >
                                            <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                                                {project.title[0]}
                                            </Badge>
                                            <div className="text-left overflow-hidden">
                                                <div className="font-bold truncate">{project.title}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{project.atoms.length} átomos</div>
                                            </div>
                                        </Button>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                                        No tienes proyectos activos. Crea uno primero.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto flex flex-col gap-4">
                    {filteredPapers.length > 0 ? (
                        filteredPapers.map(paper => (
                            <Card key={paper.id} className="group hover:border-primary transition-all overflow-hidden bg-card/40 backdrop-blur-sm">
                                <CardContent className="p-0">
                                    <div className="flex h-full">
                                        {/* Status vertical bar */}
                                        <div className={`w-1 shrink-0 ${paper.status === 'ready' ? 'bg-green-500' :
                                            paper.status === 'processing' ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                            }`} />

                                        <div className="flex-1 p-6">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-muted-foreground">{paper.authors[0]}{paper.authors.length > 1 ? ', et al.' : ''}, {paper.year}</span>
                                                        {getStatusBadge(paper.status)}
                                                        {paper.priority === 'high' && <Badge variant="destructive" className="text-[10px] py-0 px-1">Urgente</Badge>}
                                                    </div>
                                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors leading-tight">{paper.title}</h3>
                                                    {paper.journalConference && (
                                                        <p className="text-sm italic text-muted-foreground mt-1">{paper.journalConference}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {(() => {
                                                        const { externalUrl, pdfUrl } = parsePaperUrl(paper.url);
                                                        return (
                                                            <>
                                                                {externalUrl && (
                                                                    <a href={externalUrl} target="_blank" rel="noopener noreferrer" title="Enlace original" className="hover:bg-muted p-2 rounded-full transition-colors flex items-center justify-center">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </a>
                                                                )}
                                                                {(pdfUrl || paper.pdfStatus === 'available') ? (
                                                                    <a href={pdfUrl || paper.url} target="_blank" rel="noopener noreferrer" title="Ver PDF" className="hover:bg-green-50 p-2 rounded-full transition-colors text-green-600 flex items-center justify-center">
                                                                        <FileText className="h-4 w-4" />
                                                                    </a>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1 px-2 transition-all active:scale-95"
                                                                        onClick={() => {
                                                                            setUploadingPdfForPaper(paper.id);
                                                                            fileInputRefUploadMissing.current?.click();
                                                                        }}
                                                                        disabled={uploadingPdfForPaper === paper.id}
                                                                        title="Cargar PDF asociado"
                                                                    >
                                                                        {uploadingPdfForPaper === paper.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                                                        Subir PDF
                                                                    </Button>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => updatePaper(paper.id, { readingStatus: 'read' } as any)}>Marcar como leído</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => classifyPaper(paper.id)} disabled={paper.status === 'processing'}>
                                                                {paper.status === 'processing' ? 'Clasificando...' : 'Re-clasificar con Kolearning'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => { setSelectedPaperId(paper.id); setIsAssignDialogOpen(true); }}>Asignar a Proyecto</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600" onClick={() => deletePaper(paper.id)}>Eliminar</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            {/* Summary/Notes snippet if available */}
                                            {paper.notes && (
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                    {paper.notes}
                                                </p>
                                            )}

                                            {/* Info Bar */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/40">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <BookOpen className="h-3 w-3" />
                                                    <span>{paper.readingStatus === 'unread' ? 'Sin leer' : paper.readingStatus === 'in_progress' ? 'En progreso' : 'Leído'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <AlertCircle className={`h-3 w-3 ${getPriorityColor(paper.priority)}`} />
                                                    <span>Prioridad {getPriorityLabel(paper.priority)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>Agregado {new Date(paper.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {paper.tags.slice(0, 2).map(tag => (
                                                        <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4 bg-muted/30">{tag}</Badge>
                                                    ))}
                                                    {paper.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{paper.tags.length - 2}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-card/20 rounded-xl border-2 border-dashed border-border">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-primary opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No se encontraron papers</h3>
                            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                                    ? 'Intenta ajustar tus filtros para encontrar lo que buscas.'
                                    : 'Empieza agregando tu primer paper científico a tu biblioteca.'}
                            </p>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Paper
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info inspired by ResearchRabbit */}
            <div className="p-4 border-t border-border bg-card/10 shrink-0 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5">BibTeX</Badge>
                        <Badge variant="outline" className="h-5">Zotero</Badge>
                    </div>
                    <span>Mostrando {filteredPapers.length} de {papers.length} artículos</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="#" className="hover:text-primary transition-colors">Ayuda</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Feedback</Link>
                </div>
            </div>
        </div>
    );
};

export default PaperBoxPage;
