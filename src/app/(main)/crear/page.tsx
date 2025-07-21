
'use client';

import { useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Bot
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent
} from '@/components/ui/dialog';
import { handleGenerateProjectFromText, handleCreateProject, handleGenerateProjectFromYouTubeUrl, handlePastedTextImport as handlePastedTextImportAction, handleGenerateProjectFromPdf, handleGenerateProjectFromWebUrl, handleGenerateProjectFromImages, handleGenerateStudyPlan, handleRefineProjectDetails } from '@/app/actions/projects';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { AnkiExportGuide } from '@/components/deck/AnkiExportGuide';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { Flashcard as FlashcardType, StudyPlan, ProjectDetails } from '@/types';

type Flashcard = {
  id: number | string;
  question: string;
  answer: string;
  image?: string;
};

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
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onCardDelete(card.id)}>
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
              onChange={(e) => onCardChange(card.id, 'question', e.target.value)}
            />
            <Label className="text-xs text-muted-foreground pl-2">TÉRMINO</Label>
          </div>
          <div className="flex-1 grid gap-2">
              <Textarea
                  placeholder="Definición" 
                  className="bg-background/50 h-24 resize-none"
                  value={card.answer}
                  onChange={(e) => onCardChange(card.id, 'answer', e.target.value)}
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

