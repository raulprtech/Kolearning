
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  BarChart3,
  ClipboardPaste,
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
import { PasteTextDialog } from "@/components/ui/paste-text-dialog";
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
    content: React.ReactNode;
    actionId?: 'atomActions' | 'objectiveOptions' | 'deadlineOptions' | 'masteryOptions';
};

type ProjectData = {
    userObjective: string;
    deadline: string;
    masteryLevel: string;
}

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const ChatPanel = ({ messages, input, setInput, handleSendMessage, isLoading, selectedFiles, removeFile, handleFileChange, fileInputRef, getFileIcon, onReviewAtoms, onGeneratePlan, onImportFromUrl, onPasteText, isProjectStarted, processDataCollection }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    
    const objectiveOptions = [
        "Prepararme para un examen",
        "Entender los conceptos clave",
        "Aplicar este conocimiento en un proyecto",
        "Aprender algo nuevo por curiosidad",
    ];

    const masteryOptions = [ "Principiante", "Intermedio", "Avanzado"];
    
    return (
        <div className="flex flex-col h-full bg-card/30 border-l border-border overflow-hidden">
            <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((msg: Message, index: number) => (
                    <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'koli' && <KoliAvatar className="h-10 w-10 flex-shrink-0" />}
                         <div className={`p-4 rounded-xl max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card/80'}`}>
                            <div>{msg.content}</div>
                         </div>
                       </div>
                       <div className="ml-14 mt-2 flex flex-wrap gap-2">
                            {msg.actionId === 'atomActions' && (
                                <>
                                    <Button variant="outline" onClick={onReviewAtoms} disabled={isLoading}><Eye className="mr-2"/>Ver Átomos</Button>
                                    <Button onClick={onGeneratePlan} disabled={isLoading}>Siguiente Paso<ChevronRight className="ml-2"/></Button>
                                </>
                            )}
                            {msg.actionId === 'objectiveOptions' && objectiveOptions.map(opt => (
                                <Button key={opt} variant="outline" onClick={() => processDataCollection({ userObjective: opt })}>{opt}</Button>
                            ))}
                            {msg.actionId === 'masteryOptions' && masteryOptions.map(opt => (
                                <Button key={opt} variant="outline" onClick={() => processDataCollection({ masteryLevel: opt })}>{opt}</Button>
                            ))}
                            {msg.actionId === 'deadlineOptions' && (
                                <>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline"><CalendarIcon className="mr-2"/>Elegir fecha</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 mb-2" align="start">
                                        <Calendar mode="single" onSelect={(d) => d && processDataCollection({ deadline: format(d, "PPP", { locale: es }) })} initialFocus locale={es} />
                                    </PopoverContent>
                                 </Popover>
                                 <Button variant="outline" onClick={() => processDataCollection({ deadline: 'No tengo' })}>No tengo</Button>
                                </>
                            )}
                       </div>
                    </div>
                ))}
                 {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
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
                    onPasteText={() => onPasteText(true)}
                    isDataCollectionDone={messages.some(m => m.actionId)}
                />
            </div>
        </div>
    );
}

