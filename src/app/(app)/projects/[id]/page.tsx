
"use client";

import { useState, useEffect } from "react";
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
import { Globe, Eye, Pencil, Trash2, MoreVertical, Book, Landmark, FlaskConical, Code, Music, Palette, Play, Plus, Lock, CheckCircle, Share2, Info, Loader2, Target, Calendar as CalendarIcon, BarChart3, ChevronDown, BookCopy, Archive, RefreshCw, Wand2, Network } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Project, Atom, LearningPathItem, Source } from "@/contexts/ProjectContext";
import { calibratePlanFromQuestionnaire, CalibratePlanOutput } from "@/ai/flows/koli-calibrate-plan";
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
    mode: 'view' | 'edit' | 'delete' | null;
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
        if (mode === 'edit' && editableAtom) {
            onConfirm(editableAtom);
        } else {
            onConfirm();
        }
    }

    const titles = {
        view: "Ver Átomo",
        edit: "Editar Átomo",
        delete: "Confirmar Eliminación"
    }
    const descriptions = {
        view: "Detalles del átomo de conocimiento.",
        edit: "Edita la pregunta y la respuesta de este átomo.",
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
                {mode === 'edit' && editableAtom && (
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Pregunta</label>
                            <Textarea
                                value={editableAtom.question}
                                onChange={(e) => setEditableAtom({ ...editableAtom, question: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Respuesta</label>
                            <Textarea
                                value={editableAtom.answer}
                                onChange={(e) => setEditableAtom({ ...editableAtom, answer: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {mode === 'delete' ? 'Cancelar' : 'Cerrar'}
                    </Button>
                    {(mode === 'edit' || mode === 'delete') && (
                        <Button
                            onClick={handleConfirm}
                            variant={mode === 'delete' ? 'destructive' : 'default'}
                        >
                            {mode === 'edit' ? 'Guardar Cambios' : 'Eliminar'}
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
                description: "Koli no pudo generar un plan de estudio. Intenta de nuevo.",
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
                        Cuéntale a Koli tus objetivos para adaptar "{project.title}" a tus necesidades.
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
    const { projects, completedProjects, updateProjectIcon, updateProjectDetails, updateAtom, deleteAtom, deleteSource, addProject, addAtomsToProject, archiveProject, toggleProjectPublic, updateProjectPlan, getSourceContent } = useProjects();
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
    const [atomAction, setAtomAction] = useState<{ mode: 'view' | 'edit' | 'delete' | null, atom: Atom | null, index: number | null }>({ mode: null, atom: null, index: null });
    const [sourceToDelete, setSourceToDelete] = useState<{ source: Source, index: number } | null>(null);
    const [sourceToView, setSourceToView] = useState<Source | null>(null);
    const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
    const [isFetchingSource, setIsFetchingSource] = useState(false);

    useEffect(() => {
        if (searchParams.get('planUpdated') === 'true' || searchParams.get('sessionCompleted') === 'true') {
            setShowUpdateAlert(true);
            const timer = setTimeout(() => {
                setShowUpdateAlert(false);
                router.replace(`/projects/${slug}`, { scroll: false });
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
        router.push(`/projects/${newProjectId}`);
    };

    const handleMergeProject = (targetProjectId: string) => {
        addAtomsToProject(targetProjectId, project.atoms);
        toast({
            title: "Contenido Añadido",
            description: `Se han añadido ${project.atoms.length} átomos de "${project.title}" a tu proyecto.`,
        });
        router.push(`/projects/${targetProjectId}`);
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
                description: "Koli ha generado una nueva hoja de ruta para tu proyecto.",
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

    const displayedAtoms = showAllAtoms ? project.atoms : project.atoms?.slice(0, 4);
    const activeSessionIndex = isUserProject && project.sessions ? project.sessions.findIndex(s => s.status === 'Continue') : -1;

    // Function to handle session click with authentication check
    const handleSessionClick = (sessionIndex: number) => {
        if (isAuthenticated) {
            router.push(`/study/${project.id}?sessionIndex=${sessionIndex}`);
        } else {
            // Redirect to login with the study session as return URL
            const studyUrl = `/study/${project.id}?sessionIndex=${sessionIndex}`;
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
        <ScrollArea className="h-[calc(100vh-theme(space.16))]">
            <div className="flex-1 flex flex-col p-6 bg-background">
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

                {showUpdateAlert && (
                    <Alert className="mb-6 bg-primary/10 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle>¡Plan de estudio actualizado!</AlertTitle>
                        <AlertDescription>
                            {searchParams.get('planUpdated') === 'true'
                                ? "Koli ha añadido nuevas sesiones a tu plan basándose en tu última sesión."
                                : "¡Felicidades por completar tu sesión! La siguiente ya está desbloqueada."
                            }
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4 flex-1">
                        <button onClick={() => isUserProject && setIsIconSelectorOpen(true)} className={`p-2 rounded-lg ${isUserProject && 'hover:bg-muted'} transition-colors mt-1`}>
                            <Icon className="w-8 h-8 text-primary" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold font-headline text-foreground max-w-2xl">{project.title}</h1>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                    </div>
                    {renderActionButtons()}
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-card/50">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Mejor Racha</p>
                            <p className="text-4xl font-bold">{project.bestStreak || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Precisión</p>
                            <p className="text-4xl font-bold">{isUserProject ? `${accuracy}%` : 'N/A'}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Dominio del tema</p>
                            <p className="text-4xl font-bold">{project.mastery}%</p>
                        </CardContent>
                    </Card>
                </div>

                {isUserProject && project.sessions && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Sesiones</h2>
                            <Button variant="outline" onClick={() => setShowFullPlan(true)}>Ver hoja completa</Button>
                        </div>
                        <Card className="bg-card/50">
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
                        </Card>
                    </div>
                )}

                <Dialog open={showFullPlan} onOpenChange={setShowFullPlan}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Hoja de Ruta Completa</DialogTitle>
                            <DialogDescription>Este es el plan de estudio completo generado por Koli.</DialogDescription>
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

                {/* Mapa Conceptual Section */}
                <ConceptMapSection project={project} />

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Átomos de conocimiento</h2>
                        <Button variant="outline" onClick={() => setShowAllAtoms(!showAllAtoms)}>
                            {showAllAtoms ? "Ver menos" : `Ver todas (${project.atoms?.length || 0})`}
                        </Button>
                    </div>
                    <Card className="bg-card/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Término</TableHead>
                                    <TableHead>Definición</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedAtoms?.map((atom, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium align-top max-w-xs truncate">{atom.question}</TableCell>
                                        <TableCell className="text-muted-foreground align-top max-w-sm truncate">{atom.answer}</TableCell>
                                        <TableCell className="text-right align-top">
                                            <Button variant="ghost" size="sm" onClick={() => setAtomAction({ mode: 'view', atom, index })}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver
                                            </Button>
                                            {isUserProject && (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => setAtomAction({ mode: 'edit', atom, index })}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setAtomAction({ mode: 'delete', atom, index })}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Fuentes</h2>
                    </div>
                    <Card className="bg-card/50">
                        {project.sources && project.sources.length > 0 ? (
                            <Table>
                                <TableBody>
                                    {project.sources.map((source, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <p className="font-medium">{source.name}</p>
                                                <p className="text-sm text-muted-foreground">{source.type}</p>
                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                    {source.content.length} caracteres disponibles
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewSource(source)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver
                                                </Button>
                                                {isUserProject && (
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteSource(source, index)}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <CardContent className="text-center py-8">
                                <p className="text-muted-foreground mb-2">No hay fuentes disponibles</p>
                                <p className="text-sm text-muted-foreground">
                                    Las fuentes se agregarán automáticamente cuando crees nuevos proyectos
                                </p>
                            </CardContent>
                        )}
                    </Card>
                </div>

            </div>
        </ScrollArea>
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
                importance: atom.phase === 'dominio' ? 'high' : atom.phase === 'refuerzo' ? 'medium' : 'low',
                category: atom.phase || 'calibracion',
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
        <ProjectDetails />
    )
}
