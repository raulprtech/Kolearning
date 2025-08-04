
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  FileText,
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  Eye,
  Settings,
  BrainCircuit,
  Share2,
  Trash2,
  BookOpen,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Target,
  BarChart3
} from "lucide-react";
import { generateAtoms, GenerateAtomsOutput } from "@/ai/flows/generate-atoms";
import { calibratePlanFromQuestionnaire, CalibratePlanOutput } from "@/ai/flows/koli-calibrate-plan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UrlImportDialog } from "@/components/ui/url-import-dialog";
import { ProjectSetupDialog } from "@/components/ui/project-setup-dialog";
import { extractContentFromUrl } from "@/lib/actions";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";


const initialSteps = [
    {
        title: "Importa tu material",
        description: "Usa el icono '+' para subir tus apuntes, PDFs, o enlaces. Describe qué quieres aprender y por qué."
    },
    {
        title: "Interactúa con Koli",
        description: "Responde a las preguntas de Koli mientras procesa y atomiza tu contenido para entenderlo a fondo."
    },
    {
        title: "Verifica y ajusta",
        description: "Asegúrate de que todo el material se haya asimilado correctamente. Puedes añadir más si es necesario."
    }
];

type Message = {
    role: 'user' | 'koli';
    content: string;
    actionId?: 'atomActions';
};

type ProjectData = {
    userName: string;
    userObjective: string;
    deadline: string;
    masteryLevel: string;
}

type AttachedData = {
    objective?: string;
    deadline?: {
        date: Date;
        text: string;
    };
    masteryLevel?: string;
}


const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const ChatPanel = ({ messages, input, setInput, handleSendMessage, isLoading, selectedFiles, removeFile, handleFileChange, fileInputRef, getFileIcon, onReviewAtoms, onGeneratePlan, onImportFromUrl, isProjectStarted, attachedData, setAttachedData }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    
    return (
        <div className="flex flex-col h-full bg-card/30 border-l border-border overflow-hidden">
            <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((msg: Message, index: number) => (
                    <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'koli' && <KoliAvatar className="h-10 w-10 flex-shrink-0" />}
                         <div className={`p-4 rounded-xl max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card/80'}`}>
                            <p>{msg.content}</p>
                         </div>
                       </div>
                       {msg.actionId === 'atomActions' && (
                           <div className="ml-14 mt-2 flex gap-2">
                               <Button variant="outline" onClick={onReviewAtoms} disabled={isLoading}><Eye className="mr-2"/>Ver Átomos</Button>
                               <Button onClick={onGeneratePlan} disabled={isLoading}>Siguiente Paso<ChevronRight className="ml-2"/></Button>
                           </div>
                       )}
                    </div>
                ))}
                 {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-4">
                        <KoliAvatar className="h-10 w-10 flex-shrink-0" />
                        <div className="p-4 rounded-xl max-w-lg bg-card/80 flex items-center">
                           <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-border">
                <InputBar 
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    selectedFiles={selectedFiles}
                    removeFile={removeFile}
                    handleFileChange={handleFileChange}
                    fileInputRef={fileInputRef}
                    getFileIcon={getFileIcon}
                    onImportFromUrl={() => onImportFromUrl(true)}
                    attachedData={attachedData}
                    setAttachedData={setAttachedData}
                />
            </div>
        </div>
    );
}

