
"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { generateAtoms, GenerateAtomsOutput } from "@/ai/flows/generate-atoms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

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

const AtomizationProgress = ({ atomsResult, fileName }: { atomsResult: GenerateAtomsOutput | null, fileName: string }) => {
    const steps = [
        { name: "Análisis de contenido", status: "completed" },
        { name: "Extracción de entidades", status: "completed" },
        { name: "Generación de átomos", status: atomsResult ? "completed" : "pending" },
        { name: "Validación de calidad", status: "pending" },
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
                </CardContent>
            </Card>
        </div>
    );
};

const AtomReview = ({ atoms, onFinish }: { atoms: GenerateAtomsOutput['atoms'], onFinish: () => void }) => {
    
    const [editableAtoms, setEditableAtoms] = useState(atoms);

    const handleDelete = (index: number) => {
        setEditableAtoms(currentAtoms => currentAtoms.filter((_, i) => i !== index));
    };

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 bg-background overflow-hidden">
            <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-headline">Revisa tus Tarjetas</h1>
                    <p className="text-muted-foreground">Añade, edita o elimina tarjetas para perfeccionar tu mazo de estudio.</p>
                </div>
                <Card className="flex-1 flex flex-col bg-card/50">
                    <CardContent className="p-0 flex-1">
                        <ScrollArea className="h-full">
                            <div className="p-4 md:p-6 space-y-4">
                            {editableAtoms.map((atom, index) => (
                                <div key={index} className="flex flex-col md:flex-row items-start gap-4 p-4 border border-border rounded-lg">
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
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(index)} className="self-start md:self-center">
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function NewProjectPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [atomsResult, setAtomsResult] = useState<GenerateAtomsOutput | null>(null);
  const [processingFile, setProcessingFile] = useState<string>("");
  const [showAtomReview, setShowAtomReview] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };
  
  const getFileIcon = (fileType: string) => {
    return <FileText className="h-6 w-6 text-primary" />;
  };

  const handleSendMessage = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;
    
    const currentInput = input;
    const currentFiles = selectedFiles;

    if (!isProjectStarted) {
        setIsProjectStarted(true);
    }
    
    const userMessage: Message = { role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setSelectedFiles([]);
    
    if (currentFiles.length > 0) {
        try {
            const file = currentFiles[0];
            setProcessingFile(file.name);
            const dataUri = await fileToDataUri(file);

            const response = await generateAtoms({ 
                studyMaterial: dataUri,
                userObjective: currentInput
            });
            
            const koliGreeting: Message = { role: 'koli', content: response.initialResponse };
            setMessages(prev => [...prev, koliGreeting]);
            
            setAtomsResult(response);

            const koliResponse: Message = { 
                role: 'koli', 
                content: `He terminado de procesar tu documento y he generado ${response.atoms.length} átomos de conocimiento. Puedes revisarlos ahora o finalizar para crear tu proyecto.`,
                actions: (
                    <>
                        <Button variant="outline" onClick={handleReviewAtoms}><Eye className="mr-2"/>Ver Átomos</Button>
                        <Button onClick={() => handleFinalizeProject()}>Finalizar y Crear Proyecto</Button>
                    </>
                )
            };
            setMessages(prev => [...prev, koliResponse]);

        } catch (error) {
            console.error("Error processing file:", error);
            const koliResponse: Message = { role: 'koli', content: 'Lo siento, ha ocurrido un error al procesar tu documento.' };
            setMessages(prev => [...prev, koliResponse]);
        }
    } else {
        const koliResponse: Message = { role: 'koli', content: "Por favor, sube un documento para que pueda ayudarte a crear un proyecto. O si tienes alguna duda, ¡pregunta!" };
        setMessages(prev => [...prev, koliResponse]);
    }

    setIsLoading(false);
  }

  const handleFinalizeProject = () => {
      console.log('Finalize project');
  }

  const handleReviewAtoms = () => {
    setShowAtomReview(true);
    const koliMessage: Message = {
        role: 'koli',
        content: "Claro, aquí están los átomos que he generado para ti. Puedes editarlos directamente. Cuando estés listo, puedes finalizar para crear el proyecto.",
        actions: (
            <>
                <Button onClick={handleFinalizeProject}>Finalizar y Crear Proyecto</Button>
            </>
        )
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
                <Input
                  placeholder="Describe qué quieres aprender y adjunta tus archivos..."
                  className="w-full h-12 rounded-full pl-12 pr-14 bg-card border-border"
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
                        onChange={handleFileChange}
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
                        <DropdownMenuItem onClick={handleUploadClick}>
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
          </main>
        </div>
      );
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-theme(space.16))] overflow-hidden">
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_450px]">
            {showAtomReview && atomsResult ? (
                 <AtomReview 
                    atoms={atomsResult.atoms} 
                    onFinish={handleFinalizeProject}
                />
            ) : (
                <AtomizationProgress 
                    atomsResult={atomsResult} 
                    fileName={processingFile}
                />
            )}
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
