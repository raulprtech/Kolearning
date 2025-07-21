
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
  Mic,
  FileQuestion,
  Book,
  FileSpreadsheet,
  Globe,
  ArrowLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { handleGenerateProjectFromText, handleCreateProject } from '@/app/actions/projects';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import { useToast } from '@/hooks/use-toast';

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

type ImportSource = 'pdf' | 'powerpoint' | 'lecture' | 'notes' | 'youtube' | 'quizlet' | 'anki' | 'sheets' | 'web' | 'gizmo';

const MagicImportModal = ({ onProjectGenerated, onProjectParsed }: { onProjectGenerated: (project: any) => void, onProjectParsed: (title: string, cards: Omit<Flashcard, 'id'>[]) => void }) => {
  const [view, setView] = useState<'selection' | 'upload'>('selection');
  const [selectedSource, setSelectedSource] = useState<{ title: string; type: ImportSource; accept?: string; isFileBased: boolean; } | null>(null);

  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources = [
    { title: 'PDF', type: 'pdf', icon: <FileText />, isFileBased: true, accept: '.pdf' },
    { title: 'Notes', type: 'notes', icon: <Book />, isFileBased: true, accept: '.txt,.md,.tex' },
    { title: 'Gizmo.ai', type: 'gizmo', icon: <FileQuestion />, isFileBased: true, accept: '.txt' },
    { title: 'YouTube video', type: 'youtube', icon: <Youtube />, isFileBased: false },
    { title: 'Record Lecture', type: 'lecture', icon: <Mic />, isFileBased: false },
    { title: 'Quizlet', type: 'quizlet', icon: <FileQuestion />, isFileBased: false },
    { title: 'Anki', type: 'anki', icon: <Book />, isFileBased: true },
    { title: 'Sheets', type: 'sheets', icon: <FileSpreadsheet />, isFileBased: true },
    { title: 'Web page', type: 'web', icon: <Globe />, isFileBased: false },
  ];

  const handleSourceSelect = (source: (typeof sources)[0]) => {
    setSelectedSource(source);
    if (source.isFileBased) {
      setView('upload');
    } else {
      toast({ variant: 'destructive', title: 'Función no disponible', description: 'Esta opción de importación aún no está implementada.' });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
      };
      reader.readAsText(file);
    }
  };
  
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const parseGizmoFile = (content: string): Omit<Flashcard, 'id'>[] => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const cards: Omit<Flashcard, 'id'>[] = [];
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i+1]) {
        cards.push({
          question: lines[i].trim(),
          answer: lines[i+1].trim(),
        });
      }
    }
    return cards;
  };

  const handleGizmoImport = () => {
    if (!fileContent) {
      toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, sube un archivo.' });
      return;
    }
    setIsGenerating(true);
    const parsedCards = parseGizmoFile(fileContent);
    const projectTitle = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    onProjectParsed(projectTitle, parsedCards);
    setIsGenerating(false);
    resetState();
    toast({ title: '¡Tarjetas Importadas!', description: 'Tus tarjetas de Gizmo.ai se han añadido.' });
  };

  const handleAiImport = async () => {
    if (!fileContent) {
      toast({ variant: 'destructive', title: 'No hay contenido', description: 'Por favor, sube un archivo para generar tarjetas.' });
      return;
    }
    setIsGenerating(true);
    
    const result = await handleGenerateProjectFromText(fileContent);

    setIsGenerating(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error de Generación', description: result.error });
    } else if (result.project) {
      onProjectGenerated(result.project);
      resetState();
      toast({ title: '¡Tarjetas Generadas!', description: 'Tus nuevas tarjetas se han añadido al editor.' });
    }
  };

  const resetState = () => {
    setIsOpen(false);
    setView('selection');
    setSelectedSource(null);
    setFileName('');
    setFileContent('');
    setIsGenerating(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
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

  const renderUploadView = () => (
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
      </div>
      <div className="flex justify-end p-6 pt-0 gap-4">
          {selectedSource?.type === 'gizmo' ? (
            <Button onClick={handleGizmoImport} disabled={isGenerating || !fileContent} className="w-full">
                {isGenerating ? 'Importando...' : 'Importar Tarjetas'}
            </Button>
          ) : (
             <Button onClick={handleAiImport} disabled={isGenerating || !fileContent} className="w-full">
                {isGenerating ? 'Generando...' : 'Generar con IA'}
            </Button>
          )}
      </div>
    </>
  );


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline"><Wand2 className="mr-2 h-4 w-4" /> Importación Mágica</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl flex flex-col p-0">
         {view === 'selection' ? renderSelectionView() : renderUploadView()}
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

  const handleProjectParsed = (parsedTitle: string, parsedCards: Omit<Flashcard, 'id'>[]) => {
    setTitle(parsedTitle);
    setDescription(`Un conjunto de ${parsedCards.length} tarjetas importadas desde un archivo de Gizmo.ai.`);
    setCategory('Gizmo Import');
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
    
    if (result?.slug) {
        toast({
            title: "Creación exitosa",
            description: "Tu proyecto ha sido creado."
        });
        router.push(`/proyecto/${result.slug}/detalles`);
        setIsCreating(false);
    } else {
        toast({
            variant: "destructive",
            title: "Error al crear el proyecto",
            description: result?.error || "Ocurrió un error inesperado."
        });
        setIsCreating(false);
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

    
    