const InputBar = ({ input, setInput, handleSendMessage, isLoading, selectedFiles, removeFile, handleFileChange, fileInputRef, getFileIcon, onImportFromUrl, attachedData, setAttachedData }: any) => {
    const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const formattedDate = format(selectedDate, "PPP", { locale: es });
            setAttachedData((prev: AttachedData) => ({...prev, deadline: { date: selectedDate, text: `Mi fecha límite es el ${formattedDate}`}}))
            setIsSourceMenuOpen(false);
        }
    }

    const handleObjectiveSelect = (objective: string) => {
        setAttachedData((prev: AttachedData) => ({...prev, objective: `Mi objetivo es ${objective}`}));
        setIsSourceMenuOpen(false);
    }

    const handleMasterySelect = (level: string) => {
        setAttachedData((prev: AttachedData) => ({...prev, masteryLevel: `Mi nivel de dominio es ${level}`}));
        setIsSourceMenuOpen(false);
    }

    const removeAttachedData = (key: keyof AttachedData) => {
        setAttachedData((prev: AttachedData) => {
            const newDaTa = {...prev};
            delete newDaTa[key];
            return newDaTa;
        })
    }
    
    const objectiveOptions = [
        "Prepararme para un examen",
        "Entender los conceptos clave",
        "Aplicar este conocimiento en un proyecto",
        "Aprender algo nuevo por curiosidad",
    ];

    const masteryOptions = [ "Principiante", "Intermedio", "Avanzado"];

    const getAttachedDataPill = (key: keyof AttachedData, icon: React.ReactNode, text: string) => (
         <div className="bg-primary/20 text-primary-foreground text-xs rounded-full px-3 py-1 flex items-center gap-2">
            {icon}
            <span className="truncate max-w-[200px]">{text}</span>
            <button onClick={() => removeAttachedData(key)}><X className="h-3 w-3"/></button>
        </div>
    )

    return (
         <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                 {selectedFiles.map((file: File) => (
                    <div key={file.name} className="bg-primary/20 text-primary-foreground text-xs rounded-full px-3 py-1 flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => removeFile(file.name)}><X className="h-3 w-3"/></button>
                    </div>
                ))}
                {attachedData.objective && getAttachedDataPill('objective', <Target className="h-3 w-3" />, attachedData.objective)}
                {attachedData.deadline && getAttachedDataPill('deadline', <CalendarIcon className="h-3 w-3" />, attachedData.deadline.text)}
                {attachedData.masteryLevel && getAttachedDataPill('masteryLevel', <BarChart3 className="h-3 w-3" />, attachedData.masteryLevel)}
            </div>
            <div className="relative">
                <Input
                    placeholder="Describe tu objetivo de aprendizaje y sube un archivo para empezar..."
                    className="w-full h-12 rounded-full pl-12 pr-14 bg-background border-border"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                        accept=".pdf,.doc,.docx,.txt,.md"
                    />
                    <Popover open={isSourceMenuOpen} onOpenChange={setIsSourceMenuOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 mb-2">
                            <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Añadir Fuente y Contexto</h4>
                                <p className="text-sm text-muted-foreground">
                                    Completa tu solicitud con más detalles.
                                </p>
                            </div>
                             <div className="grid gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <Paperclip className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">Subir archivos</p>
                                        <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, MD</p>
                                    </div>
                                </button>
                                <button onClick={onImportFromUrl} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <LinkIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">Importar desde enlace</p>
                                        <p className="text-sm text-muted-foreground">Pega una URL de un artículo</p>
                                    </div>
                                </button>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button disabled={!!attachedData.objective} className={cn("flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left w-full", attachedData.objective && "opacity-50 cursor-not-allowed")}>
                                            <Target className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-semibold">Agregar objetivo</p>
                                                <p className="text-sm text-muted-foreground">¿Qué quieres lograr?</p>
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-72">
                                        {objectiveOptions.map((option, index) => (
                                            <DropdownMenuItem key={index} onClick={() => handleObjectiveSelect(option)}>
                                                {option}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button disabled={!!attachedData.deadline} className={cn("flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left w-full", attachedData.deadline && "opacity-50 cursor-not-allowed")}>
                                            <CalendarIcon className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-semibold">Agregar Deadline</p>
                                                <p className="text-sm text-muted-foreground">¿Para cuándo lo necesitas?</p>
                                            </div>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 mb-2" align="start">
                                        <Calendar mode="single" onSelect={handleDateSelect} initialFocus locale={es} />
                                    </PopoverContent>
                                </Popover>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button disabled={!!attachedData.masteryLevel} className={cn("flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left w-full", attachedData.masteryLevel && "opacity-50 cursor-not-allowed")}>
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-semibold">Definir mi nivel</p>
                                                <p className="text-sm text-muted-foreground">¿Cuánto sabes del tema?</p>
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-72">
                                        {masteryOptions.map((option, index) => (
                                            <DropdownMenuItem key={index} onClick={() => handleMasterySelect(option)}>
                                                {option}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon" onClick={() => handleSendMessage()} disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
                </div>
            </div>
        </div>
    )
}


const AtomizationProgress = ({ atomsResult, fileName, isLoading }: { atomsResult: GenerateAtomsOutput | null, fileName: string, isLoading: boolean }) => {
    const steps = [
        { name: "Análisis de contenido", status: "completed" },
        { name: "Extracción de entidades", status: "completed" },
        { name: "Generación de átomos", status: atomsResult ? "completed" : "pending" },
        { name: "Validación de calidad", status: atomsResult ? "completed" : "pending" },
    ];

    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const totalSteps = steps.length;
    const progress = (completedSteps / totalSteps) * 100;
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            <Card className="w-full max-w-3xl bg-card/50">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-headline">Atomizando Conocimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6 p-4 border border-border rounded-lg">
                         <FileText className="h-8 w-8 text-primary" />
                         <div>
                            <p className="font-semibold">{fileName}</p>
                            <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                         </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                           <span>Progreso</span>
                           <span>{completedSteps}/{totalSteps} Pasos</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                    </div>

                    <ul className="space-y-4">
                        {steps.map((step, index) => (
                             <li key={index} className="flex items-center gap-4">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'completed' ? 'bg-primary' : 'bg-muted'}`}>
                                    {step.status === 'completed' ? <CheckCircle className="h-5 w-5 text-primary-foreground" /> : <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
                                </div>
                                <span className={`${step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}>{step.name}</span>
                             </li>
                        ))}
                    </ul>

                    {atomsResult && (
                        <div className="mt-8 text-center">
                            <h3 className="text-lg font-semibold text-primary">¡Proceso completado!</h3>
                            <p className="text-muted-foreground mt-2">Hemos generado <span className="font-bold">{atomsResult.atoms.length}</span> átomos de conocimiento.</p>
                        </div>
                    )}
                     {isLoading && !atomsResult && (
                         <div className="mt-8 text-center">
                             <p className="text-muted-foreground mt-2">Generando plan de aprendizaje...</p>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const AtomReview = ({ atoms, onNextStep, onBack }: { atoms: GenerateAtomsOutput['atoms'], onNextStep: () => void, onBack: () => void }) => {
    
    const [editableAtoms, setEditableAtoms] = useState(atoms);

    const handleDelete = (index: number) => {
        setEditableAtoms(currentAtoms => currentAtoms.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col h-full p-4 md:p-8 bg-background overflow-hidden">
             <div className="text-center mb-8 shrink-0">
                <h1 className="text-3xl font-bold font-headline">Revisa tus Tarjetas</h1>
                <p className="text-muted-foreground">Añade, edita o elimina tarjetas para perfeccionar tu mazo de estudio.</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 max-w-4xl mx-auto">
                    {editableAtoms.map((atom, index) => (
                        <Card key={index} className="flex flex-col md:flex-row items-start gap-4 p-4 bg-card/50">
                            <span className="text-sm font-bold text-muted-foreground mt-1 hidden md:inline-block">{index + 1}.</span>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <div>
                                    <label className="text-xs text-muted-foreground">TÉRMINO</label>
                                    <Textarea defaultValue={atom.question} className="mt-1 bg-background/50" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">DEFINICIÓN</label>
                                    <Textarea defaultValue={atom.answer} className="mt-1 bg-background/50"/>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(index)} className="self-start md:self-center h-8 w-8">
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                            </Button>
                        </Card>
                    ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="pt-6 flex justify-center items-center gap-4 shrink-0">
                <Button variant="outline" size="lg" onClick={onBack}>
                    <ChevronLeft className="mr-2"/>
                    Volver
                </Button>
                <Button size="lg" onClick={onNextStep}>
                    Siguiente Paso
                </Button>
            </div>
        </div>
    )
}

const LearningPlan = ({ plan, onFinish, onBack }: { plan: CalibratePlanOutput, onFinish: () => void, onBack: () => void }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            <div className="w-full max-w-4xl">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-headline">Crear un nuevo proyecto</h1>
                    <p className="text-muted-foreground">Paso 3 de 3</p>
                    <Progress value={100} className="w-1/2 mx-auto mt-2 h-2" />
                </div>
                <Card className="w-full bg-card/50 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">¡Conoce tu Plan de Estudios!</CardTitle>
                        <CardDescription>
                            Este es el camino que Koli ha diseñado para que alcances tu objetivo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-semibold mb-2">Ruta de aprendizaje</h3>
                        <ScrollArea className="h-48 w-full rounded-md border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Sesión</TableHead>
                                        <TableHead>¿Qué aprenderás en esta sesión?</TableHead>
                                        <TableHead>Tipo de Sesión</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plan.learningPath.map((item) => (
                                        <TableRow key={item.session}>
                                            <TableCell className="font-medium">{item.session}</TableCell>
                                            <TableCell>{item.topic}</TableCell>
                                            <TableCell>{item.sessionType}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>

                        <div className="mt-6">
                             <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary"/>
                                Justificación de Koli
                            </h3>
                            <p className="text-sm text-muted-foreground">{plan.koliJustification}</p>
                        </div>

                         <div className="mt-6">
                             <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary"/>
                                Progreso Esperado
                            </h3>
                            <p className="text-sm text-muted-foreground">{plan.expectedProgress}</p>
                        </div>
                        
                        <div className="mt-8 flex justify-between items-center">
                            <Button variant="outline" onClick={onBack}>
                                <ChevronLeft className="mr-2"/>
                                Volver
                            </Button>
                            <Button size="lg" onClick={onFinish}>Crear Proyecto y Empezar</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default function NewProjectPage() {
  const router = useRouter();
  const { addProject } = useProjects();
  const { toast } = useToast();

  const [projectData, setProjectData] = useState<ProjectData>({ userName: '', userObjective: '', deadline: '', masteryLevel: '' });
  const [collectedData, setCollectedData] = useState<Partial<ProjectData>>({});
  const [dataCollectionStep, setDataCollectionStep] = useState<'start' | 'name' | 'objective' | 'deadline' | 'done'>('start');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachedData, setAttachedData] = useState<AttachedData>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [atomsResult, setAtomsResult] = useState<GenerateAtomsOutput | null>(null);
  const [processingFile, setProcessingFile] = useState<{name: string, content: string} | null>(null);
  const [projectSourceFile, setProjectSourceFile] = useState<{name: string, content: string} | null>(null);
  const [currentStep, setCurrentStep] = useState<'atomizing' | 'review' | 'plan'>('atomizing');
  const [learningPlan, setLearningPlan] = useState<CalibratePlanOutput | null>(null);
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);
  const [isProjectSetupOpen, setIsProjectSetupOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        setSelectedFiles([file]);
        fileToDataUri(file).then(dataUri => {
            setProcessingFile({name: file.name, content: dataUri });
        })
      }
    }
  };
  
  const handleImportFromUrl = async (url: string) => {
    setIsUrlImportOpen(false);
    setIsLoading(true);
    toast({ title: "Importando desde URL...", description: "Koli está extrayendo el contenido." });
    try {
        const content = await extractContentFromUrl(url);
        if (content) {
            const dataUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`;
            const urlFileName = url.split('/').pop()?.split('?')[0] || 'imported-from-url';
            const file = new File([content], urlFileName, { type: "text/plain" });
            
            setSelectedFiles([file]);
            setProcessingFile({name: file.name, content: dataUri });

            toast({ title: "¡Contenido importado!", description: `Se ha extraído el contenido de la URL.` });
        } else {
            toast({ title: "Error", description: "No se pudo extraer contenido de la URL.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Error importing from URL:", error);
        toast({ title: "Error", description: "Ocurrió un error al importar desde la URL.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    if (processingFile && processingFile.name === fileName) {
        setProcessingFile(null);
    }
  };
  
  const getFileIcon = (fileType: string) => {
    return <FileText className="h-3 w-3" />;
  };
  
  const processDataCollection = useCallback((userInput: string) => {
    let nextStep = dataCollectionStep;
    let newCollectedData = { ...collectedData };
    let koliResponse = '';

    if (dataCollectionStep === 'start') {
        koliResponse = '¡Hola! Soy Koli. Para empezar, ¿cómo te llamas?';
        nextStep = 'name';
        if(!newCollectedData.userObjective) newCollectedData.userObjective = userInput;
    } else if (dataCollectionStep === 'name') {
        newCollectedData.userName = userInput;
        if (!newCollectedData.userObjective) {
            koliResponse = `¡Genial, ${userInput}! ¿Cuál es tu principal objetivo de aprendizaje con este material?`;
            nextStep = 'objective';
        } else {
             koliResponse = `Un placer, ${userInput}. ¿Tienes alguna fecha límite para alcanzar tu objetivo? Si no, puedes decir 'No'.`;
             nextStep = 'deadline';
        }
    } else if (dataCollectionStep === 'objective') {
        newCollectedData.userObjective = userInput;
        koliResponse = `Entendido. ¿Tienes alguna fecha límite para esto? Si no, puedes decir 'No'.`;
        nextStep = 'deadline';
    } else if (dataCollectionStep === 'deadline') {
        newCollectedData.deadline = userInput;
        koliResponse = '¡Perfecto! Ya tengo todo lo que necesito. Estoy terminando de procesar tu material...';
        nextStep = 'done';
    }
    
    setCollectedData(newCollectedData);
    setDataCollectionStep(nextStep);

    if (koliResponse) {
        addMessage({ role: 'koli', content: koliResponse });
    }

    if (nextStep === 'done') {
        setProjectData(newCollectedData as ProjectData);
    }

  }, [dataCollectionStep, collectedData, addMessage]);


  const handleSendMessage = async () => {
    const userInput = input.trim();
    let fullUserInput = userInput;

    const attachedContent = [
        attachedData.objective,
        attachedData.deadline?.text,
        attachedData.masteryLevel
    ].filter(Boolean).join('. ');

    if (attachedContent) {
        fullUserInput = `${fullUserInput} (${attachedContent})`;
    }

    if (!fullUserInput && selectedFiles.length === 0) return;
    
    if (!isProjectStarted) {
        if (!processingFile) {
            toast({
                title: "Falta un archivo",
                description: "Por favor, sube un archivo para empezar.",
                variant: "destructive"
            });
            return;
        }

        if(!fullUserInput){
             toast({
                title: "Falta un objetivo",
                description: "Por favor, describe tu objetivo de aprendizaje.",
                variant: "destructive"
            });
            return;
        }
        
        setIsProjectStarted(true);
        setIsLoading(true);
        setInput('');
        setAttachedData({});
        setSelectedFiles([]);

        const userMessage: Message = { role: 'user', content: fullUserInput };
        addMessage(userMessage);
        
        const currentProcessingFile = processingFile;
        setProjectSourceFile(currentProcessingFile);
        
        let initialData = { ...collectedData };
        if (attachedData.objective) initialData.userObjective = attachedData.objective;
        if (attachedData.deadline) initialData.deadline = attachedData.deadline.text;
        if (attachedData.masteryLevel) initialData.masteryLevel = attachedData.masteryLevel;
        setCollectedData(initialData);

        processDataCollection(fullUserInput);

        try {
            const response = await generateAtoms({ 
                studyMaterial: currentProcessingFile.content,
                userObjective: fullUserInput
            });
            setAtomsResult(response);
            
        } catch (error) {
            console.error("Error processing file:", error);
            const errorMessage = (error instanceof Error) ? error.message : 'Lo siento, ha ocurrido un error al procesar tu documento.';
            addMessage({ role: 'koli', content: `Error: ${errorMessage}. Por favor, intenta con otro archivo.` });
            setSelectedFiles([]);
            setProcessingFile(null);
            setIsProjectStarted(false); // Reset on failure
        } finally {
            setIsLoading(false);
        }

    } else {
        // Continue data collection conversation
        const userMessage: Message = { role: 'user', content: fullUserInput };
        addMessage(userMessage);
        setInput('');
        setAttachedData({});
        processDataCollection(fullUserInput);
    }
  }

  useEffect(() => {
    if (dataCollectionStep === 'done' && atomsResult) {
      addMessage({ 
          role: 'koli', 
          content: `${atomsResult.initialResponse} He generado ${atomsResult.atoms.length} 'átomos' para ti. ¿Quieres revisarlos o generamos tu plan de estudios?`,
          actionId: 'atomActions'
      });
    }
  }, [dataCollectionStep, atomsResult, addMessage]);


  const handleGeneratePlan = async () => {
    if (!atomsResult) return;

    setIsLoading(true);
    setCurrentStep('atomizing');

    try {
        const atomsSummary = atomsResult.atoms.map(a => `- ${a.question}`).join('\n');
        const finalProjectData = {
            userName: collectedData.userName || '',
            userObjective: collectedData.userObjective || '',
            deadline: collectedData.deadline || 'No especificada',
            masteryLevel: collectedData.masteryLevel || 'No especificado',
            learningMaterialSummary: `El material trata sobre:\n${atomsSummary}`
        }

        const plan = await calibratePlanFromQuestionnaire(finalProjectData);

        setLearningPlan(plan);
        setCurrentStep('plan');

        addMessage({
            role: 'koli',
            content: "¡Excelente! He diseñado un plan de aprendizaje estratégico para ti. Échale un vistazo. Si estás de acuerdo, podemos crear el proyecto.",
        });

    } catch(error) {
        console.error("Error generating learning plan:", error);
        addMessage({ role: 'koli', content: 'Lo siento, ha ocurrido un error al generar tu plan de aprendizaje.' });
    } finally {
        setIsLoading(false);
    }
  }

  const handleSetupProject = () => {
    if (!learningPlan) return;
    setIsProjectSetupOpen(true);
  };

    const handleFinalizeProject = ({title, description}: {title: string, description: string}) => {
      if (!atomsResult || !learningPlan || !projectSourceFile) {
          toast({ title: "Error", description: "Faltan datos para crear el proyecto.", variant: "destructive" });
          setIsProjectSetupOpen(false);
          return;
      }

      const slug = title
        .toLowerCase()
        .replace(/\s+/g, '-') 
        .replace(/[^\w-]+/g, '') 
        .replace(/--+/g, '-') 
        .replace(/^-+/, '') 
        .replace(/-+$/, ''); 
      
      const newProjectId = `${slug}-${Date.now()}`;

      const newProject = {
          id: newProjectId,
          title: title,
          description: description,
          mastery: 0,
          categories: learningPlan.categories,
          icon: "Book", 
          atoms: atomsResult.atoms,
          sessions: learningPlan.fullLearningPlanMarkdown,
          sources: [{name: projectSourceFile.name, type: "Documento"}]
      };
      addProject(newProject);
      toast({
          title: "¡Proyecto Creado!",
          description: `${title} ha sido añadido a tu dashboard.`
      })
      setIsProjectSetupOpen(false);
      router.push(`/projects/${newProject.id}`);
  }

  const handleReviewAtoms = () => {
    setCurrentStep('review');
    addMessage({
        role: 'koli',
        content: "Claro, aquí están los átomos que he generado para ti. Puedes editarlos directamente. Cuando estés listo, haz clic en 'Siguiente Paso' para continuar.",
    });
  };
  
  if (!isProjectStarted) {
    return (
        <div className="flex flex-col flex-1">
          <UrlImportDialog 
                isOpen={isUrlImportOpen}
                onClose={() => setIsUrlImportOpen(false)}
                onImport={handleImportFromUrl}
                isLoading={isLoading}
            />
          <main className="flex-1 flex flex-col items-center p-4">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center text-center max-w-md">
                    <KoliAvatar className="h-24 w-24 mb-6" />
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                    Hola, soy Koli
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                    Tu asistente de IA personal. ¿En qué te puedo ayudar a aprender hoy?
                    </p>
                </div>
                <div className="mt-12 max-w-4xl w-full text-left">
                    <h2 className="text-xl font-headline text-center mb-6">Crea tu primer proyecto de estudio personalizado</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {initialSteps.map((step, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-8">
                        ¡Y listo! Con estos pasos, Koli generará tu proyecto de estudio personalizado y podrás empezar a aprender.
                    </p>
                </div>
            </div>
    
            <div className="w-full max-w-2xl mt-auto p-4">
               <InputBar 
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    selectedFiles={selectedFiles}
                    removeFile={removeFile}
                    handleFileChange={handleFileChange}
                    fileInputRef={fileInputRef}
                    getFileIcon={getFileIcon}
                    onImportFromUrl={() => setIsUrlImportOpen(true)}
                    attachedData={attachedData}
                    setAttachedData={setAttachedData}
                />
            </div>
          </main>
        </div>
      );
  }

  const renderContent = () => {
    switch (currentStep) {
        case 'atomizing':
            return <AtomizationProgress 
                        atomsResult={atomsResult} 
                        fileName={projectSourceFile?.name ?? ""}
                        isLoading={isLoading && !atomsResult}
                    />;
        case 'review':
             if (atomsResult) {
                return <AtomReview 
                            atoms={atomsResult.atoms} 
                            onNextStep={handleGeneratePlan}
                            onBack={() => setCurrentStep('atomizing')}
                        />
            }
            return null;
        case 'plan':
            if (learningPlan) {
                return <LearningPlan 
                            plan={learningPlan} 
                            onFinish={handleSetupProject} 
                            onBack={() => setCurrentStep('review')}
                        />
            }
            return null;
        default:
             return <AtomizationProgress 
                        atomsResult={atomsResult} 
                        fileName={projectSourceFile?.name ?? ""}
                        isLoading={isLoading && !atomsResult}
                    />;
    }
  }


  return (
    <div className="flex flex-1 h-[calc(100vh-theme(space.16))] overflow-hidden">
        <UrlImportDialog 
                isOpen={isUrlImportOpen}
                onClose={() => setIsUrlImportOpen(false)}
                onImport={handleImportFromUrl}
                isLoading={isLoading}
            />
        {learningPlan && (
            <ProjectSetupDialog
                isOpen={isProjectSetupOpen}
                onClose={() => setIsProjectSetupOpen(false)}
                onSubmit={handleFinalizeProject}
                isLoading={isLoading}
                defaultValues={{
                    title: learningPlan.projectTitle,
                    description: learningPlan.projectDescription,
                }}
            />
        )}
        <main className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_450px]">
            <div className="flex flex-col flex-1 h-full overflow-y-auto">
                {renderContent()}
            </div>
            <ChatPanel
                messages={messages}
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                isLoading={isLoading}
                selectedFiles={selectedFiles}
                removeFile={removeFile}
                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                getFileIcon={getFileIcon}
                onReviewAtoms={handleReviewAtoms}
                onGeneratePlan={handleGeneratePlan}
                onImportFromUrl={() => setIsUrlImportOpen(true)}
                isProjectStarted={isProjectStarted}
                attachedData={attachedData}
                setAttachedData={setAttachedData}
            />
        </main>
    </div>
  )
}

    
