
"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Globe, Eye, Pencil, Trash2, MoreVertical, Book, Landmark, FlaskConical, Code, Music, Palette, Play, Plus, Lock, CheckCircle, Share2, Info, Loader2, Target, Calendar as CalendarIcon, BarChart3, ChevronDown, BookCopy, Archive, RefreshCw, Wand2, Network, BrainCircuit, Library, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UISlot } from "@/components/connectors/UISlot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Project, Atom, LearningPathItem, Source } from "@/contexts/ProjectContext";
import { calibratePlanFromQuestionnaire, CalibratePlanOutput } from "@/ai/flows/kolearning-calibrate-plan";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { EditProjectDialog } from "@/components/ui/edit-project-dialog";
import { ShareDialog } from "@/components/ui/share-dialog";
import { Textarea } from "@/components/ui/textarea";
import { RecalibratePlanDialog } from "@/components/ui/recalibrate-plan-dialog";
import ConceptMap from "@/components/ui/ConceptMap";
import { mapConceptRelationships } from "@/ai/flows/map-concept-relationships";
import { PolymorphicAtomEditor } from "@/components/ui/PolymorphicAtomEditor";

const projectIcons: { [key: string]: React.ElementType } = {
    Book,
    Landmark,
    FlaskConical,
    Globe,
    Code,
    Music,
    Palette,
};

interface AtomActionDialogProps {
    atom: Atom | null;
    mode: 'view' | 'edit' | 'delete' | 'create' | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data?: Atom) => void;
}

