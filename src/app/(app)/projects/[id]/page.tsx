
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
import { Globe, Eye, Pencil, Trash2, MoreVertical, Book, Landmark, FlaskConical, Code, Music, Palette, Play, Plus, Lock, CheckCircle, Share2, Info, Loader2, Target, Calendar as CalendarIcon, BarChart3, ChevronDown, BookCopy, Archive, RefreshCw, Wand2 } from "lucide-react";
import { useProjects, publicProjects } from "@/contexts/ProjectContext";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Project, Atom, LearningPathItem } from "@/contexts/ProjectContext";
import { calibratePlanFromQuestionnaire, CalibratePlanOutput } from "@/ai/flows/koli-calibrate-plan";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { EditProjectDialog } from "@/components/ui/edit-project-dialog";
import { ShareDialog } from "@/components/ui/share-dialog";
import { Textarea } from "@/components/ui/textarea";
import { RecalibratePlanDialog } from "@/components/ui/recalibrate-plan-dialog";

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
                                onChange={(e) => setEditableAtom({...editableAtom, question: e.target.value})}
                                className="mt-1"
                            />
                        </div>
                         <div>
                            <label className="text-sm font-medium">Respuesta</label>
                            <Textarea 
                                value={editableAtom.answer}
                                onChange={(e) => setEditableAtom({...editableAtom, answer: e.target.value})}
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
                atoms: project.atoms 
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

    const masteryOptions = [ "Principiante", "Intermedio", "Avanzado"];

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
                        <label className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4"/>Tu objetivo de aprendizaje</label>
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
                         <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>¿Tienes una fecha límite?</label>
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
                                {deadline ? format(deadline, "PPP", { locale: es}) : <span>Elige una fecha</span>}
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
                         <label className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4"/>Tu nivel de dominio actual</label>
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
  const { projects, updateProjectIcon, updateProjectDetails, updateAtom, deleteAtom, addProject, addAtomsToProject, archiveProject, toggleProjectPublic, updateProjectPlan } = useProjects();
  
  const project = projects.find(p => p.id === slug) || publicProjects.find(p => p.id === slug);
  const isUserProject = projects.some(p => p.id === slug);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRecalibrateDialogOpen, setIsRecalibrateDialogOpen] = useState(false);

  const [showUpdateAlert, setShowUpdateAlert] = useState(false);

  const [showAllAtoms, setShowAllAtoms] = useState(false);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [atomAction, setAtomAction] = useState<{ mode: 'view' | 'edit' | 'delete' | null, atom: Atom | null, index: number | null }>({ mode: null, atom: null, index: null });
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  
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
            <Button onClick={() => router.push('/new-project')} className="mt-4">Crear Nuevo Proyecto</Button>
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

  const handleArchiveProject = () => {
    archiveProject(project.id);
    setIsArchiveDialogOpen(false);
    toast({ title: "Proyecto archivado", description: `"${project.title}" ha sido movido al archivo.` });
    router.push('/new-project');
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
      const slug = plan.projectTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
      const newProjectId = `${slug}-${Date.now()}`;

      // This is a bit of a hack. We should get the full learning path with questions from the AI.
      const learningPathWithQuestions: LearningPathItem[] = plan.learningPath.flatMap(day => day.sessions).map(session => ({
          session: session.session,
          topic: session.topic,
          sessionType: session.sessionType,
          questions: session.questions,
      }));

      const newProject: Project = {
          ...baseProject,
          id: newProjectId,
          title: plan.projectTitle,
          description: plan.projectDescription,
          categories: plan.categories,
          learningPath: learningPathWithQuestions,
          fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
          mastery: 0,
          sessions: [], // will be populated by addProject
      };
      
      addProject(newProject);
      toast({ title: "¡Proyecto Creado!", description: `${plan.projectTitle} ha sido añadido a tu dashboard.` });
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
            atoms: project.atoms
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
    switch(type) {
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

  const displayedAtoms = showAllAtoms ? project.atoms : project.atoms?.slice(0, 4);
  const activeSessionIndex = isUserProject && project.sessions ? project.sessions.findIndex(s => s.status === 'Continue') : -1;
  
  const accuracy = (project.totalAnswers && project.correctAnswers && project.totalAnswers > 0) ? Math.round((project.correctAnswers / project.totalAnswers) * 100) : 0;

  const renderActionButtons = () => {
      if (isUserProject) {
           return (
             <div className="flex items-center gap-2">
                <Link href={`/study/${project.id}?sessionIndex=${activeSessionIndex}`}>
                    <Button disabled={activeSessionIndex < 0}>
                        <Play className="mr-2 h-4 w-4" />
                        Estudiar
                    </Button>
                </Link>
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
                    Agregar <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddProjectDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4"/>
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
                             switch(session.status) {
                                 case 'Completed':
                                     statusComponent = <div className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4"/>Completado</div>;
                                     break;
                                 case 'Continue':
                                     statusComponent = (
                                       <Link href={`/study/${project.id}?sessionIndex=${index}`}>
                                           <Button size="sm">Continuar</Button>
                                       </Link>
                                     );
                                     break;
                                 case 'Locked':
                                     statusComponent = <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4"/> Bloqueada</div>;
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
                                <Eye className="h-4 w-4 mr-2"/>
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
                <Table>
                    <TableBody>
                    {project.sources?.map((source, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <p className="font-medium">{source.name}</p>
                                <p className="text-sm text-muted-foreground">{source.type}</p>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => window.open(source.content, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2"/>
                                    Ver
                                </Button>
                                {isUserProject && (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/new-project?source=${encodeURIComponent(source.content)}&sourceName=${encodeURIComponent(source.name)}`)}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Reutilizar
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive focus:text-destructive focus:bg-destructive/10">
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

    </div>
    </ScrollArea>
  );
}

export default function ProjectDetailsPage() {
    return (
        <ProjectDetails />
    )
}
