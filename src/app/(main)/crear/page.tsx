

'use client';

import { useState, useRef, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  UploadCloud,
  FileText,
  Youtube,
  FileQuestion,
  Book,
  FileSpreadsheet,
  Globe,
  ArrowLeft,
  ImageIcon,
  PencilIcon,
  ChevronRight,
  ChevronLeft,
  Bot,
  Loader2,
  CheckCircle,
  TrendingUp,
  BrainCircuit,
  Calendar as CalendarIcon,
  Sparkles,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription as DialogDescriptionComponent
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleGenerateProjectFromText, handleCreateProject, handlePastedTextImport as handlePastedTextImportAction, handleGenerateProjectFromPdf, handleGenerateProjectFromWebUrl, handleGenerateProjectFromImages, handleGenerateStudyPlan, handleRefineProjectDetails } from '@/app/actions/projects';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { AnkiExportGuide } from '@/components/deck/AnkiExportGuide';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Flashcard as FlashcardType, StudyPlan, ProjectDetails, Project } from '@/types';
import { useUser } from '@/context/UserContext';

type Flashcard = FlashcardType & { localId: number | string };

// --- Step 1 Components ---

const FlashcardEditor = ({ card, number, onCardChange, onCardDelete }: { card: Flashcard; number: number, onCardChange: (id: number | string, field: 'question' | 'answer', value: string) => void, onCardDelete: (id: number | string) => void }) => {
  return (
    <Card className="bg-card/70 border border-primary/20">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground font-medium">{number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onCardDelete(card.localId)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1 grid gap-2">
            <Textarea 
              placeholder="Término" 
              className="bg-background/50 h-24 resize-none"
              value={card.question}
              onChange={(e) => onCardChange(card.localId, 'question', e.target.value)}
            />
            <Label className="text-xs text-muted-foreground pl-2">TÉRMINO</Label>
          </div>
          <div className="flex-1 grid gap-2">
              <Textarea
                  placeholder="Definición" 
                  className="bg-background/50 h-24 resize-none"
                  value={card.answer}
                  onChange={(e) => onCardChange(card.localId, 'answer', e.target.value)}
              />
              <Label className="text-xs text-muted-foreground pl-2">DEFINICIÓN</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type ImportSourceType = 'pdf' | 'powerpoint' | 'image' | 'notes' | 'youtube' | 'quizlet' | 'anki' | 'sheets' | 'web' | 'gizmo';
type SourceInfo = { title: string; type: ImportSourceType; icon: React.ReactNode; isFileBased: boolean; accept?: string; multiple?: boolean; };

const MagicImportModal = ({ onProjectGenerated, onProjectParsed }: { onProjectGenerated: (project: any) => void, onProjectParsed: (title: string, cards: Partial<FlashcardType>[]) => void }) => {
  const [view, setView] = useState<'selection' | 'upload' | 'paste' | 'anki' | 'youtube' | 'sheets' | 'web' | 'quizlet' | 'notes' | 'gizmo'>('selection');
  const [selectedSource, setSelectedSource] = useState<SourceInfo | null>(null);

  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{name: string, dataUri: string}[]>([]);
  
  const [pastedText, setPastedText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources: SourceInfo[] = [
    { title: 'Apuntes', type: 'notes', icon: <Book />, isFileBased: false, accept: '.txt,.md,.tex' },
    { title: 'PDF', type: 'pdf', icon: <FileText />, isFileBased: true, accept: '.pdf' },
    // { title: 'Video de YouTube', type: 'youtube', icon: <Youtube />, isFileBased: false },
    { title: 'Página Web', type: 'web', icon: <Globe />, isFileBased: false },
    { title: 'Imagen', type: 'image', icon: <ImageIcon />, isFileBased: true, accept: '.png,.jpg,.jpeg,.webp', multiple: true },
    { title: 'Quizlet', type: 'quizlet', icon: <FileQuestion />, isFileBased: false },
    { title: 'Anki', type: 'anki', icon: <FileQuestion />, isFileBased: false },
    { title: 'Hojas de Cálculo', type: 'sheets', icon: <FileSpreadsheet />, isFileBased: false },
    { title: 'Gizmo', type: 'gizmo', icon: <Wand2 />, isFileBased: false },
  ];

  const handleSourceSelect = (source: SourceInfo) => {
    setSelectedSource(source);
    switch (source.type) {
      case 'notes':
        setView('notes');
        break;
      case 'pdf':
      case 'image':
        setView('upload');
        break;
      case 'youtube':
        setView('youtube');
        break;
      case 'web':
        setView('web');
        break;
      case 'quizlet':
        setView('quizlet');
        break;
      case 'anki':
        setView('anki');
        break;
      case 'sheets':
        setView('sheets');
        break;
      case 'gizmo':
        setView('gizmo');
        break;
      default:
        toast({ variant: 'destructive', title: 'Función no disponible', description: 'Esta opción de importación aún no está implementada.' });
        break;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedSource) return;

    if (selectedSource.multiple) {
        const filePromises = Array.from(files).map(file => {
            return new Promise<{name: string, dataUri: string}>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        resolve({ name: file.name, dataUri: e.target.result as string });
                    } else {
                        reject(new Error('Failed to read file.'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        Promise.all(filePromises)
            .then(setSelectedFiles)
            .catch(error => toast({ variant: 'destructive', title: 'Error al leer archivos', description: error.message }));
    } else {
        const file = files[0];
        setFileName(file.name);
        setSelectedFiles([]); 
        const reader = new FileReader();
        reader.onload = (e) => {
            setFileContent(e.target?.result || null);
        };
        if (selectedSource.type === 'pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }
};
  
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleAiImport = async (studyNotes?: string) => {
    let contentToProcess;
    
    // Prioritize pasted text. If not available, use file content.
    if (studyNotes && studyNotes.trim() !== '') {
        contentToProcess = studyNotes;
    } else if (fileContent) {
        contentToProcess = fileContent;
    } else {
        toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, sube un archivo o pega texto para generar tarjetas.' });
        return;
    }

    if (typeof contentToProcess !== 'string' && !Array.isArray(contentToProcess)) {
        toast({ variant: 'destructive', title: 'Contenido no válido', description: 'El contenido a procesar no es del tipo esperado.' });
        return;
    }

    setIsGenerating(true);
    const result = await handleGenerateProjectFromText(contentToProcess as string);
    setIsGenerating(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    } else if (result.project) {
      onProjectGenerated(result.project);
      resetState();
      toast({ title: '¡Tarjetas Generadas!', description: 'Tus nuevas tarjetas se han añadido al editor.' });
    }
  };
  
 const handleMediaImport = async () => {
    if (!fileContent || typeof fileContent !== 'string') {
        toast({ variant: 'destructive', title: 'Archivo no válido', description: `Por favor, sube un archivo ${selectedSource?.type}.` });
        return;
    }
    setIsGenerating(true);
    const result = await handleGenerateProjectFromPdf(fileContent, fileName);
    setIsGenerating(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    } else if (result.project) {
      onProjectGenerated(result.project);
      resetState();
      toast({ title: '¡Tarjetas Generadas!', description: 'Tus nuevas tarjetas se han añadido al editor.' });
    }
  };

  const handleImageImport = async () => {
    if (selectedFiles.length === 0) {
        toast({ variant: 'destructive', title: 'No hay imágenes', description: 'Por favor, selecciona una o más imágenes.' });
        return;
    }
    setIsGenerating(true);
    const imageDataUris = selectedFiles.map(f => f.dataUri);
    const result = await handleGenerateProjectFromImages(imageDataUris);
    setIsGenerating(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    } else if (result.project) {
        onProjectGenerated(result.project);
        resetState();
        toast({ title: '¡Tarjetas Generadas!', description: 'Tus nuevas tarjetas se han añadido al editor.' });
    }
  };

  const handleYoutubeImport = async () => {
    // This function is temporarily disabled.
    toast({ variant: 'destructive', title: 'Función no disponible', description: 'La importación desde YouTube está temporalmente desactivada.' });
    return;
    // if (!youtubeUrl) {
    //   toast({ variant: 'destructive', title: 'URL Vacía', description: 'Por favor, introduce una URL de YouTube.' });
    //   return;
    // }
    // setIsGenerating(true);
    
    // const result = await handleGenerateProjectFromYouTubeUrl(youtubeUrl);
    // setIsGenerating(false);

    // if (result.error) {
    //   toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    // } else if (result.project) {
    //   onProjectGenerated(result.project);
    //   resetState();
    //   toast({ title: `¡Tarjetas Generadas desde "${result.project.title}"!`, description: 'Tus nuevas tarjetas se han añadido al editor.' });
    // }
  };
  
  const handleWebImport = async () => {
    if (!webUrl) {
      toast({ variant: 'destructive', title: 'URL Vacía', description: 'Por favor, introduce una URL.' });
      return;
    }
    setIsGenerating(true);
    
    const result = await handleGenerateProjectFromWebUrl(webUrl);
    setIsGenerating(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    } else if (result.project) {
      onProjectGenerated(result.project);
      resetState();
      toast({ title: '¡Tarjetas Generadas!', description: 'Tus nuevas tarjetas se han añadido al editor.' });
    }
  };

  const handleManualTextImport = async (text: string, sourceName: string) => {
    if (!text) {
        toast({ variant: 'destructive', title: 'No hay contenido', description: `Por favor, pega el texto exportado de ${sourceName}.` });
        return;
    }
    setIsGenerating(true);
    const parsedCards = await handlePastedTextImportAction(text, 'tab', 'newline');
    const projectTitle = `Importado de ${sourceName}`;
    onProjectParsed(projectTitle, parsedCards);
    setIsGenerating(false);
    resetState();
    toast({ title: '¡Tarjetas Importadas!', description: `Se han añadido ${parsedCards.length} tarjetas de tu mazo de ${sourceName}.` });
  };


  const resetState = () => {
    setIsOpen(false);
    setTimeout(() => {
        setView('selection');
        setSelectedSource(null);
        setFileName('');
        setFileContent(null);
        setSelectedFiles([]);
        setPastedText('');
        setYoutubeUrl('');
        setWebUrl('');
        setIsGenerating(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, 200);
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true);
    } else {
      resetState();
    }
  };

  const renderSelectionView = () => (
    <>
      <DialogHeader className="p-6 pb-4">
        <DialogTitle>Importación Mágica</DialogTitle>
        <DialogDescriptionComponent>Selecciona desde dónde quieres importar</DialogDescriptionComponent>
      </DialogHeader>
      <div className="p-6 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {sources.map(source => (
          <Button
            key={source.type}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 text-base"
            onClick={() => handleSourceSelect(source)}
          >
            <div className="h-6 w-6">{source.icon}</div>
            {source.title}
          </Button>
        ))}
      </div>
    </>
  );

  const renderUploadView = () => {
    let buttonAction;
    let buttonText = 'Generar con IA';
    let isDisabled = isGenerating;

    switch (selectedSource?.type) {
        case 'pdf':
            buttonAction = handleMediaImport;
            buttonText = `Generando desde ${selectedSource.title}`;
            isDisabled = isGenerating || !fileContent;
            break;
        case 'image':
            buttonAction = handleImageImport;
            buttonText = `Generando desde ${selectedSource.title}`;
            isDisabled = isGenerating || selectedFiles.length === 0;
            break;
        case 'notes':
        default:
            buttonAction = () => handleAiImport();
            isDisabled = isGenerating || !fileContent;
            break;
    }

    return (
    <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde {selectedSource?.title}</DialogTitle>
                <DialogDescriptionComponent>Sube tu archivo y Koli creará las tarjetas de estudio.</DialogDescriptionComponent>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 min-h-0">
        <div 
          className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleFileClick}
        >
          {selectedFiles.length > 0 ? (
            <div className="text-center">
                <ImageIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-semibold">{selectedFiles.length} imagen(es) seleccionada(s)</p>
                <ScrollArea className="h-32 mt-2 w-full">
                    <div className='grid grid-cols-3 gap-2 p-2'>
                    {selectedFiles.map(file => (
                        <Image key={file.name} src={file.dataUri} alt={file.name} width={64} height={64} className="rounded-md object-cover h-16 w-16" />
                    ))}
                    </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-2">Haz clic aquí para cambiar los archivos</p>
            </div>
          ) : fileContent ? (
             <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-semibold">{fileName}</p>
                <p className="text-xs text-muted-foreground">Haz clic aquí para cambiar el archivo</p>
             </div>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-2">Arrastra y suelta tu archivo aquí</p>
              <p className="text-xs text-muted-foreground mb-4">o</p>
              <Button type="button" variant="secondary">Buscar archivo</Button>
            </>
          )}
          <Input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={selectedSource?.accept}
            multiple={selectedSource?.multiple}
          />
        </div>
      </div>
      <div className="flex justify-end p-6 pt-0 gap-4">
          <Button onClick={buttonAction} disabled={isDisabled} className="w-full">
              {isGenerating ? buttonText : 'Generar con IA'}
          </Button>
      </div>
    </>
    );
  };
  
  const renderNotesView = () => (
    <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde {selectedSource?.title}</DialogTitle>
                <DialogDescriptionComponent>Sube un archivo o pega tus apuntes para generar tarjetas.</DialogDescriptionComponent>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-6 min-h-0">
         <div 
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleFileClick}
        >
          {fileContent ? (
             <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-semibold">{fileName}</p>
                <p className="text-xs text-muted-foreground">Haz clic aquí para cambiar el archivo</p>
             </div>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-2">Arrastra y suelta tu archivo aquí</p>
              <p className="text-xs text-muted-foreground mb-4">o</p>
              <Button type="button" variant="secondary">Buscar archivo</Button>
            </>
          )}
          <Input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={selectedSource?.accept}
          />
        </div>
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">O</span>
        </div>
        <Textarea
            placeholder="...o pega tus apuntes aquí."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="h-40 resize-none"
        />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={() => handleAiImport(pastedText)} disabled={isGenerating || (!fileContent && !pastedText)} className="w-full">
              {isGenerating ? 'Generando...' : 'Generar con IA'}
          </Button>
      </div>
    </>
  );
  
  const renderYoutubeView = () => (
    <>
      <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde YouTube</DialogTitle>
                <DialogDescriptionComponent>Pega la URL del video y Koli creará las tarjetas de estudio.</DialogDescriptionComponent>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
        <Input 
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={handleYoutubeImport} disabled={isGenerating || !youtubeUrl} className="w-full">
              {isGenerating ? 'Generando...' : 'Generar con IA'}
          </Button>
      </div>
    </>
  );

  const renderWebView = () => (
    <>
      <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde Página Web</DialogTitle>
                <DialogDescriptionComponent>Pega la URL de la página y Koli creará las tarjetas de estudio.</DialogDescriptionComponent>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
        <Input 
          placeholder="https://es.wikipedia.org/wiki/..."
          value={webUrl}
          onChange={(e) => setWebUrl(e.target.value)}
        />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={handleWebImport} disabled={isGenerating || !webUrl} className="w-full">
              {isGenerating ? 'Generando...' : 'Generar con IA'}
          </Button>
      </div>
    </>
  );

  const renderQuizletView = () => renderManualPastedTextView("Quizlet", "En Quizlet, ve a tu mazo, haz clic en el icono de tres puntos (•••), selecciona 'Exportar', copia el texto y pégalo aquí.");

  const renderManualPastedTextView = (sourceName: string, instructions: React.ReactNode) => (
     <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde {sourceName}</DialogTitle>
                 <DialogDescriptionComponent>
                    {instructions}
                </DialogDescriptionComponent>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
         <Textarea
          placeholder={`Pega aquí el texto exportado de ${sourceName}...`}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="h-60 resize-none"
        />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={() => handleManualTextImport(pastedText, sourceName)} disabled={isGenerating || !pastedText} className="w-full">
              {isGenerating ? 'Importando...' : `Importar Tarjetas de ${sourceName}`}
          </Button>
      </div>
     </>
  );
  
  const renderAnkiView = () => renderManualPastedTextView("Anki", <AnkiExportGuide />);

  const renderSheetsView = () => (
     <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde Hojas de Cálculo</DialogTitle>
                <DialogDescriptionComponent>
                  Cada fila debe tener 1 columna (para tarjetas simples) o 2 columnas (para anverso y reverso).
                </DialogDescriptionComponent>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
         <Textarea
          placeholder="Copia y pega tu hoja de cálculo aquí..."
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="h-60 resize-none"
        />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={() => handleManualTextImport(pastedText, "Hoja de Cálculo")} disabled={isGenerating || !pastedText} className="w-full">
              {isGenerating ? 'Importando...' : `Confirmar`}
          </Button>
      </div>
     </>
  );

  const renderComingSoonView = (sourceName: string) => (
    <>
      <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde {sourceName}</DialogTitle>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Wand2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Próximamente</h3>
        <p className="text-muted-foreground">
          Estamos trabajando para habilitar la importación directa desde {sourceName}. ¡Vuelve pronto!
        </p>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg"><Wand2 className="mr-2 h-5 w-5" /> Importación Mágica</Button>
      </DialogTrigger>
      <DialogContent className={cn("max-w-xl flex flex-col p-0", (view === 'notes' || view === 'quizlet' || view === 'anki' || view === 'sheets') && 'max-w-3xl')}>
         {view === 'selection' && renderSelectionView()}
         {view === 'upload' && renderUploadView()}
         {view === 'notes' && renderNotesView()}
         {view === 'quizlet' && renderQuizletView()}
         {view === 'anki' && renderAnkiView()}
         {view === 'youtube' && renderYoutubeView()}
         {view === 'web' && renderWebView()}
         {view === 'sheets' && renderSheetsView()}
         {view === 'gizmo' && renderComingSoonView(selectedSource?.title || '')}
      </DialogContent>
    </Dialog>
  );
};


const Step1_Input = ({ flashcards, setFlashcards, setProjectDetails, goToNext }: { flashcards: Flashcard[], setFlashcards: (cards: Flashcard[]) => void, setProjectDetails: (details: any) => void, goToNext: () => void }) => {
    const [view, setView] = useState<'options' | 'editor'>('options');
    
    const addCard = () => {
        const newCard: Flashcard = {
            localId: Date.now(),
            id: `manual-${Date.now()}`,
            atomo_id: `manual-${Date.now()}`,
            material_id: 'manual',
            question: '',
            answer: '',
            concepto: '',
            descripcion: '',
            atomos_padre: [],
            formatos_presentacion: [],
            dificultad_inicial: 'Intermedio',
        };
        setFlashcards(current => [...current, newCard]);
    };
    
    const handleCardChange = (localId: number | string, field: 'question' | 'answer', value: string) => {
        setFlashcards(current => current.map(card => {
            if (card.localId === localId) {
                const updatedCard = { ...card, [field]: value };
                // Sync question/answer with concepto/descripcion
                if (field === 'question') updatedCard.concepto = value;
                if (field === 'answer') updatedCard.descripcion = value;
                return updatedCard;
            }
            return card;
        }));
    };

    const handleCardDelete = (localId: number | string) => {
        setFlashcards(current => current.filter(card => card.localId !== localId));
    };

    const handleProjectGenerated = (project: any) => {
        const newFlashcards = project.flashcards.map((fc: FlashcardType, index: number) => ({
            ...fc,
            localId: fc.id || `${Date.now()}-${index}`,
            question: fc.concepto,
            answer: fc.descripcion,
        }));
        setFlashcards(newFlashcards);
        setProjectDetails({ title: project.title, description: project.description, category: project.category || '' });
        setView('editor');
    };

    const handleProjectParsed = (title: string, cards: Partial<FlashcardType>[]) => {
        const newFlashcards = cards.map((card, index) => {
            const localId = `${Date.now()}-${index}`;
            return {
                localId: localId,
                id: localId,
                atomo_id: `parsed-${localId}`,
                material_id: 'parsed',
                question: card.question || '',
                answer: card.answer || '',
                concepto: card.question || '',
                descripcion: card.answer || '',
                atomos_padre: [],
                formatos_presentacion: [],
                dificultad_inicial: 'Intermedio',
            };
        });
        setFlashcards(newFlashcards as Flashcard[]);
        setProjectDetails({ title, description: `Un conjunto de ${cards.length} tarjetas importadas.`, category: 'Importado' });
        setView('editor');
    };

    const handleStartManualEntry = () => {
        if (flashcards.length === 0) {
            addCard();
        }
        setProjectDetails(current => current.title ? current : { title: '', description: '', category: '' });
        setView('editor');
    };

    if (view === 'options') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ingresa tu material de estudio</CardTitle>
                    <CardDescription>Importa tu material usando IA o agrégalo manually.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <MagicImportModal onProjectGenerated={handleProjectGenerated} onProjectParsed={handleProjectParsed} />
                    <Button variant="outline" size="lg" onClick={handleStartManualEntry}>
                        <PencilIcon className="mr-2 h-5 w-5" /> Agregar manualmente
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revisa tus Tarjetas</CardTitle>
                <CardDescription>Añade, edita o elimina tarjetas para perfeccionar tu mazo de estudio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {flashcards.map((card, index) => (
                        <FlashcardEditor key={card.localId} card={card} number={index + 1} onCardChange={handleCardChange} onCardDelete={handleCardDelete} />
                    ))}
                </div>
                <Button variant="outline" className="w-full h-12 border-dashed" onClick={addCard}>
                    <Plus className="mr-2 h-5 w-5" /> Añadir tarjeta
                </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setView('options')}><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                <Button onClick={goToNext} disabled={flashcards.length === 0}>
                    Continuar al siguiente paso <ChevronRight className="ml-2 h-4 w-4"/>
                </Button>
            </CardFooter>
        </Card>
    );
};

// --- Step 2 Components ---

const Step2_Details = ({ projectDetails, setProjectDetails, flashcards, goBack, goToNext }: { projectDetails: ProjectDetails, setProjectDetails: (details: ProjectDetails) => void, flashcards: Flashcard[], goBack: () => void, goToNext: () => void }) => {
    const { title, description, category, objective, timeLimit, masteryLevel } = projectDetails;
    const [isRefining, setIsRefining] = useState(false);
    const { toast } = useToast();
    
    const masteryLevels = ["Nada", "Principiante", "Intermedio", "Avanzado", "Lo domino"];
    const [date, setDate] = useState<Date | undefined>(timeLimit ? new Date(timeLimit) : undefined);

    const handleRefine = async () => {
      setIsRefining(true);
      const result = await handleRefineProjectDetails({
        flashcards: flashcards.map(f => ({ question: f.question, answer: f.answer })),
      });

      if (result.details) {
        setProjectDetails((prev: any) => ({
          ...prev,
          title: result.details.title,
          description: result.details.description,
          category: result.details.category,
        }));
        toast({ title: "¡Detalles mejorados por Koli!" });
      } else {
        toast({ variant: 'destructive', title: "Error", description: result.error });
      }
      setIsRefining(false);
    };

    const handleDetailsChange = (field: keyof ProjectDetails, value: string | boolean | number | string[]) => {
        setProjectDetails({ ...projectDetails, [field]: value });
    };

    useEffect(() => {
        if (date) {
            handleDetailsChange('timeLimit', date.toISOString());
        }
    }, [date]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalles del Proyecto</CardTitle>
                <CardDescription>Define tu proyecto y tus metas para crear el plan perfecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Título del Proyecto</Label>
                    <Input id="title" placeholder="e.g., Fundamentos de JavaScript" value={title} onChange={(e) => handleDetailsChange('title', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" placeholder="Un breve resumen de lo que aprenderás." value={description} onChange={(e) => handleDetailsChange('description', e.target.value)} />
                </div>

                <Button variant="outline" onClick={handleRefine} disabled={isRefining} className="w-full">
                  <Bot className="mr-2 h-4 w-4" />
                  {isRefining ? 'Procesando...' : 'Llenado inteligente'}
                </Button>
                <Separator />
                <div className="space-y-2">
                    <Label htmlFor="objective">¿Cuál es tu objetivo de estudio?</Label>
                    <Input id="objective" placeholder="e.g., Pasar mi examen final, repasar para una entrevista..." value={objective} onChange={(e) => handleDetailsChange('objective', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="timeLimit">Límite de tiempo</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="masteryLevel">Nivel de dominio actual</Label>
                        <Slider
                            defaultValue={[2]}
                            min={0}
                            max={4}
                            step={1}
                            onValueChange={(value) => handleDetailsChange('masteryLevel', masteryLevels[value[0]])}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            {masteryLevels.map((level, index) => <span key={index}>{level}</span>)}
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                <Button onClick={goToNext} disabled={!title || !objective}>Siguiente <ChevronRight className="ml-2 h-4 w-4"/></Button>
            </CardFooter>
        </Card>
    );
};

// --- Step 3 Components ---

const CalibrationModal = ({ onCalibrate, projectDetails }: { onCalibrate: (profile: any, challenge: string) => void, projectDetails: ProjectDetails }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [cognitiveProfile, setCognitiveProfile] = useState<string[]>([]);
    const [learningChallenge, setLearningChallenge] = useState<string>('');
    
    const profileOptions = [
        "Ejemplos Prácticos y Casos Reales",
        "Analogías y Metáforas Simples",
        "Definiciones Técnicas y Precisas",
        "Estructuras Visuales (como Mapas Mentales)",
    ];

    const challengeOptions = [
        "Mantenerme concentrado y evitar distracciones",
        "Entender conceptos muy teóricos o abstractos",
        "Memorizar un gran volumen de datos específicos (fórmulas, fechas, etc.)",
        "Conectar la teoría con su aplicación práctica",
    ];

    const handleProfileChange = (option: string, checked: boolean) => {
        setCognitiveProfile(prev => 
            checked ? [...prev, option] : prev.filter(item => item !== option)
        );
    };

    const handleSubmit = () => {
        onCalibrate(cognitiveProfile, learningChallenge);
        setIsOpen(false);
        setStep(1); // Reset for next time
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="link" className="text-primary text-xs">
                    <Sparkles className="mr-2 h-4 w-4" />
                    ¿Quieres un mayor nivel de personalización? Responde un breve test para calibrar tu plan.
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{step === 1 ? 'Paso 1 de 2: Perfil Cognitivo' : 'Paso 2 de 2: Diagnóstico de Desafío'}</DialogTitle>
                    <DialogDescriptionComponent>
                        {step === 1 ? '¿Qué tipo de explicaciones te ayudan a entender mejor?' : '¿Cuál suele ser tu mayor desafío al estudiar este tipo de material?'}
                    </DialogDescriptionComponent>
                </DialogHeader>
                {step === 1 ? (
                    <div className="grid gap-4 py-4">
                        {profileOptions.map(option => (
                            <div key={option} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={option}
                                    onCheckedChange={(checked) => handleProfileChange(option, checked as boolean)}
                                    checked={cognitiveProfile.includes(option)}
                                />
                                <label htmlFor={option} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <RadioGroup onValueChange={setLearningChallenge} value={learningChallenge}>
                             {challengeOptions.map(option => (
                                <div key={option} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={option} />
                                    <Label htmlFor={option}>{option}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                )}
                <CardFooter>
                    {step === 1 ? (
                        <Button onClick={() => setStep(2)} disabled={cognitiveProfile.length === 0} className="w-full">Siguiente</Button>
                    ) : (
                        <div className="flex w-full gap-2">
                             <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
                             <Button onClick={handleSubmit} disabled={!learningChallenge} className="flex-grow">Finalizar y Regenerar Plan</Button>
                        </div>
                    )}
                </CardFooter>
            </DialogContent>
        </Dialog>
    );
};


const Step3_Plan = ({ projectDetails, setProjectDetails, flashcards, goBack, createProject, onCalibratePlan }: { projectDetails: ProjectDetails, setProjectDetails: (details: ProjectDetails) => void, flashcards: FlashcardType[], goBack: () => void, createProject: (studyPlan: StudyPlan) => void, onCalibratePlan: (profile: string[], challenge: string) => void }) => {
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const [isCalibrated, setIsCalibrated] = useState(false);

    useEffect(() => {
        const generatePlan = async () => {
            setIsGenerating(true);
            setStudyPlan(null);
            const result = await handleGenerateStudyPlan({
                projectTitle: projectDetails.title,
                objective: projectDetails.objective,
                timeLimit: projectDetails.timeLimit,
                masteryLevel: projectDetails.masteryLevel,
                flashcards: flashcards,
                cognitiveProfile: projectDetails.cognitiveProfile,
                learningChallenge: projectDetails.learningChallenge,
            });

            if (result.plan) {
                setStudyPlan(result.plan);
                if (result.plan.category) {
                  setProjectDetails({ ...projectDetails, category: result.plan.category });
                }
            } else {
                toast({ variant: 'destructive', title: 'Error al crear el plan', description: result.error });
            }
            setIsGenerating(false);
        };

        generatePlan();
    }, [projectDetails.objective, projectDetails.timeLimit, projectDetails.masteryLevel, projectDetails.cognitiveProfile, projectDetails.learningChallenge, flashcards, toast, setStudyPlan, setProjectDetails, projectDetails.title]);

    const handleCalibrate = (profile: string[], challenge: string) => {
        setIsCalibrated(true);
        onCalibratePlan(profile, challenge);
    };

    if (isGenerating) {
        return (
             <Card>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-semibold">Koli está pensando...</h2>
                    <p className="text-muted-foreground">Creando tu plan de estudios personalizado.</p>
                </CardContent>
            </Card>
        )
    }

    if (!studyPlan) {
        return (
             <Card>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[400px]">
                     <h2 className="text-xl font-semibold text-destructive">No se pudo generar el plan</h2>
                    <p className="text-muted-foreground mb-4">Ocurrió un error. Intenta volver y generar de nuevo.</p>
                     <Button variant="outline" onClick={goBack}><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>¡Conoce tu Plan de Estudios!</CardTitle>
                <CardDescription>Este es el camino que Koli ha diseñado para que alcances tu objetivo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2 text-primary">Ruta de aprendizaje</h3>
                        <Card className="bg-card/70 max-h-60 overflow-y-auto">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sesión</TableHead>
                                        <TableHead>¿Qué aprenderás en esta sesión?</TableHead>
                                        <TableHead>Tipo de Sesión</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studyPlan.plan.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.topic}</TableCell>
                                            <TableCell>{item.sessionType}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary"><BrainCircuit className="h-5 w-5"/> Justificación de Koli</h3>
                         <Card className="bg-card/70">
                            <CardContent className="p-4 text-sm text-muted-foreground prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan.justification}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary"><TrendingUp className="h-5 w-5"/> Progreso Esperado</h3>
                         <Card className="bg-card/70">
                            <CardContent className="p-4 text-sm text-muted-foreground prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan.expectedProgress}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                 <div className="text-center pt-4">
                    {isCalibrated ? (
                        <div className="text-sm text-green-400 bg-green-500/10 p-3 rounded-md flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>¡Perfecto! Tu plan ha sido recalibrado según tus preferencias.</span>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground mb-2">
                           Este plan no es definitivo, se adaptará según tu progreso.
                        </p>
                    )}
                     {!isCalibrated && <CalibrationModal onCalibrate={handleCalibrate} projectDetails={projectDetails} />}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                <Button onClick={() => createProject(studyPlan)} disabled={projectDetails.isCreating}>
                    {projectDetails.isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creando...</> : <><CheckCircle className="mr-2 h-4 w-4" />Crear Proyecto y Empezar</>}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function CreateProjectWizardPage() {
  const [step, setStep] = useState(1);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
      title: '',
      description: '',
      category: '',
      isPublic: false,
      objective: '',
      timeLimit: '',
      masteryLevel: 'Intermedio',
      isCreating: false,
      cognitiveProfile: [],
      learningChallenge: '',
  });
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  const progress = (step / 3) * 100;

  const goToNext = () => setStep(s => Math.min(s + 1, 3));
  const goBack = () => setStep(s => Math.max(s - 1, 1));
  
  const handleCalibratePlan = (profile: string[], challenge: string) => {
    setProjectDetails(current => ({
        ...current,
        cognitiveProfile: profile,
        learningChallenge: challenge,
    }));
    // The useEffect in Step3_Plan will handle the re-generation
  };

  const handleCreateFinalProject = async (studyPlan: StudyPlan | null) => {
    if (!projectDetails.title || flashcards.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Asegúrate de que el proyecto tenga un título y al menos una tarjeta.',
      });
      return;
    }
    if (!studyPlan) {
      toast({
        variant: 'destructive',
        title: 'Plan de estudios no generado',
        description: 'Por favor, genera un plan de estudios antes de crear el proyecto.',
      });
      return;
    }

    setProjectDetails(p => ({ ...p, isCreating: true }));

    // If user is a guest, store project in localStorage and redirect to project details page
    if (!user) {
        const guestProject: Project = {
            id: `guest-${Date.now()}`,
            slug: 'guest-project',
            author: 'Guest',
            isPublic: false,
            size: flashcards.length,
            bibliography: [],
            ...projectDetails,
            flashcards: flashcards.map(({ localId, question, answer, ...rest }) => ({
                ...rest,
                question,
                answer,
                concepto: question, // Map question to concepto
                descripcion: answer, // Map answer to descripcion
            })),
            studyPlan: studyPlan,
            completedSessions: 0,
        };
        localStorage.setItem('guestProject', JSON.stringify(guestProject));
        router.push('/mis-proyectos/guest-project');
        return;
    }

    // If user is logged in, save to DB
    const finalFlashcards = flashcards.map(({ localId, ...rest }) => rest);
    await handleCreateProject(
        projectDetails,
        finalFlashcards,
        studyPlan
    );
  };


  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_Input 
            flashcards={flashcards}
            setFlashcards={setFlashcards} 
            setProjectDetails={(details) => setProjectDetails(current => ({...current, ...details}))} 
            goToNext={goToNext} 
        />;
      case 2:
        return <Step2_Details 
            projectDetails={projectDetails} 
            setProjectDetails={(newDetails) => setProjectDetails(current => ({...current, ...newDetails}))} 
            flashcards={flashcards} 
            goBack={goBack} 
            goToNext={goToNext} 
        />;
      case 3:
        return <Step3_Plan 
            projectDetails={projectDetails}
            setProjectDetails={setProjectDetails}
            flashcards={flashcards} 
            goBack={goBack} 
            createProject={handleCreateFinalProject} 
            onCalibratePlan={handleCalibratePlan}
        />;
      default:
        return <div>Paso desconocido</div>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold">Crear un nuevo proyecto</h1>
            <p className="text-sm text-muted-foreground">Paso {step} de 3</p>
        </div>
        
        <Progress value={progress} className="w-full" />
        
        {renderStep()}
      </div>
    </div>
  );
}