function AtomActionDialog({ atom, mode, isOpen, onClose, onConfirm }: AtomActionDialogProps) {
    const [editableAtom, setEditableAtom] = useState<Atom | null>(atom);

    useEffect(() => {
        setEditableAtom(atom);
    }, [atom]);

    if (!isOpen || !atom || !mode) return null;

    const handleConfirm = () => {
        if ((mode === 'edit' || mode === 'create') && editableAtom) {
            onConfirm(editableAtom);
        } else {
            onConfirm();
        }
    }

    const titles = {
        view: "Ver Átomo",
        edit: "Editar Átomo",
        create: "Crear Nuevo Átomo",
        delete: "Confirmar Eliminación"
    }
    const descriptions = {
        view: "Detalles del átomo de conocimiento.",
        edit: "Edita las propiedades de este átomo.",
        create: "Crea un nuevo contenido interactivo.",
        delete: `¿Estás seguro de que quieres eliminar este átomo? Esta acción no se puede deshacer.`
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{titles[mode]}</DialogTitle>
                    <DialogDescription>{descriptions[mode]}</DialogDescription>
                </DialogHeader>
                {mode === 'view' && editableAtom && (
                    <div className="space-y-4 py-4">
                        <p className="font-semibold">{editableAtom.question}</p>
                        <p className="text-muted-foreground">{editableAtom.answer}</p>
                    </div>
                )}
                {(mode === 'edit' || mode === 'create') && editableAtom && (
                    <div className="py-2">
                        <PolymorphicAtomEditor atom={editableAtom} onChange={setEditableAtom as any} />
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {mode === 'delete' ? 'Cancelar' : 'Cerrar'}
                    </Button>
                    {(mode === 'edit' || mode === 'create' || mode === 'delete') && (
                        <Button
                            onClick={handleConfirm}
                            variant={mode === 'delete' ? 'destructive' : 'default'}
                        >
                            {mode === 'edit' ? 'Guardar Cambios' : mode === 'create' ? 'Crear Átomo' : 'Eliminar'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AddProjectDialog({ isOpen, onClose, project, onCreate }: { isOpen: boolean; onClose: () => void; project: Project, onCreate: (plan: CalibratePlanOutput, project: Project) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [userObjective, setUserObjective] = useState('');
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [masteryLevel, setMasteryLevel] = useState('');
    const { toast } = useToast();

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const plan = await calibratePlanFromQuestionnaire({
                atoms: project.atoms,
                projectTitle: project.title,
            });
            onCreate(plan, project);
            onClose();
        } catch (error) {
            console.error("Error creating project plan:", error);
            toast({
                title: "Error al crear el plan",
                description: "Kolearning no pudo generar un plan de estudio. Intenta de nuevo.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false);
        }
    };

    const objectiveOptions = [
        "Prepararme para un examen",
        "Entender los conceptos clave",
        "Aplicar este conocimiento en un proyecto",
        "Aprender algo nuevo por curiosidad",
    ];

    const masteryOptions = ["Principiante", "Intermedio", "Avanzado"];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Personaliza tu nuevo proyecto</DialogTitle>
                    <DialogDescription>
                        Cuéntale a Kolearning tus objetivos para adaptar "{project.title}" a tus necesidades.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4" />Tu objetivo de aprendizaje</label>
                        <Select onValueChange={setUserObjective} value={userObjective}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {objectiveOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon className="h-4 w-4" />¿Tienes una fecha límite?</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !deadline && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {deadline ? format(deadline, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={deadline}
                                    onSelect={setDeadline}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />Tu nivel de dominio actual</label>
                        <Select onValueChange={setMasteryLevel} value={masteryLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu nivel" />
                            </SelectTrigger>
                            <SelectContent>
                                {masteryOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={isLoading || !userObjective || !masteryLevel}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Crear Proyecto"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function ProjectDetails() {
    const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const slug = params.id as string;
    const { projects, completedProjects, updateProjectIcon, updateProjectDetails, updateAtom, deleteAtom, deleteSource, updateSourceStatus, addSource, addProject, addAtomsToProject, archiveProject, toggleProjectPublic, updateProjectPlan, getSourceContent } = useProjects();
    const { user } = useAuth();
    const isAuthenticated = !!user;

    const project = projects.find(p => p.id === slug) || completedProjects.find(p => p.id === slug) || null;
    const isUserProject = projects.some(p => p.id === slug) || completedProjects.some(p => p.id === slug);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [isRecalibrateDialogOpen, setIsRecalibrateDialogOpen] = useState(false);

    const [showUpdateAlert, setShowUpdateAlert] = useState(false);

    const [showAllAtoms, setShowAllAtoms] = useState(false);
    const [showFullPlan, setShowFullPlan] = useState(false);
    const [atomAction, setAtomAction] = useState<{ mode: 'view' | 'edit' | 'delete' | 'create' | null, atom: Atom | null, index: number | null }>({ mode: null, atom: null, index: null });
    const [sourceToDelete, setSourceToDelete] = useState<{ source: Source, index: number } | null>(null);
    const [sourceToView, setSourceToView] = useState<Source | null>(null);
    const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
    const [isFetchingSource, setIsFetchingSource] = useState(false);
    const [isSourcesMinimized, setIsSourcesMinimized] = useState(false);

    useEffect(() => {
        if (searchParams.get('planUpdated') === 'true' || searchParams.get('sessionCompleted') === 'true') {
            setShowUpdateAlert(true);
            const timer = setTimeout(() => {
                setShowUpdateAlert(false);
                router.replace(`/study/${slug}`, { scroll: false });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router, slug]);

    if (!project) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
                <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
                <p className="text-muted-foreground">El proyecto que buscas no existe o ha sido eliminado.</p>
                <Button onClick={() => router.push('/')} className="mt-4">Crear Nuevo Proyecto</Button>
            </div>
        )
    }

    const Icon = projectIcons[project.icon] || Globe;

    const handleIconChange = (iconKey: string) => {
        updateProjectIcon(project.id, iconKey);
        setIsIconSelectorOpen(false);
    };

    const handleSaveDetails = (title: string, description: string) => {
        updateProjectDetails(project.id, title, description);
        setIsEditDialogOpen(false);
        toast({ title: "Proyecto actualizado", description: "Los detalles de tu proyecto han sido guardados." });
    }

    const handleArchiveProject = async () => {
        const success = await archiveProject(project.id);
        setIsArchiveDialogOpen(false);
        if (success) {
            toast({ title: "Proyecto archivado", description: `"${project.title}" ha sido movido al archivo.` });
            router.push('/');
        } else {
            toast({
                title: "Archivo lleno",
                description: "Has alcanzado el límite de proyectos archivados. Elimina uno para continuar.",
                variant: "destructive",
            });
        }
    }

    const handleAtomActionConfirm = (data?: Atom) => {
        if (atomAction.mode === 'edit' && atomAction.index !== null && data) {
            updateAtom(project.id, atomAction.index, data);
        } else if (atomAction.mode === 'create' && data) {
            addAtomsToProject(project.id, [data as any]);
        } else if (atomAction.mode === 'delete' && atomAction.index !== null) {
            deleteAtom(project.id, atomAction.index);
        }
        setAtomAction({ mode: null, atom: null, index: null });
    }

    const handleCreateNewProject = (plan: CalibratePlanOutput, baseProject: Project) => {
        const slug = baseProject.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
        const newProjectId = `${slug}-${Date.now()}`;

        // This is a bit of a hack. We should get the full learning path with questions from the AI.
        const learningPathWithQuestions: LearningPathItem[] = plan.learningPath.flatMap(day => day.sessions).map(session => ({
            session: session.session,
            topic: session.topic,
            sessionType: session.sessionType,
            questions: session.questions,
            phase: session.phase,
            questionFormats: session.questionFormats,
        }));

        const newProject: Project = {
            ...baseProject,
            id: newProjectId,
            title: baseProject.title,
            description: plan.projectDescription,
            categories: plan.categories,
            learningPath: learningPathWithQuestions,
            fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
            mastery: 0,
            sessions: [], // will be populated by addProject
        };

        addProject(newProject);
        toast({ title: "¡Proyecto Creado!", description: `${baseProject.title} ha sido añadido a tu dashboard.` });
        router.push(`/study/${newProjectId}`);
    };

    const handleMergeProject = (targetProjectId: string) => {
        addAtomsToProject(targetProjectId, project.atoms);
        toast({
            title: "Contenido Añadido",
            description: `Se han añadido ${project.atoms.length} átomos de "${project.title}" a tu proyecto.`,
        });
        router.push(`/study/${targetProjectId}`);
    };

    const handleRecalibratePlan = async (objective: string, deadline?: Date) => {
        try {
            const plan = await calibratePlanFromQuestionnaire({
                atoms: project.atoms,
                projectTitle: project.title,
            });
            updateProjectPlan(project.id, plan);
            setIsRecalibrateDialogOpen(false);
            toast({
                title: "¡Plan Recalibrado!",
                description: "Kolearning ha generado una nueva hoja de ruta para tu proyecto.",
            });
        } catch (error) {
            console.error("Error recalibrating plan:", error);
            toast({
                title: "Error al recalibrar",
                description: "No se pudo generar un nuevo plan. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };

    const getSessionBadge = (type: string) => {
        switch (type) {
            case 'Calibración':
            case 'Calibración Inicial':
                return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">{type}</Badge>
            case 'Refuerzo de Dominio':
                return <Badge variant="secondary">{type}</Badge>
            case 'Prueba de Dominio':
                return <Badge variant="destructive">{type}</Badge>
            case 'Incursión':
                return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">{type}</Badge>
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    }

    const handleViewSource = async (source: Source) => {
        if (source.content === 'FETCH_REQUIRED') {
            if (!source.id) {
                toast({ title: "Error", description: "El archivo no se encontró en la nube." });
                return;
            }
            try {
                setIsFetchingSource(true);
                toast({ title: "Descargando PDF...", description: "Cargando el documento desde la base de datos." });
                const content = await getSourceContent(source.id);
                setSourceToView({ ...source, content });
            } catch (err) {
                console.error(err);
                toast({ title: "Error", description: "No se pudo descargar el archivo original.", variant: "destructive" });
            } finally {
                setIsFetchingSource(false);
            }
        } else {
            setSourceToView(source);
        }
    };
    const handleDeleteSource = (source: Source, index: number) => {
        setSourceToDelete({ source, index });
    };

    const confirmDeleteSource = () => {
        if (sourceToDelete) {
            deleteSource(project.id, sourceToDelete.index);
            toast({
                title: "Fuente eliminada",
                description: `"${sourceToDelete.source.name}" ha sido eliminada del proyecto.`
            });
            setSourceToDelete(null);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf';
        const isText = file.type === 'text/plain' || file.name.endsWith('.md');

        if (!isPdf && !isText) {
            toast({
                title: "Formato no soportated",
                description: "Por ahora solo soportamos archivos .pdf, .txt o .md",
                variant: "destructive"
            });
            return;
        }

        try {
            let content = "";
            if (isText) {
                content = await file.text();
            } else {
                // PDF processing would normally happen via a service, 
                // for MVP we'll treat it as a placeholder or use a simple extractor if available.
                content = `CONTENIDO DEL PDF: ${file.name} (Procesamiento pendiente)`;
            }

            const newSource: Omit<Source, 'id'> = {
                name: file.name,
                type: isPdf ? 'pdf' : 'text',
                content,
                status: 'not_started'
            };

            await addSource(project.id, newSource);
        } catch (error) {
            console.error("Error extraiendo contenido del archivo:", error);
            toast({
                title: "Error",
                description: "No se pudo leer el archivo.",
                variant: "destructive"
            });
        } finally {
            event.target.value = '';
        }
    };

    const displayedAtoms = showAllAtoms ? project.atoms : project.atoms?.slice(0, 4);
    const activeSessionIndex = isUserProject && project.sessions ? project.sessions.findIndex(s => s.status === 'Continue') : -1;

    // Function to handle session click with authentication check
    const handleSessionClick = (sessionIndex: number) => {
        if (isAuthenticated) {
            router.push(`/study/${project.id}/session?sessionIndex=${sessionIndex}`);
        } else {
            // Redirect to login with the study session as return URL
            const studyUrl = `/study/${project.id}/session?sessionIndex=${sessionIndex}`;
            router.push(`/login?redirect=${encodeURIComponent(studyUrl)}`);
        }
    };

    const accuracy = (project.totalAnswers && project.correctAnswers && project.totalAnswers > 0) ? Math.round((project.correctAnswers / project.totalAnswers) * 100) : 0;

    const renderActionButtons = () => {
        if (isUserProject) {
            return (
                <div className="flex items-center gap-2">
                    <Button
                        disabled={activeSessionIndex < 0}
                        onClick={() => activeSessionIndex >= 0 && handleSessionClick(activeSessionIndex)}
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Estudiar
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar Detalles</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsRecalibrateDialogOpen(true)}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                <span>Recalibrar Plan</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                <span>Compartir</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setIsArchiveDialogOpen(true)}>
                                <Archive className="mr-2 h-4 w-4" />
                                <span>Archivar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        Agregar <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsAddProjectDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear nuevo proyecto
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>o fusionar con existente</DropdownMenuLabel>
                    {projects.map(p => (
                        <DropdownMenuItem key={p.id} onClick={() => handleMergeProject(p.id)}>
                            <BookCopy className="mr-2 h-4 w-4" />
                            <span>{p.title}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <div className="flex bg-background w-full min-h-0 min-w-0 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
            <AddProjectDialog
                isOpen={isAddProjectDialogOpen}
                onClose={() => setIsAddProjectDialogOpen(false)}
                project={project}
                onCreate={handleCreateNewProject}
            />
            <EditProjectDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                project={project}
                onSave={handleSaveDetails}
            />
            <ShareDialog
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
                project={project}
                onTogglePublic={toggleProjectPublic}
            />
            <RecalibratePlanDialog
                isOpen={isRecalibrateDialogOpen}
                onClose={() => setIsRecalibrateDialogOpen(false)}
                onRecalibrate={handleRecalibratePlan}
            />
            <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Archivar este proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{project.title}" se moverá al archivo. Podrás restaurarlo más tarde.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Archivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!sourceToDelete} onOpenChange={() => setSourceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar fuente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar "{sourceToDelete?.source.name}"? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteSource} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!sourceToView} onOpenChange={() => setSourceToView(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookCopy className="h-5 w-5" />
                            {sourceToView?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Fuente original: {sourceToView?.type}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] my-4 pr-4">
                        {sourceToView?.content.startsWith('data:application/pdf') ? (
                            <iframe
                                src={sourceToView.content}
                                className="w-full min-h-[60vh] rounded-md border-0"
                                title={`PDF View - ${sourceToView.name}`}
                            />
                        ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                {sourceToView?.content.split('\n').map((line, index) => {
                                    if (line.startsWith('# ')) {
                                        return <h1 key={index} className="text-2xl font-bold mb-4 mt-6 text-foreground">{line.slice(2)}</h1>;
                                    } else if (line.startsWith('## ')) {
                                        return <h2 key={index} className="text-xl font-semibold mb-3 mt-5 text-foreground">{line.slice(3)}</h2>;
                                    } else if (line.startsWith('### ')) {
                                        return <h3 key={index} className="text-lg font-medium mb-2 mt-4 text-foreground">{line.slice(4)}</h3>;
                                    } else if (line.startsWith('#### ')) {
                                        return <h4 key={index} className="text-base font-medium mb-2 mt-3 text-foreground">{line.slice(5)}</h4>;
                                    } else if (line.startsWith('- ')) {
                                        return <li key={index} className="ml-4 text-muted-foreground">{line.slice(2)}</li>;
                                    } else if (line.startsWith('```')) {
                                        const isClosing = sourceToView?.content.split('\n').slice(0, index).filter(l => l.startsWith('```')).length % 2 === 1;
                                        return isClosing ?
                                            <div key={index} className="block"></div> :
                                            <div key={index} className="bg-muted p-3 rounded-md overflow-x-auto text-sm mt-2 mb-2 block"></div>;
                                    } else if (line.trim() === '') {
                                        return <br key={index} />;
                                    } else {
                                        // Check if we're inside a code block
                                        const codeBlocksBefore = sourceToView?.content.split('\n').slice(0, index).filter(l => l.startsWith('```')).length || 0;
                                        const isInCodeBlock = codeBlocksBefore % 2 === 1;
                                        if (isInCodeBlock) {
                                            return <code key={index} className="block text-sm text-foreground">{line}</code>;
                                        } else {
                                            return <p key={index} className="mb-2 text-muted-foreground">{line}</p>;
                                        }
                                    }
                                })}
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setSourceToView(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Dialog open={isIconSelectorOpen} onOpenChange={setIsIconSelectorOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Elige un icono para tu proyecto</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-4 py-4">
                        {Object.entries(projectIcons).map(([key, IconComponent]) => (
                            <Button
                                key={key}
                                variant="outline"
                                className="flex flex-col h-24 gap-2 items-center justify-center"
                                onClick={() => handleIconChange(key)}
                            >
                                <IconComponent className="h-8 w-8 text-primary" />
                                <span className="text-xs">{key}</span>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <AtomActionDialog
                isOpen={!!atomAction.mode}
                mode={atomAction.mode}
                atom={atomAction.atom}
                onClose={() => setAtomAction({ mode: null, atom: null, index: null })}
                onConfirm={handleAtomActionConfirm}
            />

            {/* Left Panel: Data Box (Sources) */}
            <aside className={cn("border-r bg-muted/10 flex flex-col h-full shrink-0 transition-all duration-300", isSourcesMinimized ? "w-16" : "w-1/3")}>
                <input 
                    type="file" 
                    id="source-file-upload" 
                    className="hidden" 
                    accept=".pdf,.txt,.md"
                    onChange={handleFileUpload}
                />
                <div className={cn("p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 flex items-center", isSourcesMinimized ? "justify-center" : "justify-between")}>
                    {!isSourcesMinimized && (
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Library className="h-4 w-4 text-primary" />
                                Fuentes
                            </h2>
                            <UISlot slotId="project_sources_sidebar" className="mt-1" />
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        {!isSourcesMinimized && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 gap-2"
                                onClick={() => document.getElementById('source-file-upload')?.click()}
                            >
                                <Plus className="h-3 w-3" />
                                Añadir
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className={cn("h-8 w-8 p-0 shrink-0", isSourcesMinimized && "w-10 h-10")}
                            onClick={() => setIsSourcesMinimized(!isSourcesMinimized)}
                            title={isSourcesMinimized ? "Expandir fuentes" : "Minimizar fuentes"}
                        >
                            {isSourcesMinimized ? <PanelLeftOpen className="h-5 w-5 text-primary" /> : <PanelLeftClose className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {project.sources && project.sources.length > 0 ? (
                        <div className="space-y-3">
                            {project.sources.map((source, index) => (
                                <div key={index} className={cn("group relative bg-card hover:bg-muted/50 border rounded-lg transition-colors cursor-pointer", isSourcesMinimized ? "p-2 flex justify-center" : "p-3")} onClick={() => handleViewSource(source)} title={isSourcesMinimized ? source.name : undefined}>
                                    <div className="flex items-start gap-3">
                                        <div className={cn("p-1.5 bg-primary/10 rounded-md shrink-0", !isSourcesMinimized && "mt-0.5")}>
                                            <BookCopy className="h-4 w-4 text-primary" />
                                        </div>
                                        {!isSourcesMinimized && (
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{source.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                                                        {source.type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {(source.content.length / 1000).toFixed(1)}k chars
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estado</span>
                                            <Select 
                                              value={source.status || 'not_started'} 
                                              onValueChange={(val) => updateSourceStatus(project.id, index, val as any)}
                                            >
                                              <SelectTrigger className="h-6 w-24 text-[10px] px-2 bg-background/50">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="not_started">Pendiente</SelectItem>
                                                <SelectItem value="reading">Leyendo</SelectItem>
                                                <SelectItem value="processed">Procesado</SelectItem>
                                                <SelectItem value="mastered">Dominado</SelectItem>
                                              </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {(['not_started', 'reading', 'processed', 'mastered'] as const).map((s) => (
                                              <div 
                                                key={s} 
                                                className={cn(
                                                  "h-1 rounded-full",
                                                  (source.status === s || (!source.status && s === 'not_started')) ? "bg-primary" : "bg-muted"
                                                )}
                                              />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Hover Actions */}
                                    {!isSourcesMinimized && (
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsRecalibrateDialogOpen(true); }} title="Mandar a Study Box">
                                                <BrainCircuit className="h-3 w-3 text-primary" />
                                            </Button>
                                            {isUserProject && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteSource(source, index); }} title="Eliminar">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 px-2">
                            <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                            {!isSourcesMinimized && (
                                <>
                                    <p className="text-sm font-medium mb-1">Sin fuentes</p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Sube apuntes para generar tu plan.
                                    </p>
                                    <Button size="sm" variant="outline" className="w-full">
                                        <Plus className="h-3 w-3 mr-2" />
                                        Añadir
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                    
                    {!isSourcesMinimized && (
                      <div className="mt-8 pt-8 border-t border-border/50">
                         <div className="flex justify-between items-center mb-4 px-2">
                              <h3 className="text-sm font-semibold flex items-center gap-2">
                                  <BrainCircuit className="h-4 w-4 text-primary" />
                                  Átomos
                              </h3>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAllAtoms(!showAllAtoms)} title={showAllAtoms ? "Ver menos" : "Ver todos"}>
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                          </div>
                          <div className="space-y-2">
                              {displayedAtoms && displayedAtoms.length > 0 ? (
                                displayedAtoms.map((atom, idx) => (
                                  <div key={idx} className="p-2 bg-card/30 border rounded-md text-xs group relative hover:border-primary/50 transition-colors">
                                      <p className="font-medium line-clamp-1">{atom.question}</p>
                                      <p className="text-muted-foreground line-clamp-1 mt-0.5">{atom.answer}</p>
                                      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-background/80 backdrop-blur-sm p-0.5 rounded border">
                                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAtomAction({ mode: 'view', atom, index: idx })}>
                                              <Eye className="h-3 w-3" />
                                          </Button>
                                          {isUserProject && (
                                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAtomAction({ mode: 'edit', atom, index: idx })}>
                                                  <Pencil className="h-3 w-3" />
                                              </Button>
                                          )}
                                      </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-[10px] text-muted-foreground py-4 italic">No hay átomos generados</p>
                              )}
                              {isUserProject && (
                                <Button variant="outline" size="sm" className="w-full text-[10px] h-7 mt-2 dashed" onClick={() => setAtomAction({ mode: 'create', atom: { type: 'text_card', question: '', answer: '' }, index: null })}>
                                    <Plus className="h-3 w-3 mr-1" /> Nuevo Átomo
                                </Button>
                              )}
                          </div>
                      </div>
                    )}
                </ScrollArea>
            </aside>

            {/* Main Area: Study Box */}
            <main className="flex-1 flex flex-col h-full bg-background min-w-0 overflow-hidden relative">
                <ScrollArea className="flex-1 h-full w-full">
                    <div className="p-8 w-full space-y-10">

                        {/* Header Section (Moved inside ScrollArea) */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <button onClick={() => isUserProject && setIsIconSelectorOpen(true)} className={`p-2 rounded-lg ${isUserProject ? 'hover:bg-muted' : ''} transition-colors mt-1 shrink-0`}>
                                    <Icon className="w-10 h-10 text-primary" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-3xl font-bold font-headline text-foreground truncate">{project.title}</h1>
                                    <p className="text-base text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                {renderActionButtons()}
                            </div>
                        </div>

                        {/* Alert Area */}
                        {showUpdateAlert && (
                            <Alert className="bg-primary/5 border-primary/20">
                                <Info className="h-4 w-4 text-primary" />
                                <AlertTitle>¡Plan actualizado!</AlertTitle>
                                <AlertDescription>
                                    {searchParams.get('planUpdated') === 'true'
                                        ? "Se han añadido nuevas sesiones a tu plan basadas en tu aprendizaje continuo."
                                        : "¡Felicidades por completar tu sesión!"
                                    }
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Study Content Section (Sessions, Map, Atoms) */}
                        <div className="space-y-10 animate-in fade-in zoom-in duration-300">
                            {isUserProject && project.sessions && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold">Sesiones</h2>
                                        <Button variant="outline" onClick={() => setShowFullPlan(true)}>Ver hoja completa</Button>
                                    </div>
                                    <Card className="bg-card/50 overflow-hidden">
                                        <div className="overflow-x-auto w-full">
                                            {project.sessions.length > 0 ? (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Sesión</TableHead>
                                                            <TableHead>Tipo de Sesión</TableHead>
                                                            <TableHead>Preguntas</TableHead>
                                                            <TableHead>Estado</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {project.sessions.map((session, index) => {
                                                            let statusComponent;
                                                            switch (session.status) {
                                                                case 'Completed':
                                                                    statusComponent = <div className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4" />Completado</div>;
                                                                    break;
                                                                case 'Continue':
                                                                    statusComponent = (
                                                                        <Button size="sm" onClick={() => handleSessionClick(index)}>
                                                                            Continuar
                                                                        </Button>
                                                                    );
                                                                    break;
                                                                case 'Locked':
                                                                    statusComponent = <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4" /> Bloqueada</div>;
                                                                    break;
                                                                default:
                                                                    statusComponent = null;
                                                            }
                                                            return (
                                                                <TableRow key={session.session}>
                                                                    <TableCell>{session.session}</TableCell>
                                                                    <TableCell>{getSessionBadge(session.type)}</TableCell>
                                                                    <TableCell>{session.questions || 'No especificado'}</TableCell>
                                                                    <TableCell>{statusComponent}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <CardContent className="text-center py-8">
                                                    <p className="text-muted-foreground mb-4">Tu proyecto aún no tiene sesiones.</p>
                                                    <Button onClick={() => setIsRecalibrateDialogOpen(true)}>Generar Plan de Estudio</Button>
                                                </CardContent>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            )}

                            <ConceptMapSection project={project} />

                        </div>
                    </div>
                </ScrollArea>
            </main>

            <Dialog open={showFullPlan} onOpenChange={setShowFullPlan}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Hoja de Ruta Completa</DialogTitle>
                        <DialogDescription>Este es el plan de estudio completo generado por Kolearning.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96 my-4 pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Sesión</TableHead>
                                    <TableHead>Tema</TableHead>
                                    <TableHead>Tipo de Sesión</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {project.learningPath.map((item) => (
                                    <TableRow key={item.session}>
                                        <TableCell className="font-medium">{item.session}</TableCell>
                                        <TableCell>{item.topic}</TableCell>
                                        <TableCell>{getSessionBadge(item.sessionType)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setShowFullPlan(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ConceptMapSection({ project }: { project: Project }) {
    const [conceptMapData, setConceptMapData] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!project.atoms || project.atoms.length < 3) {
            toast({ title: "Átomos insuficientes", description: "Necesitas al menos 3 átomos para generar un mapa conceptual.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        try {
            const concepts = project.atoms.slice(0, 30).map((atom, i) => ({
                concept: atom.question,
                definition: atom.answer,
                importance: atom.phase === 'mastery' ? 'high' : atom.phase === 'reinforcement' ? 'medium' : 'low',
                category: atom.phase || 'calibration',
                relatedConcepts: atom.dependencies || [],
            }));
            const questions = project.atoms.slice(0, 30).map((atom, i) => ({
                id: `atom-${i}`,
                type: 'knowledge',
                question: atom.question,
                correctAnswer: atom.answer,
                conceptId: `atom-${i}`,
            }));
            const result = await mapConceptRelationships({
                concepts,
                questions,
                documentContext: {
                    subject: project.title,
                    academicLevel: 'university',
                    mainTopics: project.categories || [],
                },
            });
            setConceptMapData(result);
        } catch (err) {
            toast({ title: "Error", description: "No se pudo generar el mapa conceptual.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-400" />
                    Mapa Conceptual
                </h2>
                <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="sm">
                    {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando...</> : <><Wand2 className="h-4 w-4 mr-2" /> Generar Mapa</>}
                </Button>
            </div>
            {conceptMapData ? (
                <ConceptMap data={conceptMapData} />
            ) : (
                <Card className="bg-card/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Network className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-sm">
                            Genera un mapa de relaciones entre los conceptos de tu proyecto.
                        </p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                            Visualiza prerequisitos, dependencias y clusters temáticos.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function ProjectDetailsPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center h-[calc(100vh-64px)]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ProjectDetails />
        </Suspense>
    )
}