const MagicImportModal = ({ onProjectGenerated, onProjectParsed }: { onProjectGenerated: (project: any) => void, onProjectParsed: (title: string, cards: Omit<Flashcard, 'id'>[]) => void }) => {
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
    { title: 'Video de YouTube', type: 'youtube', icon: <Youtube />, isFileBased: false },
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
    const content = studyNotes || fileContent;
    if (!content || (typeof content !== 'string' && !Array.isArray(content))) {
      toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, sube un archivo o pega texto para generar tarjetas.' });
      return;
    }
    setIsGenerating(true);
    
    const result = await handleGenerateProjectFromText(content as string);

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
    if (!youtubeUrl) {
      toast({ variant: 'destructive', title: 'URL Vacía', description: 'Por favor, introduce una URL de YouTube.' });
      return;
    }
    setIsGenerating(true);
    
    const result = await handleGenerateProjectFromYouTubeUrl(youtubeUrl);
    setIsGenerating(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    } else if (result.project) {
      onProjectGenerated(result.project);
      resetState();
      toast({ title: `¡Tarjetas Generadas desde "${result.project.title}"!`, description: 'Tus nuevas tarjetas se han añadido al editor.' });
    }
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
    const parsedCards = await handlePastedTextImportAction(text, '\t', '\n');
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
                <DialogTitle>Importar desde Hoja de Cálculo</DialogTitle>
                <DialogDescriptionComponent>
                  Cada fila debe tener 1 columna (para tarjetas simples) o 2 columnas (para tarjetas con anverso y reverso).
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
      <div className="flex justify-between p-6 pt-4">
          <Button variant="outline" onClick={() => setView('selection')}>Volver</Button>
          <Button onClick={() => handleManualTextImport(pastedText, "Hoja de Cálculo")} disabled={isGenerating || !pastedText}>
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


const Step1_Input = ({ setFlashcards, setProjectDetails, goToNext }: { setFlashcards: (cards: Flashcard[]) => void, setProjectDetails: (details: any) => void, goToNext: () => void }) => {
    const [showManual, setShowManual] = useState(false);
    const [manualFlashcards, setManualFlashcards] = useState<Flashcard[]>([{ id: 1, question: '', answer: '' }]);

    const addCard = () => {
        setManualFlashcards(current => [...current, { id: Date.now(), question: '', answer: '' }]);
    };
    
    const handleCardChange = (id: number | string, field: 'question' | 'answer', value: string) => {
        setManualFlashcards(current => current.map(card => card.id === id ? { ...card, [field]: value } : card));
    };

    const handleCardDelete = (id: number | string) => {
        setManualFlashcards(current => current.filter(card => card.id !== id));
    };

    const handleProjectGenerated = (project: any) => {
        const newFlashcards = project.flashcards.map((fc: any, index: number) => ({ ...fc, id: Date.now() + index }));
        setFlashcards(newFlashcards);
        setProjectDetails({ title: project.title, description: project.description, category: project.category || '' });
        goToNext();
    };

    const handleProjectParsed = (title: string, cards: Omit<Flashcard, 'id'>[]) => {
        const newFlashcards = cards.map((card, index) => ({ ...card, id: Date.now() + index }));
        setFlashcards(newFlashcards);
        setProjectDetails({ title, description: `Un conjunto de ${cards.length} tarjetas importadas.`, category: 'Importado' });
        goToNext();
    };

    const handleContinueWithManual = () => {
        if (manualFlashcards.some(fc => !fc.question.trim() || !fc.answer.trim())) {
            // Optional: Add toast notification
            return;
        }
        setFlashcards(manualFlashcards);
        setProjectDetails({ title: '', description: '', category: '' });
        goToNext();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ingresa tu material de estudio</CardTitle>
                <CardDescription>Importa tu material usando IA o agrégalo manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <MagicImportModal onProjectGenerated={handleProjectGenerated} onProjectParsed={handleProjectParsed} />
                <Button variant="outline" size="lg" onClick={() => setShowManual(prev => !prev)}>
                    <PencilIcon className="mr-2 h-5 w-5" /> Agregar manualmente
                </Button>
                {showManual && (
                    <div className="w-full mt-4 space-y-4">
                        <div className="space-y-4">
                            {manualFlashcards.map((card, index) => (
                                <FlashcardEditor key={card.id} card={card} number={index + 1} onCardChange={handleCardChange} onCardDelete={handleCardDelete} />
                            ))}
                        </div>
                        <Button variant="outline" className="w-full h-12 border-dashed" onClick={addCard}>
                            <Plus className="mr-2 h-5 w-5" /> Añadir tarjeta
                        </Button>
                        <Button onClick={handleContinueWithManual} className="w-full">
                            Continuar con tarjetas manuales <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Step 2 Components ---

const Step2_Details = ({ projectDetails, setProjectDetails, flashcards, goBack, goToNext }: { projectDetails: ProjectDetails, setProjectDetails: (details: ProjectDetails) => void, flashcards: Flashcard[], goBack: () => void, goToNext: () => void }) => {
    const { title, description, category, isPublic } = projectDetails;
    const [isRefining, setIsRefining] = useState(false);
    const { toast } = useToast();

    const handleRefine = async () => {
      setIsRefining(true);
      const result = await handleRefineProjectDetails({
        currentTitle: title,
        currentDescription: description,
        flashcards: flashcards,
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

    const handleDetailsChange = (field: keyof ProjectDetails, value: string | boolean) => {
        setProjectDetails({ ...projectDetails, [field]: value });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalles del Proyecto</CardTitle>
                <CardDescription>Dale un nombre y describe tu nuevo plan de estudios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" placeholder="e.g., Fundamentos de JavaScript" value={title} onChange={(e) => handleDetailsChange('title', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" placeholder="Un breve resumen de lo que aprenderás." value={description} onChange={(e) => handleDetailsChange('description', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input id="category" placeholder="e.g., Programación, Historia" value={category} onChange={(e) => handleDetailsChange('category', e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="visibility">¿Hacer público?</Label>
                    <Switch id="visibility" checked={isPublic} onCheckedChange={(checked) => handleDetailsChange('isPublic', checked)} />
                </div>
                <Button variant="outline" onClick={handleRefine} disabled={isRefining} className="w-full">
                  <Bot className="mr-2 h-4 w-4" />
                  {isRefining ? 'Mejorando...' : 'Ayúdame a mejorar'}
                </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                <Button onClick={goToNext} disabled={!title}>Siguiente <ChevronRight className="ml-2 h-4 w-4"/></Button>
            </CardFooter>
        </Card>
    );
};

// --- Step 3 Components ---

const Step3_Plan = ({ projectDetails, flashcards, goBack, createProject }: { projectDetails: ProjectDetails, flashcards: FlashcardType[], goBack: () => void, createProject: (studyPlan: StudyPlan | null) => void }) => {
    const [objective, setObjective] = useState('');
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGeneratePlan = async () => {
        if (!objective) {
            toast({ variant: 'destructive', title: 'Falta el objetivo', description: 'Por favor, dinos cuál es tu objetivo de estudio.' });
            return;
        }
        setIsGenerating(true);
        const result = await handleGenerateStudyPlan({
            projectTitle: projectDetails.title,
            objective: objective,
            flashcards: flashcards,
        });

        if (result.plan) {
            setStudyPlan(result.plan);
            toast({ title: "¡Plan de estudios generado!" });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsGenerating(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan de Estudios Personalizado</CardTitle>
                <CardDescription>Define tu meta y deja que Koli organice el camino más eficiente para ti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="objective">¿Cuál es tu objetivo con este material?</Label>
                    <Input id="objective" placeholder="e.g., Pasar mi examen final, repasar para una entrevista..." value={objective} onChange={(e) => setObjective(e.target.value)} />
                </div>

                {!studyPlan && (
                    <Button onClick={handleGeneratePlan} disabled={isGenerating} className="w-full">
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGenerating ? 'Creando plan...' : 'Crear mi Plan de Estudios'}
                    </Button>
                )}
                
                {studyPlan && (
                    <div className="space-y-4 pt-4 border-t">
                        <div>
                            <h3 className="font-semibold mb-2">Previsualización del Plan</h3>
                            <Card className="bg-card/70 max-h-60 overflow-y-auto">
                                <CardContent className="p-4 space-y-2">
                                    {studyPlan.plan.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-background/50">
                                            <div className='flex items-center gap-2'>
                                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.section}</span>
                                                <p>{item.topic}</p>
                                            </div>
                                            <p className="text-primary font-medium">{item.sessionType}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Justificación de Koli</h3>
                             <Card className="bg-card/70">
                                <CardContent className="p-4 text-sm text-muted-foreground prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan.justification}</ReactMarkdown>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                <Button onClick={() => createProject(studyPlan)} disabled={!studyPlan || projectDetails.isCreating}>
                    {projectDetails.isCreating ? 'Creando...' : 'Crear Proyecto'}
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
      isCreating: false,
  });
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const progress = (step / 3) * 100;

  const goToNext = () => setStep(s => Math.min(s + 1, 3));
  const goBack = () => setStep(s => Math.max(s - 1, 1));
  
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

    const result = await handleCreateProject(
        projectDetails,
        flashcards,
        studyPlan
    );
    
    if (result?.project?.slug) {
        toast({
            title: '¡Creación exitosa!',
            description: 'Tu nuevo plan de estudios está listo.',
        });
        router.push(`/proyecto/${result.project.slug}/details`);
    } else {
        setProjectDetails(p => ({ ...p, isCreating: false }));
        toast({
            variant: 'destructive',
            title: 'Error al crear el proyecto',
            description: result?.error || 'Ocurrió un error inesperado.',
        });
    }
  };


  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1_Input 
            setFlashcards={setFlashcards} 
            setProjectDetails={(details) => setProjectDetails(current => ({...current, ...details}))} 
            goToNext={goToNext} 
        />;
      case 2:
        return <Step2_Details 
            projectDetails={projectDetails} 
            setProjectDetails={setProjectDetails} 
            flashcards={flashcards} 
            goBack={goBack} 
            goToNext={goToNext} 
        />;
      case 3:
        return <Step3_Plan 
            projectDetails={projectDetails} 
            flashcards={flashcards} 
            goBack={goBack} 
            createProject={handleCreateFinalProject} 
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
