
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  FileText,
  X,
  Loader2,
  Paperclip,
  Link as LinkIcon,
  ChevronLeft,
  ClipboardPaste,
} from "lucide-react";
import { generateAtoms, GenerateAtomsOutput } from "@/ai/flows/generate-atoms";
import { calibratePlanFromQuestionnaire, CalibratePlanOutput } from "@/ai/flows/koli-calibrate-plan";
import { inferProjectMetadata, type InferProjectMetadataOutput } from "@/ai/flows/infer-project-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, useProjects } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { UrlImportDialog } from "@/components/ui/url-import-dialog";
import { PasteTextDialog } from "@/components/ui/paste-text-dialog";
import { Input } from "@/components/ui/input";

const initialSteps = [
    {
        title: "Importa tu material",
        description: "Usa el icono '+' para subir tus apuntes, PDFs, o enlaces."
    },
    {
        title: "Koli Procesa Automáticamente",
        description: "Nuestra IA analiza tu contenido, infiere el título y descripción del proyecto, y descompone el material en conceptos clave."
    },
    {
        title: "¡A Estudiar!",
        description: "Tu proyecto se creará automáticamente con un título y plan personalizados. Serás redirigido para comenzar a aprender de inmediato."
    }
];

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const InputBar = ({ handleSendMessage, isLoading, selectedFiles, removeFile, handleFileChange, fileInputRef, getFileIcon, onImportFromUrl, onPasteText, isSourcePopoverOpen, setIsSourcePopoverOpen }: any) => {
    
    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
        setIsSourcePopoverOpen(false);
    }
    
    const handleUrlImportClick = () => {
        onImportFromUrl();
        setIsSourcePopoverOpen(false);
    }

    const handlePasteTextClick = () => {
        onPasteText();
        setIsSourcePopoverOpen(false);
    }

    return (
         <div className="flex flex-col gap-4">
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file: File) => (
                        <div key={file.name} className="bg-primary/20 text-primary-foreground text-xs rounded-full px-3 py-1 flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <button onClick={() => removeFile(file.name)}><X className="h-3 w-3"/></button>
                        </div>
                    ))}
                </div>
              )}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                        accept=".pdf,.doc,.docx,.txt,.md"
                        multiple={true}
                    />
                    <Popover open={isSourcePopoverOpen} onOpenChange={setIsSourcePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="lg" disabled={isLoading} className="w-full">
                                <Plus className="h-5 w-5 mr-2" />
                                Añadir Fuente
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
                                <button onClick={handleFileButtonClick} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <Paperclip className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">Subir archivos</p>
                                        <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, MD</p>
                                    </div>
                                </button>
                                <button onClick={handleUrlImportClick} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <LinkIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">Importar desde enlace</p>
                                        <p className="text-sm text-muted-foreground">Pega una URL de un artículo</p>
                                    </div>
                                </button>
                                <button onClick={handlePasteTextClick} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
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

                    <Button size="lg" onClick={() => handleSendMessage()} disabled={isLoading || selectedFiles.length === 0}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Empezar"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

const AtomizationProgress = ({ fileName, status, totalFiles, currentFileIndex, totalAtoms }: { fileName: string, status: string, totalFiles: number, currentFileIndex: number, totalAtoms: number }) => {
    
    const progress = totalFiles > 0 ? (currentFileIndex / (totalFiles + 1)) * 100 : 0;
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            <Card className="w-full max-w-3xl bg-card/50">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-headline">Creando tu Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6 p-4 border border-border rounded-lg">
                         <FileText className="h-8 w-8 text-primary" />
                         <div>
                            <p className="font-semibold">{fileName || "Preparando..."}</p>
                            <p className="text-sm text-muted-foreground">
                                {status}
                            </p>
                         </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                           <span>Progreso General</span>
                           <span>{currentFileIndex > totalFiles ? totalFiles : currentFileIndex}/{totalFiles} Archivos</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                         <p className="text-xs text-center text-muted-foreground mt-2">{totalAtoms} átomos generados hasta ahora...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addProject } = useProjects();
  const { toast } = useToast();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({ name: '', status: '', index: 0, total: 0, atoms: 0});
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);
  const [isPasteTextOpen, setIsPasteTextOpen] = useState(false);
  const [atomizationError, setAtomizationError] = useState<string | null>(null);
  const [isSourcePopoverOpen, setIsSourcePopoverOpen] = useState(false);
  const [inferredMetadata, setInferredMetadata] = useState<InferProjectMetadataOutput | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFinalizeProject = useCallback(async (plan: CalibratePlanOutput, atomsResult: GenerateAtomsOutput, metadata: InferProjectMetadataOutput, processedFiles: File[] = selectedFiles) => {
      if (!atomsResult || !metadata) {
          toast({ title: "Error", description: "Faltan datos para crear el proyecto.", variant: "destructive" });
          return;
      }

      const slug = metadata.title
        .toString()
        .normalize('NFD') // split an accented letter in the base letter and the acent
        .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/[^\w-]+/g, '') // remove all non-word chars
        .replace(/--+/g, '-'); // replace multiple - with single -
      
      const newProjectId = `${slug}-${Date.now()}`;

      // Convert processed files to sources with content
      const sources = await Promise.all(processedFiles.map(async (file) => {
          try {
              let content = '';
              const fileType = file.type.includes('pdf') ? 'PDF' : 
                              file.type.includes('doc') ? 'Documento' : 
                              file.type.includes('text') ? 'Texto' :
                              'Documento';
              
              if (file.type.includes('pdf')) {
                  // For PDFs, we store the data URI as we can't easily extract text content here
                  const dataUri = await fileToDataUri(file);
                  content = `Documento PDF: ${file.name}\n\nContenido procesado automáticamente por Koli AI para generar los átomos de conocimiento.\n\nTamaño: ${Math.round(file.size / 1024)}KB`;
              } else {
                  // For text files, we can read the content directly
                  content = await file.text();
                  // If content is empty or very short, add some context
                  if (content.length < 50) {
                      content = `Documento: ${file.name}\n\n${content}\n\nContenido procesado por Koli AI.`;
                  }
              }
              
              return {
                  name: file.name,
                  type: fileType,
                  content: content
              };
          } catch (error) {
              console.error(`Error reading file ${file.name}:`, error);
              return {
                  name: file.name,
                  type: 'Documento',
                  content: `Documento: ${file.name}\n\nArchivo procesado automáticamente por Koli AI para extraer conocimiento y generar átomos de aprendizaje.\n\nTamaño: ${Math.round(file.size / 1024)}KB\nTipo: ${file.type || 'Desconocido'}`
              };
          }
      }));

      const newProject: Omit<Project, 'sessions'> = {
          id: newProjectId,
          title: metadata.title,
          description: metadata.description,
          mastery: 0,
          categories: metadata.categories,
          icon: "Book", 
          atoms: atomsResult.atoms,
          learningPath: plan.learningPath.flatMap(day => day.sessions),
          fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
          sources: sources,
      };
      addProject(newProject as any);
      toast({
          title: "¡Proyecto Creado!",
          description: `${metadata.title} ha sido añadido a tu dashboard.`
      })
      router.push(`/projects/${newProject.id}`);
  }, [addProject, router, toast, selectedFiles]);

  const processFiles = useCallback(async (filesToProcess: File[]) => {
    setIsLoading(true);
    setIsProjectStarted(true);
    setAtomizationError(null);
    
    const totalFiles = filesToProcess.length;
    let accumulatedAtoms: GenerateAtomsOutput['atoms'] = [];

    for (let i = 0; i < totalFiles; i++) {
        const file = filesToProcess[i];
        setProcessingStatus({ name: file.name, status: `Procesando archivo ${i + 1} de ${totalFiles}...`, index: i + 1, total: totalFiles, atoms: accumulatedAtoms.length });

        try {
            const studyMaterialUri = await fileToDataUri(file);
            
            const response = await generateAtoms({
                studyMaterial: studyMaterialUri,
            });
            
            accumulatedAtoms = [...accumulatedAtoms, ...response.atoms];
            setProcessingStatus(prev => ({ ...prev, atoms: accumulatedAtoms.length }));


        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            const errorMessage = `Lo siento, ha ocurrido un error al procesar tu documento "${file.name}". Por favor, intenta de nuevo.`;
            setAtomizationError(errorMessage);
            setIsLoading(false);
            return;
        }
    }
    
    const finalAtomsResult: GenerateAtomsOutput = {
        initialResponse: "Proceso completado.",
        atoms: accumulatedAtoms
    };

    setProcessingStatus(prev => ({ ...prev, status: `Infiriendo título y descripción...`, index: totalFiles + 1 }));

    try {
        // Create content summary for metadata inference
        const contentSummary = accumulatedAtoms.map(atom => `${atom.question}: ${atom.answer}`).join('\n');
        const fileNames = filesToProcess.map(f => f.name);
        
        // Infer project metadata
        const metadata = await inferProjectMetadata({
            contentSummary,
            fileNames
        });
        setInferredMetadata(metadata);

        setProcessingStatus(prev => ({ ...prev, status: `Generando plan de aprendizaje...`, index: totalFiles + 2 }));
        
        const plan = await calibratePlanFromQuestionnaire({
            atoms: finalAtomsResult.atoms,
            projectTitle: metadata.title,
        });
        
        handleFinalizeProject(plan, finalAtomsResult, metadata, filesToProcess);
    } catch(error) {
        console.error("Error generating project:", error);
        setAtomizationError('Lo siento, ha ocurrido un error al generar tu proyecto.');
        setIsLoading(false);
    }

  }, [handleFinalizeProject]);

  useEffect(() => {
    const preloadedSourceParam = searchParams.get('source');
    const sourceName = searchParams.get('sourceName') || `reused-source-${Date.now()}`;
    if (preloadedSourceParam) {
        try {
            const decodedSource = decodeURIComponent(preloadedSourceParam);
            const blob = dataUriToBlob(decodedSource);
            const file = new File([blob], sourceName, { type: blob.type });
            setSelectedFiles([file]);
        } catch (error) {
            console.error("Failed to process preloaded source:", error);
            const errorMessage = "Lo siento, no pude procesar la fuente reutilizada. Puede que el enlace esté corrupto. Por favor, intenta de nuevo.";
            setAtomizationError(errorMessage);
            setIsProjectStarted(true);
        }
    }
  }, [searchParams]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const newFiles = Array.from(event.target.files);
        if (newFiles.length > 0) {
            setSelectedFiles(prevFiles => {
                if (atomizationError) {
                    setAtomizationError(null);
                    setIsProjectStarted(false);
                    return newFiles;
                }
                return [...prevFiles, ...newFiles];
            });
        }
    }
  };
  
  const handleImportFromUrl = async (url: string) => {
    setIsUrlImportOpen(false);
    setIsLoading(true);
    toast({ title: "Importando desde URL...", description: "Koli está extrayendo el contenido. Esto puede tardar un momento." });
    try {
        const response = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const { content } = await response.json();

        if (content) {
            const urlPath = new URL(url).pathname;
            const lastSegment = urlPath.split('/').filter(Boolean).pop();
            const urlFileName = lastSegment || 'contenido-importado';

            const file = new File([content], `${urlFileName}.txt`, { type: "text/plain" });
            
            setSelectedFiles(prevFiles => [...prevFiles, file]);

            toast({ title: "¡Contenido importado!", description: `Se ha extraído el contenido de "${urlFileName}".` });
        } else {
            toast({ title: "Error de importación", description: "No se pudo extraer contenido de la URL. El sitio puede ser incompatible o la URL incorrecta.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Error importing from URL:", error);
        toast({ title: "Error", description: "Ocurrió un error al procesar la URL. Intenta con otro enlace.", variant: "destructive" });
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

  const handleSendMessage = async () => {
    if (selectedFiles.length === 0) return;
    const filesToProcess = [...selectedFiles];
    // setSelectedFiles([]);
    processFiles(filesToProcess);
  }
  
  const handleResetProcess = () => {
    setIsProjectStarted(false);
    // setSelectedFiles([]); // Don't clear files so user can retry
    setProcessingStatus({ name: '', status: '', index: 0, total: 0, atoms: 0});
    setAtomizationError(null);
    setIsLoading(false);
  };

  if (isProjectStarted) {
    if (atomizationError) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
                 <Button 
                    variant="outline" 
                    onClick={handleResetProcess} 
                    className="absolute top-8 left-8"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <Card className="w-full max-w-3xl bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-headline text-destructive">Error en el Proceso</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">{atomizationError}</p>
                        <Button onClick={handleResetProcess}>
                            Intentar de nuevo
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden relative">
            <Button 
                variant="outline" 
                onClick={handleResetProcess} 
                className="absolute top-8 left-8 z-10"
            >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver
            </Button>
            <AtomizationProgress 
                fileName={processingStatus.name}
                status={processingStatus.status}
                totalFiles={processingStatus.total}
                currentFileIndex={processingStatus.index}
                totalAtoms={processingStatus.atoms}
            />
        </div>
    );
  }

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
            </div>
        </div>

        <div className="w-full max-w-lg mt-auto p-4">
            <InputBar 
                handleSendMessage={handleSendMessage}
                isLoading={isLoading}
                selectedFiles={selectedFiles}
                removeFile={removeFile}
                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                getFileIcon={getFileIcon}
                onImportFromUrl={() => setIsUrlImportOpen(true)}
                onPasteText={() => setIsPasteTextOpen(true)}
                isSourcePopoverOpen={isSourcePopoverOpen}
                setIsSourcePopoverOpen={setIsSourcePopoverOpen}
            />
        </div>
        </main>
    </div>
    );
}
