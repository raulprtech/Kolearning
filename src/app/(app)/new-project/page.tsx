"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
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

    // Extract detailed info from status if available
    const isDetailedStatus = status.includes('📄') || status.includes('🧠') || status.includes('✨') || status.includes('🔄');
    const statusEmoji = isDetailedStatus ? status.match(/[📄🧠✨🔄⚠️📚🎯]/)?.[0] || '⚙️' : '⚙️';
    const statusText = isDetailedStatus ? status.replace(/[📄🧠✨🔄⚠️📚🎯]/g, '').trim() : status;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            <Card className="w-full max-w-4xl bg-card/50">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline mb-2">Creando tu Proyecto</CardTitle>
                    <p className="text-muted-foreground">Koli está procesando tu material para crear átomos de conocimiento</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current File Processing */}
                    <div className="bg-background/50 rounded-xl p-6 border">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                                {statusEmoji}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{fileName || "Preparando..."}</h3>
                                <p className="text-muted-foreground">{statusText}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-4">
                        {/* File Progress */}
                        <div>
                            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                <span>Archivos Procesados</span>
                                <span>{Math.min(currentFileIndex, totalFiles)}/{totalFiles}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Atoms Generated */}
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium text-green-700 dark:text-green-300">
                                        Átomos Generados
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {totalAtoms}
                                </span>
                            </div>
                            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                                Conceptos extraídos del material de estudio
                            </p>
                        </div>
                    </div>

                    {/* Processing Stages Indicator */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className={`text-center p-2 rounded ${currentFileIndex > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <div className="font-medium">1. Análisis</div>
                            <div>Extrayendo contenido</div>
                        </div>
                        <div className={`text-center p-2 rounded ${currentFileIndex > totalFiles ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <div className="font-medium">2. Metadatos</div>
                            <div>Infiriendo título</div>
                        </div>
                        <div className={`text-center p-2 rounded ${currentFileIndex > totalFiles + 1 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <div className="font-medium">3. Plan</div>
                            <div>Creando estrategia</div>
                        </div>
                    </div>

                    {/* Loading Animation */}
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

function NewProjectContent() {
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
  const [inferredMetadata, setInferredMetadata] = useState<{title: string; description: string; categories: string[]} | null>(null);

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

  const handleFinalizeProject = useCallback(async (plan: CalibratePlanOutput, atomsResult: GenerateAtomsOutput, metadata: {title: string; description: string; categories: string[]}, processedFiles: File[] = selectedFiles) => {
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
    let results: GenerateAtomsOutput[] = [];

    for (let i = 0; i < totalFiles; i++) {
        const file = filesToProcess[i];
        setProcessingStatus({ name: file.name, status: `Procesando archivo ${i + 1} de ${totalFiles}...`, index: i + 1, total: totalFiles, atoms: accumulatedAtoms.length });

        try {
            const studyMaterialUri = await fileToDataUri(file);

            // Use the new streaming endpoint for detailed progress
            const response = await fetch('/api/ai/generate-atoms-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyMaterial: studyMaterialUri })
            });

            if (!response.body) {
                throw new Error('No response body received');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalResult: any = null;
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // decode with streaming flag to avoid breaking multibyte chars
                buffer += decoder.decode(value, { stream: true } as any);
                // Normalize CRLF to LF
                buffer = buffer.replace(/\r\n/g, '\n');

                // Process all complete SSE events (terminated by blank line) in buffer
                let sepIndex;
                while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
                    const rawEvent = buffer.slice(0, sepIndex);
                    buffer = buffer.slice(sepIndex + 2);

                    // Extract `data:` lines and join them
                    const dataLines = rawEvent
                        .split('\n')
                        .filter(l => l.startsWith('data:'))
                        .map(l => l.slice(5).trimStart());

                    if (dataLines.length === 0) continue;

                    const payloadStr = dataLines.join('\n');
                    try {
                        const data = JSON.parse(payloadStr);
                        if (data.type === 'progress') {
                            setProcessingStatus(prev => ({
                                ...prev,
                                status: `📄 ${file.name}: ${data.message}`,
                                atoms: accumulatedAtoms.length
                            }));
                        } else if (data.type === 'complete') {
                            console.log('=== RECEIVED COMPLETE DATA ===');
                            console.log('Complete data:', data.data);
                            console.log('Has pipeline?', !!data.data?.pipeline);
                            finalResult = data.data;
                        } else if (data.type === 'error') {
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE event payload:', e, payloadStr);
                    }
                }
            }

            // Try to parse any trailing event data left in buffer
            if (!finalResult && buffer.includes('data:')) {
                const trailing = buffer
                  .split('\n')
                  .filter(l => l.startsWith('data:'))
                  .map(l => l.slice(5).trimStart())
                  .join('\n');
                try {
                    const data = JSON.parse(trailing);
                    if (data.type === 'complete') {
                        finalResult = data.data;
                    }
                } catch {
                    // ignore
                }
            }

            if (finalResult) {
                accumulatedAtoms = [...accumulatedAtoms, ...finalResult.atoms];
                results.push(finalResult);
                setProcessingStatus(prev => ({
                    ...prev,
                    atoms: accumulatedAtoms.length,
                    status: `✅ ${file.name} completado - ${finalResult.atoms.length} átomos generados`
                }));
            }

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
        pipeline: results[0]?.pipeline || {},
        atoms: accumulatedAtoms
    };

    setProcessingStatus(prev => ({ ...prev, status: `Infiriendo título y descripción...`, index: totalFiles + 1 }));

    try {
        console.log('=== DEBUGGING METADATA EXTRACTION ===');
        console.log('Results array length:', results.length);
        console.log('Results array:', results);

        // Extract metadata from the first file's pipeline results (unified context)
        const firstResult = results[0];
        let metadata;

        if (!firstResult || !firstResult.pipeline || !firstResult.pipeline.documentContext) {
            console.log('Using fallback metadata because:', {
                hasResult: !!firstResult,
                hasPipeline: !!firstResult?.pipeline,
                hasDocumentContext: !!firstResult?.pipeline?.documentContext,
                firstResult: firstResult
            });

            // Fallback to using file names and accumulated atoms
            metadata = {
                title: filesToProcess[0]?.name.replace(/\.[^/.]+$/, "") || 'Proyecto de Estudio',
                description: `Proyecto generado a partir de ${filesToProcess.length} archivo(s) con ${accumulatedAtoms.length} átomos de conocimiento.`,
                categories: ['Educación', 'Estudio']
            };
        } else {
            const documentContext = firstResult.pipeline.documentContext;
            console.log('Document context:', documentContext);

            metadata = {
                title: documentContext.inferredTitle,
                description: documentContext.inferredDescription,
                categories: documentContext.categories
            };
        }

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
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-headline mb-2">Crea un Nuevo Proyecto de Aprendizaje</h1>
                <p className="text-lg text-muted-foreground">Transforma cualquier material de estudio en un plan de aprendizaje interactivo.</p>
            </div>

            <div className="w-full max-w-3xl">
                <Card className="bg-card/50">
                    <CardContent className="p-6">
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
                    </CardContent>
                </Card>
            </div>
            
            <div className="mt-16 w-full max-w-5xl">
                <h3 className="text-center text-xl font-semibold mb-8">¿Cómo funciona?</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    {initialSteps.map((step, index) => (
                        <div key={index} className="text-center">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-primary/10 text-primary rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">
                                    {index + 1}
                                </div>
                            </div>
                            <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                            <p className="text-muted-foreground text-sm">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
}

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <NewProjectContent />
        </Suspense>
    )
}