const InputBar = ({ input, setInput, handleSendMessage, isLoading, selectedFiles, removeFile, handleFileChange, fileInputRef, getFileIcon, onImportFromUrl, onPasteText, isDataCollectionDone }: any) => {
    
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
            </div>
            <div className="relative">
                <Input
                    placeholder="Describe tu objetivo de aprendizaje y sube un archivo para empezar..."
                    className="w-full h-12 rounded-full pl-12 pr-14 bg-background border-border"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading || isDataCollectionDone}
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                        accept=".pdf,.doc,.docx,.txt,.md"
                        multiple={true}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 mb-2">
                            <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Añadir Fuente</h4>
                                <p className="text-sm text-muted-foreground">
                                    Sube archivos o importa desde una URL.
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
                                <button onClick={onPasteText} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <ClipboardPaste className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">Pegar texto</p>
                                        <p className="text-sm text-muted-foreground">Importa texto de tu portapapeles</p>
                                    </div>
                                </button>
                            </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon" onClick={() => handleSendMessage()} disabled={isLoading || isDataCollectionDone || (!input.trim() && selectedFiles.length === 0)}>
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
  const searchParams = useSearchParams();
  const { addProject } = useProjects();
  const { toast } = useToast();

  const [projectData, setProjectData] = useState<ProjectData>({ userObjective: '', deadline: '', masteryLevel: '' });
  const [collectedData, setCollectedData] = useState<Partial<ProjectData>>({});
  const [dataCollectionStep, setDataCollectionStep] = useState<'start' | 'objective' | 'deadline' | 'masteryLevel' | 'done'>('start');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [atomsResult, setAtomsResult] = useState<GenerateAtomsOutput | null>(null);
  const [processingFile, setProcessingFile] = useState<{name: string, content: string} | null>(null);
  const [projectSourceFiles, setProjectSourceFiles] = useState<{name: string, content: string, type: string}[]>([]);
  const [currentStep, setCurrentStep] = useState<'atomizing' | 'review' | 'plan'>('atomizing');
  const [learningPlan, setLearningPlan] = useState<CalibratePlanOutput | null>(null);
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);
  const [isPasteTextOpen, setIsPasteTextOpen] = useState(false);
  const [atomizationError, setAtomizationError] = useState<string | null>(null);
  const [isAtomizationComplete, setIsAtomizationComplete] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const dataUriToBlob = (dataUri: string) => {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  useEffect(() => {
    const preloadedSourceParam = searchParams.get('source');
    const sourceName = searchParams.get('sourceName') || `reused-source-${Date.now()}`;
    if (preloadedSourceParam) {
        try {
            const decodedSource = decodeURIComponent(preloadedSourceParam);
            const blob = dataUriToBlob(decodedSource);
            const file = new File([blob], sourceName, { type: blob.type });
            processFiles([file], "Aprender sobre esta fuente");
        } catch (error) {
            console.error("Failed to process preloaded source:", error);
            const errorMessage = "Lo siento, no pude procesar la fuente reutilizada. Puede que el enlace esté corrupto. Por favor, intenta de nuevo.";
            setAtomizationError(errorMessage);
            setIsProjectStarted(true); // To show the error view
            setCurrentStep('atomizing'); // To ensure error is rendered in the right view
        }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isProjectStarted) {
        addMessage({ role: 'koli', content: (
            <div className="flex flex-col items-center text-center max-w-md">
                <KoliAvatar className="h-24 w-24 mb-6" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                Hola, soy Koli
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                Tu asistente de IA personal. ¿En qué te puedo ayudar a aprender hoy?
                </p>
            </div>
        )});
    }
  }, [isProjectStarted, addMessage]);


  useEffect(() => {
    if (isAtomizationComplete && dataCollectionStep === 'done') {
        if (atomsResult) {
             addMessage({ 
                role: 'koli', 
                content: `${atomsResult.initialResponse} He generado ${atomsResult.atoms.length} 'átomos' para ti. ¿Quieres revisarlos o generamos tu plan de estudios?`,
                actionId: 'atomActions'
             });
        }
    }
  }, [isAtomizationComplete, dataCollectionStep, atomsResult, addMessage])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (newFiles.length > 0) {
        setSelectedFiles(prevFiles => {
          if (atomizationError) {
            return newFiles;
          }
          if (isProjectStarted) {
            return [...prevFiles, ...newFiles];
          }
          return newFiles;
        });
        
        if (atomizationError) {
          setAtomizationError(null);
          setIsProjectStarted(false); 
          setMessages([]); 
          setAtomsResult(null);
        }
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
            const urlFileName = url.split('/').pop()?.split('?')[0] || 'imported-from-url';
            const file = new File([content], urlFileName, { type: "text/plain" });
            
            setSelectedFiles(prevFiles => [...prevFiles, file]);

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

  const handleImportFromText = (text: string) => {
    setIsPasteTextOpen(false);
    if (!text.trim()) return;

    const file = new File([text], `texto-pegado-${Date.now()}.txt`, { type: 'text/plain' });
    setSelectedFiles(prevFiles => [...prevFiles, file]);
    toast({ title: '¡Texto importado!', description: 'El texto ha sido añadido como fuente.' });
  };


  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };
  
  const getFileIcon = (fileType: string) => {
    return <FileText className="h-3 w-3" />;
  };
  
  const processDataCollection = useCallback((newData: Partial<ProjectData>) => {
    const newCollectedData = { ...collectedData, ...newData };
    setCollectedData(newCollectedData);
    
    const userInput = Object.values(newData)[0];
    if (userInput) {
        addMessage({ role: 'user', content: userInput });
    }

    setMessages(prev => prev.filter(m => !m.actionId));

    const askNextQuestion = (currentData: Partial<ProjectData>) => {
        let currentResponse = '';
        if (userInput) {
            currentResponse = `Has seleccionado: "${userInput}". `;
        }
        
        if (!currentData.userObjective) {
            addMessage({ role: 'koli', content: '¡Hola! Soy Koli. Para empezar, ¿Cuál es tu principal objetivo de aprendizaje con este material?', actionId: 'objectiveOptions' });
            setDataCollectionStep('objective');
        } else if (!currentData.deadline) {
            addMessage({ role: 'koli', content: `${currentResponse}Ahora, ¿tienes alguna fecha límite para esto?`, actionId: 'deadlineOptions' });
            setDataCollectionStep('deadline');
        } else if (!currentData.masteryLevel) {
            addMessage({ role: 'koli', content: `${currentResponse}Casi listo. ¿Cómo describirías tu nivel de conocimiento actual sobre el tema?`, actionId: 'masteryOptions' });
            setDataCollectionStep('masteryLevel');
        } else {
            addMessage({ role: 'koli', content: `${currentResponse}¡Perfecto! Ya tengo todo lo que necesito. Estoy terminando de procesar tu material...` });
            setDataCollectionStep('done');
            setProjectData(currentData as ProjectData);
        }
    };
    
    askNextQuestion(newCollectedData);

  }, [collectedData, addMessage]);


  const processFiles = useCallback(async (filesToProcess: File[], userObjective: string) => {
    setIsLoading(true);
    setCurrentStep('atomizing');
    setProcessingFile({ name: filesToProcess[0].name, content: '' });
    setIsProjectStarted(true);
    setMessages([]);

    const initialData: Partial<ProjectData> = {};
    if (userObjective) {
        initialData.userObjective = userObjective;
    }
    setCollectedData(initialData);

    processDataCollection(initialData);

    try {
        const dataUris = await Promise.all(filesToProcess.map(fileToDataUri));
        const newSourceFiles = filesToProcess.map((file, i) => ({ name: file.name, content: dataUris[i], type: "Documento" }));
        setProjectSourceFiles(prev => [...prev, ...newSourceFiles]);

        let combinedResponse: GenerateAtomsOutput = { initialResponse: '', atoms: [] };

        const finalUserObjective = collectedData.userObjective || userObjective || "Aprender el contenido de este documento";

        for (const sourceFile of newSourceFiles) {
            const response = await generateAtoms({
                studyMaterial: sourceFile.content,
                userObjective: finalUserObjective
            });
            combinedResponse.atoms.push(...response.atoms);
            combinedResponse.initialResponse = response.initialResponse;
        }

        setAtomsResult(combinedResponse);
        setIsAtomizationComplete(true);

    } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = "Lo siento, ha ocurrido un error al procesar tu documento. Esto puede deberse a un formato incompatible o a un problema con el contenido. Por favor, intenta con otro archivo.";
        setAtomizationError(errorMessage);
        setProcessingFile(null);
    } finally {
        setIsLoading(false);
    }
  }, [processDataCollection, collectedData.userObjective]);


  const handleSendMessage = async () => {
    let userInput = input.trim();
    if (!userInput && selectedFiles.length === 0) return;

    if (userInput || selectedFiles.length > 0) {
        const userMessageContent = userInput || `Procesar: ${selectedFiles.map(f => f.name).join(', ')}`;
        addMessage({ role: 'user', content: userMessageContent });
    }
    
    const objective = input.trim();
    setInput('');
    const filesToProcess = [...selectedFiles];
    setSelectedFiles([]);
    
    if (filesToProcess.length > 0) {
        processFiles(filesToProcess, objective);
    } else if (objective) {
        setIsProjectStarted(true);
        setMessages([]);
        processDataCollection({ userObjective: objective });
    }
  }

  const handleFinalizeProject = (plan: CalibratePlanOutput) => {
      if (!atomsResult || projectSourceFiles.length === 0) {
          toast({ title: "Error", description: "Faltan datos para crear el proyecto.", variant: "destructive" });
          return;
      }

      const slug = plan.projectTitle
        .toLowerCase()
        .replace(/\s+/g, '-') 
        .replace(/[^\w-]+/g, '') 
        .replace(/--+/g, '-') 
        .replace(/^-+/, '') 
        .replace(/-+$/, ''); 
      
      const newProjectId = `${slug}-${Date.now()}`;

      const newProject = {
          id: newProjectId,
          title: plan.projectTitle,
          description: plan.projectDescription,
          mastery: 0,
          categories: plan.categories,
          icon: "Book", 
          atoms: atomsResult.atoms,
          learningPath: plan.learningPath,
          fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
          sources: projectSourceFiles
      };
      addProject(newProject as any);
      toast({
          title: "¡Proyecto Creado!",
          description: `${plan.projectTitle} ha sido añadido a tu dashboard.`
      })
      router.push(`/projects/${newProject.id}`);
  }

  const handleGeneratePlan = async () => {
    if (!atomsResult) return;
    setMessages(prev => prev.filter(m => m.actionId !== 'atomActions'));

    setIsLoading(true);
    setCurrentStep('atomizing');

    try {
        const atomsSummary = atomsResult.atoms.map(a => `- ${a.question}`).join('\n');
        const finalProjectData = {
            userObjective: collectedData.userObjective || '',
            deadline: collectedData.deadline || 'No especificada',
            masteryLevel: collectedData.masteryLevel || 'No especificado',
            learningMaterialSummary: `El material trata sobre:\n${atomsSummary}`
        }

        const plan = await calibratePlanFromQuestionnaire(finalProjectData);
        setLearningPlan(plan);
        setCurrentStep('plan');

    } catch(error) {
        console.error("Error generating learning plan:", error);
        addMessage({ role: 'koli', content: 'Lo siento, ha ocurrido un error al generar tu plan de aprendizaje.' });
    } finally {
        setIsLoading(false);
    }
  }


  const handleReviewAtoms = () => {
    setCurrentStep('review');
    setMessages(prev => prev.filter(m => m.actionId !== 'atomActions'));
  };
  
  if (!isProjectStarted) {
    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <UrlImportDialog 
                isOpen={isUrlImportOpen}
                onClose={() => setIsUrlImportOpen(false)}
                onImport={handleImportFromUrl}
                isLoading={isLoading}
            />
            <PasteTextDialog 
                isOpen={isPasteTextOpen}
                onClose={() => setIsPasteTextOpen(false)}
                onImport={handleImportFromText}
            />
          <main className="flex-1 flex flex-col items-center p-4">
            <div className="flex-1 flex flex-col items-center justify-center">
                {messages.length > 0 && messages[0].role === 'koli' ? (
                    messages[0].content
                ) : (
                    <>
                        <KoliAvatar className="h-24 w-24 mb-6" />
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                        Hola, soy Koli
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground">
                        Tu asistente de IA personal. ¿En qué te puedo ayudar a aprender hoy?
                        </p>
                    </>
                )}
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
                    onPasteText={() => setIsPasteTextOpen(true)}
                    isDataCollectionDone={false}
                />
            </div>
          </main>
        </div>
      );
  }

  const renderContent = () => {
    if (atomizationError) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
                <Card className="w-full max-w-3xl bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-headline text-destructive">Error de Atomización</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">{atomizationError}</p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="mr-2"/>
                            Subir un archivo diferente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!isProjectStarted && messages.length > 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center text-center max-w-md">
                   {messages[0].content}
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
                </div>
            </div>
        )
    }

    switch (currentStep) {
        case 'atomizing':
             return <AtomizationProgress 
                        atomsResult={isAtomizationComplete ? atomsResult : null} 
                        fileName={processingFile?.name ?? ""}
                        isLoading={isLoading && !isAtomizationComplete}
                    />;
        case 'review':
             if (atomsResult) {
                return <AtomReview 
                            atoms={atomsResult.atoms} 
                            onNextStep={handleGeneratePlan}
                            onBack={() => setCurrentStep('atomizing')}
                        />
            }
            return null; // or a loading state
        case 'plan':
            if (learningPlan) {
                return <LearningPlan 
                            plan={learningPlan} 
                            onFinish={() => handleFinalizeProject(learningPlan)} 
                            onBack={() => setCurrentStep('review')}
                        />
            }
             return <AtomizationProgress 
                        atomsResult={atomsResult} 
                        fileName={projectSourceFiles[projectSourceFiles.length - 1]?.name ?? ""}
                        isLoading={isLoading && !learningPlan}
                    />;
        default:
             return <AtomizationProgress 
                        atomsResult={isAtomizationComplete ? atomsResult : null} 
                        fileName={processingFile?.name ?? ""}
                        isLoading={isLoading && !isAtomizationComplete}
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
        <PasteTextDialog 
                isOpen={isPasteTextOpen}
                onClose={() => setIsPasteTextOpen(false)}
                onImport={handleImportFromText}
            />
        <main className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_450px]">
            <div className="flex flex-col flex-1 h-full overflow-y-auto">
                {renderContent()}
            </div>
            <ChatPanel
                messages={messages}
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                isLoading={isLoading && !isProjectStarted} // Only show chat loading before conversation starts
                selectedFiles={selectedFiles}
                removeFile={removeFile}
                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                getFileIcon={getFileIcon}
                onReviewAtoms={handleReviewAtoms}
                onGeneratePlan={handleGeneratePlan}
                onImportFromUrl={() => setIsUrlImportOpen(true)}
                onPasteText={() => setIsPasteTextOpen(true)}
                isProjectStarted={isProjectStarted}
                processDataCollection={processDataCollection}
            />
        </main>
    </div>
  )
}

    