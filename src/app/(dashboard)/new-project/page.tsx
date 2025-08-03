
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  Youtube,
  Loader2,
  CheckCircle,
  Eye,
  Settings,
  BrainCircuit,
  Share2,
  Trash2,
  BookOpen,
  TrendingUp,
  ChevronLeft
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
    actions?: React.ReactNode;
};

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const ChatPanel = ({ messages, input, setInput, handleSendMessage, isLoading, selectedFiles, removeFile, handleUploadClick, fileInputRef, getFileIcon }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);
    
    return (
        <div className="flex flex-col h-full bg-card/30 border-l border-border">
            <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((msg: Message, index: number) => (
                    <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'koli' && <KoliAvatar className="h-10 w-10 flex-shrink-0" />}
                         <div className={`p-4 rounded-xl max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card/80'}`}>
                            <p>{msg.content}</p>
                         </div>
                       </div>
                       {msg.actions && <div className="ml-14 mt-2 flex gap-2">{msg.actions}</div>}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex gap-4">
                        <KoliAvatar className="h-10 w-10 flex-shrink-0" />
                        <div className="p-4 rounded-xl max-w-lg bg-card/80 flex items-center">
                           <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-border">
                 {selectedFiles.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                    {selectedFiles.map((file: File) => (
                        <div key={file.name} className="bg-card/80 rounded-lg p-2 flex flex-col gap-1 relative text-xs">
                            <div className="flex items-center gap-2">
                                {getFileIcon(file.type)}
                                <span className="text-foreground truncate">{file.name}</span>
                            </div>
                            <p className="text-muted-foreground ml-7">{file.type.split('/')[1] || 'Archivo'}</p>
                            <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => removeFile(file.name)}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    </div>
                )}
                <div className="relative">
                    <Input
                        placeholder="Pregúntale a Koli..."
                        className="w-full h-12 rounded-full pl-12 pr-14 bg-background border-border"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isLoading}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleUploadClick}
                            className="hidden"
                            disabled={isLoading}
                        />
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                            <Plus className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top">
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="mr-2 h-4 w-4" />
                            <span>Subir archivos</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <span>Importar desde enlace</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                            <Youtube className="mr-2 h-4 w-4" />
                            <span>Importar desde Youtube</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Button variant="ghost" size="icon" onClick={handleSendMessage} disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                    </div>
                </div>
            </div>
        </div>
    );
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

  const [projectTitle, setProjectTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [atomsResult, setAtomsResult] = useState<GenerateAtomsOutput | null>(null);
  const [processingFile, setProcessingFile] = useState<{name: string, content: string} | null>(null);
  const [currentStep, setCurrentStep] = useState<'atomizing' | 'review' | 'plan'>('atomizing');
  const [learningPlan, setLearningPlan] = useState<CalibratePlanOutput | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        setSelectedFiles(prevFiles => [...prevFiles, file]);
        fileToDataUri(file).then(dataUri => {
            setProcessingFile({name: file.name, content: dataUri });
        })
      }
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setProcessingFile(null);
  };
  
  const getFileIcon = (fileType: string) => {
    return <FileText className="h-6 w-6 text-primary" />;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !processingFile) {
        toast({
            title: "Faltan datos",
            description: "Por favor, describe tu objetivo y sube un archivo.",
            variant: "destructive"
        })
        return;
    }
    
    setProjectTitle(input);
    
    if (!isProjectStarted) {
        setIsProjectStarted(true);
    }
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    
    try {
        const response = await generateAtoms({ 
            studyMaterial: processingFile.content,
            userObjective: input
        });
        
        setAtomsResult(response);
        
        const koliResponse: Message = { 
            role: 'koli', 
            content: `${response.initialResponse}`,
            actions: (
                <>
                    <Button variant="outline" onClick={handleReviewAtoms}><Eye className="mr-2"/>Ver Átomos</Button>
                </>
            )
        };
        setMessages(prev => [...prev, koliResponse]);

    } catch (error) {
        console.error("Error processing file:", error);
        const koliResponse: Message = { role: 'koli', content: 'Lo siento, ha ocurrido un error al procesar tu documento.' };
        setMessages(prev => [...prev, koliResponse]);
    }

    setIsLoading(false);
  }

  const handleGeneratePlan = async () => {
    if (!atomsResult) return;

    setIsLoading(true);
    setCurrentStep('atomizing'); // Show loading state on atomization view

    try {
        const atomsSummary = atomsResult.atoms.map(a => `- ${a.question}`).join('\n');
        const plan = await calibratePlanFromQuestionnaire({
            projectTitle: projectTitle,
            questionnaireResponses: "El usuario quiere prepararse para un examen.", // Placeholder
            learningMaterialSummary: `El material trata sobre:\n${atomsSummary}`
        });

        setLearningPlan(plan);
        setCurrentStep('plan');

        const koliMessage: Message = {
            role: 'koli',
            content: "¡Excelente! He diseñado un plan de aprendizaje estratégico para ti. Échale un vistazo. Si estás de acuerdo, podemos crear el proyecto.",
        };
        setMessages(prev => [...prev, koliMessage]);

    } catch(error) {
        console.error("Error generating learning plan:", error);
        const koliResponse: Message = { role: 'koli', content: 'Lo siento, ha ocurrido un error al generar tu plan de aprendizaje.' };
        setMessages(prev => [...prev, koliResponse]);
    } finally {
        setIsLoading(false);
    }
  }

    const handleFinalizeProject = () => {
      if (!atomsResult || !learningPlan || !processingFile || !projectTitle) {
          toast({ title: "Error", description: "Faltan datos para crear el proyecto.", variant: "destructive" });
          return;
      }

      // Create a URL-friendly slug from the title
      const slug = projectTitle
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
      
      const newProjectId = `${slug}-${Date.now()}`; // Add timestamp for uniqueness

      const newProject = {
          id: newProjectId,
          title: projectTitle,
          mastery: 0,
          categories: learningPlan.categories,
          icon: "Book", // Default icon
          atoms: atomsResult.atoms,
          sessions: learningPlan.fullLearningPlanMarkdown,
          sources: [{name: processingFile.name, type: "Documento"}]
      };
      addProject(newProject);
      toast({
          title: "¡Proyecto Creado!",
          description: `${projectTitle} ha sido añadido a tu dashboard.`
      })
      router.push(`/projects/${newProject.id}`);
  }

  const handleReviewAtoms = () => {
    setCurrentStep('review');
    const koliMessage: Message = {
        role: 'koli',
        content: "Claro, aquí están los átomos que he generado para ti. Puedes editarlos directamente. Cuando estés listo, haz clic en 'Siguiente Paso' para continuar.",
    };
    setMessages(prev => [...prev, koliMessage]);
  };
  
  if (!isProjectStarted) {
    return (
        <div className="flex flex-col flex-1">
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
              {selectedFiles.length > 0 && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedFiles.map(file => (
                    <div key={file.name} className="bg-card/80 rounded-lg p-3 flex flex-col gap-2 relative">
                        <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="text-xs text-foreground truncate">{file.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{file.type.split('/')[1] || 'Archivo'}</p>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeFile(file.name)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                 />
                <Input
                  placeholder="Dale un título a tu proyecto y describe tu objetivo..."
                  className="w-full h-12 rounded-full pl-12 pr-14 bg-card border-border"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Plus className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                          <Paperclip className="mr-2 h-4 w-4" />
                          Subir archivos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Importar desde enlace
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Youtube className="mr-2 h-4 w-4" />
                          Importar desde Youtube
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button variant="ghost" size="icon" onClick={handleSendMessage} disabled={isLoading || !input.trim() || selectedFiles.length === 0}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
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
                        fileName={processingFile?.name ?? ""}
                        isLoading={isLoading}
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
                            onFinish={handleFinalizeProject} 
                            onBack={() => setCurrentStep('review')}
                        />
            }
            return null;
        default:
             return <AtomizationProgress 
                        atomsResult={atomsResult} 
                        fileName={processingFile?.name ?? ""}
                        isLoading={isLoading}
                    />;
    }
  }


  return (
    <div className="flex flex-1 h-[calc(100vh-theme(space.16))] overflow-hidden">
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_450px]">
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
                handleUploadClick={handleFileChange}
                fileInputRef={fileInputRef}
                getFileIcon={getFileIcon}
            />
        </main>
    </div>
  )
}
