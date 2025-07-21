

'use client';

import { useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Image as ImageIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { handleGenerateProjectFromText, handleCreateProject, handleGenerateProjectFromYouTubeUrl, handlePastedTextImport as handlePastedTextImportAction, handleGenerateProjectFromPdf, handleGenerateProjectFromWebUrl, handleGenerateProjectFromQuizletUrl, handleGenerateProjectFromImages } from '@/app/actions/projects';
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

type Flashcard = {
  id: number;
  question: string;
  answer: string;
  image?: string;
};

const FlashcardEditor = ({ card, number, onCardChange, onCardDelete }: { card: Flashcard; number: number, onCardChange: (id: number, field: 'question' | 'answer', value: string) => void, onCardDelete: (id: number) => void }) => {
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

const PasteImportControls = ({
    pastedText, setPastedText,
    termSeparator, setTermSeparator, customTermSeparator, setCustomTermSeparator,
    rowSeparator, setRowSeparator, customRowSeparator, setCustomRowSeparator
}: any) => (
    <>
        <Textarea
            placeholder="Pega aquí tu texto..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="h-40 resize-none"
        />
        <Separator />
        <div className="grid grid-cols-2 gap-6">
            <div>
                <h4 className="font-medium mb-3">Entre término y definición</h4>
                <RadioGroup value={termSeparator} onValueChange={setTermSeparator} className="gap-3">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tab" id="tab" />
                        <Label htmlFor="tab">Tabulador</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="comma" id="comma" />
                        <Label htmlFor="comma">Coma</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom_term" />
                        <Label htmlFor="custom_term">Personalizado</Label>
                        <Input
                            value={customTermSeparator}
                            onChange={(e) => setCustomTermSeparator(e.target.value)}
                            disabled={termSeparator !== 'custom'}
                            className="h-8 w-24 ml-2"
                        />
                    </div>
                </RadioGroup>
            </div>
            <div>
                <h4 className="font-medium mb-3">Entre renglones</h4>
                <RadioGroup value={rowSeparator} onValueChange={setRowSeparator} className="gap-3">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="newline" id="newline" />
                        <Label htmlFor="newline">Línea nueva</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="semicolon" id="semicolon" />
                        <Label htmlFor="semicolon">Punto y coma</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom_row" />
                        <Label htmlFor="custom_row">Personalizado</Label>
                        <Input
                            value={customRowSeparator}
                            onChange={(e) => setCustomRowSeparator(e.target.value)}
                            disabled={rowSeparator !== 'custom'}
                            className="h-8 w-24 ml-2"
                            placeholder="\n\n"
                        />
                    </div>
                </RadioGroup>
            </div>
        </div>
    </>
);


const MagicImportModal = ({ onProjectGenerated, onProjectParsed }: { onProjectGenerated: (project: any) => void, onProjectParsed: (title: string, cards: Omit<Flashcard, 'id'>[]) => void }) => {
  const [view, setView] = useState<'selection' | 'upload' | 'paste' | 'anki' | 'youtube' | 'sheets' | 'web' | 'quizlet' | 'notes'>('selection');
  const [selectedSource, setSelectedSource] = useState<SourceInfo | null>(null);

  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{name: string, dataUri: string}[]>([]);
  
  const [pastedText, setPastedText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [quizletUrl, setQuizletUrl] = useState('');
  
  const [termSeparator, setTermSeparator] = useState('tab');
  const [customTermSeparator, setCustomTermSeparator] = useState('-');
  const [rowSeparator, setRowSeparator] = useState('newline');
  const [customRowSeparator, setCustomRowSeparator] = useState('\\n\\n');

  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources: SourceInfo[] = [
    { title: 'PDF', type: 'pdf', icon: <FileText />, isFileBased: true, accept: '.pdf' },
    { title: 'Apuntes', type: 'notes', icon: <Book />, isFileBased: false, accept: '.txt,.md,.tex' },
    { title: 'Imagen', type: 'image', icon: <ImageIcon />, isFileBased: true, accept: '.png,.jpg,.jpeg,.webp', multiple: true },
    { title: 'Video de YouTube', type: 'youtube', icon: <Youtube />, isFileBased: false },
    { title: 'Página Web', type: 'web', icon: <Globe />, isFileBased: false },
    { title: 'Quizlet', type: 'quizlet', icon: <FileQuestion />, isFileBased: false },
    { title: 'Anki', type: 'anki', icon: <Book />, isFileBased: false },
    { title: 'Hojas de Cálculo', type: 'sheets', icon: <FileSpreadsheet />, isFileBased: false },
  ];

  const handleSourceSelect = (source: SourceInfo) => {
    setSelectedSource(source);
    if (source.type === 'notes') {
        setView('notes');
    } else if (source.isFileBased) {
      setView('upload');
    } else if (source.type === 'quizlet') {
        setView('quizlet');
    } else if (source.type === 'anki') {
        setView('paste');
    } else if (source.type === 'youtube') {
        setView('youtube');
    } else if (source.type === 'sheets') {
        setView('sheets');
    } else if (source.type === 'web') {
        setView('web');
    } else {
      toast({ variant: 'destructive', title: 'Función no disponible', description: 'Esta opción de importación aún no está implementada.' });
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
  
  const handlePastedTextImport = async () => {
      if (!pastedText) {
          toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, pega texto para importar.' });
          return;
      }
      setIsGenerating(true);
      const parsedCards = await handlePastedTextImportAction(pastedText, termSeparator, rowSeparator, customTermSeparator, customRowSeparator);
      const projectTitle = "Importación de Texto";
      onProjectParsed(projectTitle, parsedCards);
      setIsGenerating(false);
      resetState();
      toast({ title: '¡Tarjetas Importadas!', description: `Se han añadido ${parsedCards.length} tarjetas.` });
  };
  
  const handleSheetsImport = async () => {
      if (!pastedText) {
          toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, pega texto para importar.' });
          return;
      }
      setIsGenerating(true);
      const parsedCards = await handlePastedTextImportAction(pastedText, 'tab', 'newline');
      const projectTitle = "Importación de Hoja de Cálculo";
      onProjectParsed(projectTitle, parsedCards);
      setIsGenerating(false);
      resetState();
      toast({ title: '¡Tarjetas Importadas!', description: `Se han añadido ${parsedCards.length} tarjetas.` });
  };

  const handleAiImport = async (studyNotes?: string) => {
    const content = studyNotes || fileContent;
    if (!content || typeof content !== 'string') {
      toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, sube un archivo o pega texto para generar tarjetas.' });
      return;
    }
    setIsGenerating(true);
    
    const result = await handleGenerateProjectFromText(content);

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
      toast({ title: '¡Tarjetas Generadas!', description: 'Tus nuevas tarjetas se han añadido al editor.' });
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

  const handleQuizletImport = async () => {
     if (!pastedText) {
          toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, pega texto para importar.' });
          return;
      }
      setIsGenerating(true);
      // We use 'tab' and 'newline' as Quizlet's default export separators.
      const parsedCards = await handlePastedTextImportAction(pastedText, 'tab', 'newline');
      const projectTitle = "Importación de Quizlet";
      onProjectParsed(projectTitle, parsedCards);
      setIsGenerating(false);
      resetState();
      toast({ title: '¡Tarjetas Importadas!', description: `Se han añadido ${parsedCards.length} tarjetas de tu mazo de Quizlet.` });
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
        setQuizletUrl('');
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
        <DialogDescription>Selecciona desde dónde quieres importar</DialogDescription>
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
                <DialogDescription>Sube tu archivo y Koli creará las tarjetas de estudio.</DialogDescription>
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
  
  const renderPasteView = () => (
    <>
      <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde {selectedSource?.title}</DialogTitle>
                <DialogDescription>Pega tu texto y elige los delimitadores.</DialogDescription>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
          <PasteImportControls
              pastedText={pastedText}
              setPastedText={setPastedText}
              termSeparator={termSeparator}
              setTermSeparator={setTermSeparator}
              customTermSeparator={customTermSeparator}
              setCustomTermSeparator={setCustomTermSeparator}
              rowSeparator={rowSeparator}
              setRowSeparator={setRowSeparator}
              customRowSeparator={customRowSeparator}
              setCustomRowSeparator={setCustomRowSeparator}
          />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={handlePastedTextImport} disabled={isGenerating || !pastedText} className="w-full">
              {isGenerating ? 'Importando...' : 'Importar Tarjetas'}
          </Button>
      </div>
    </>
  );

  const renderNotesView = () => (
    <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde {selectedSource?.title}</DialogTitle>
                <DialogDescription>Sube un archivo o pega tus apuntes para generar tarjetas.</DialogDescription>
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
  
  const renderAnkiView = () => (
    <>
      <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde Anki</DialogTitle>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
          <AnkiExportGuide />
           <Textarea 
              placeholder="Copia y pega aquí tu archivo 'Notas en Texto Plano (*.txt)' exportado de Anki..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="h-40 resize-none"
          />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={handlePastedTextImport} disabled={isGenerating || !pastedText}>
              {isGenerating ? 'Importando...' : 'Confirmar'}
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
                <DialogDescription>Pega la URL del video y Koli creará las tarjetas de estudio.</DialogDescription>
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
                <DialogDescription>Pega la URL de la página y Koli creará las tarjetas de estudio.</DialogDescription>
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

  const renderQuizletView = () => (
    <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde Quizlet</DialogTitle>
                <DialogDescription>
                    En Quizlet, ve a tu mazo, haz clic en el icono de tres puntos (•••), selecciona 'Exportar', copia el texto y pégalo aquí.
                </DialogDescription>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
         <Textarea
          placeholder="Pega aquí el texto exportado de Quizlet..."
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="h-60 resize-none"
        />
      </div>
      <div className="flex justify-end p-6 pt-4">
          <Button onClick={handleQuizletImport} disabled={isGenerating || !pastedText} className="w-full">
              {isGenerating ? 'Importando...' : 'Importar Tarjetas'}
          </Button>
      </div>
    </>
  );
  
  const renderSheetsView = () => (
    <>
       <DialogHeader className="p-6 pb-2">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setView('selection')} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Importar desde Hoja de Cálculo</DialogTitle>
                <DialogDescription>
                  Cada fila debe tener 1 columna (para tarjetas simples) o 2 columnas (para anverso y reverso).
                </DialogDescription>
            </div>
        </div>
      </DialogHeader>
      <div className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
        <Textarea
          placeholder="Copia y pega aquí tu hoja de cálculo"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="h-60 resize-none"
        />
      </div>
      <div className="flex justify-end p-6 pt-4 gap-2">
        <Button variant="outline" onClick={() => setView('selection')}>Volver</Button>
        <Button onClick={handleSheetsImport} disabled={isGenerating || !pastedText}>
            {isGenerating ? 'Importando...' : 'Confirmar'}
        </Button>
      </div>
    </>
  );


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline"><Wand2 className="mr-2 h-4 w-4" /> Importación Mágica</Button>
      </DialogTrigger>
      <DialogContent className={cn("max-w-xl flex flex-col p-0", (view === 'paste' || view === 'anki' || view === 'notes') && 'max-w-3xl')}>
         {view === 'selection' && renderSelectionView()}
         {view === 'upload' && renderUploadView()}
         {view === 'notes' && renderNotesView()}
         {view === 'paste' && renderPasteView()}
         {view === 'anki' && renderAnkiView()}
         {view === 'youtube' && renderYoutubeView()}
         {view === 'sheets' && renderSheetsView()}
         {view === 'web' && renderWebView()}
         {view === 'quizlet' && renderQuizletView()}
      </DialogContent>
    </Dialog>
  );
};

export default function CreateProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: 1, question: '', answer: '' },
  ]);
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const addCard = () => {
    setFlashcards(currentFlashcards => [
      ...currentFlashcards,
      { id: Date.now(), question: '', answer: '' },
    ]);
  };
  
  const handleProjectGenerated = (project: { title: string; description: string; category?: string; flashcards: { question: string; answer: string }[] }) => {
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category || '');
    const newFlashcards = project.flashcards.map((fc, index) => ({
        ...fc,
        id: Date.now() + index,
    }));
    setFlashcards(newFlashcards);
  };

  const handleProjectParsed = async (parsedTitle: string, parsedCards: Omit<Flashcard, 'id'>[]) => {
    setTitle(parsedTitle);
    setDescription(`Un conjunto de ${parsedCards.length} tarjetas importadas.`);
    setCategory('Importado');
    const newFlashcards = parsedCards.map((card, index) => ({
        ...card,
        id: Date.now() + index
    }));
    setFlashcards(newFlashcards);
  };

  const handleCardChange = (id: number, field: 'question' | 'answer', value: string) => {
    setFlashcards(currentFlashcards => 
      currentFlashcards.map(card => 
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };
  
  const handleCardDelete = (id: number) => {
    setFlashcards(currentFlashcards => currentFlashcards.filter(card => card.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim() || flashcards.some(fc => !fc.question.trim() || !fc.answer.trim())) {
        toast({
            variant: "destructive",
            title: "Faltan datos",
            description: "Asegúrate de que el proyecto tenga un título y que todas las tarjetas tengan término y definición."
        });
        return;
    }
    
    setIsCreating(true);
    const result = await handleCreateProject(title, description, category, flashcards);
    
    if (result?.project?.slug) {
        toast({
            title: "Creación exitosa",
            description: "Tu proyecto ha sido creado."
        });
        router.push(`/proyecto/${result.project.slug}/details`);
    } else {
        setIsCreating(false);
        toast({
            variant: "destructive",
            title: "Error al crear el proyecto",
            description: result?.error || "Ocurrió un error inesperado."
        });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Crear un nuevo proyecto</h1>
            <p className="text-sm text-muted-foreground">Guardada hace menos de 1 minuto</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creando..." : "Crear Proyecto"}
            </Button>
          </div>
        </header>

        {/* Title and Description */}
        <div className="space-y-4 mb-6">
          <Input 
            placeholder="Título" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-14 text-lg p-4 bg-card/70 border-primary/20"
          />
          <Textarea 
            placeholder="Añade una descripción..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] p-4 bg-card/70 border-primary/20"
          />
          <Input
            placeholder="Categoría (e.g., Programación, Historia, etc.)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-12 text-base p-4 bg-card/70 border-primary/20"
          />
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <MagicImportModal onProjectGenerated={handleProjectGenerated} onProjectParsed={handleProjectParsed} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
                <Switch id="visibility" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="visibility">{isPublic ? 'Público' : 'Privado'}</Label>
            </div>
          </div>
        </div>

        {/* Flashcard List */}
        <div className="space-y-4">
            {flashcards.map((card, index) => (
                <FlashcardEditor key={card.id} card={card} number={index + 1} onCardChange={handleCardChange} onCardDelete={handleCardDelete} />
            ))}
        </div>

        {/* Add Card Button */}
        <div className="mt-6">
            <Button variant="outline" className="w-full h-12 border-dashed" onClick={addCard}>
                <Plus className="mr-2 h-5 w-5" />
                Añadir tarjeta
            </Button>
        </div>

      </div>
    </div>
  );
}
