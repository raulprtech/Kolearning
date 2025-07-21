
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Settings, 
  Undo, 
  Redo, 
  Trash2, 
  GripVertical, 
  Wand2, 
  Image as ImageIcon,
  PlusCircle,
  FileText,
  Lock,
  Mic,
  Palette,
  Type,
  ZoomIn,
  ZoomOut,
  UploadCloud
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { handleGenerateDeckFromText } from '@/app/actions/decks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
            <Button variant="ghost" size="icon" className="cursor-grab">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
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
          <div className="flex items-center gap-4">
            <div className="flex-1 grid gap-2">
                <Textarea
                    placeholder="Definición" 
                    className="bg-background/50 h-24 resize-none"
                    value={card.answer}
                    onChange={(e) => onCardChange(card.id, 'answer', e.target.value)}
                />
                <Label className="text-xs text-muted-foreground pl-2">DEFINICIÓN</Label>
            </div>
            <div className="grid gap-2 text-center">
                <button className="h-12 w-24 border-2 border-dashed border-muted-foreground/50 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </button>
                 <Label className="text-xs text-muted-foreground">IMAGEN</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MagicImportModal = ({ onDeckGenerated }: { onDeckGenerated: (deck: any) => void }) => {
  const [fileContent, setFileContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSize, setPreviewSize] = useState(1);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = ['prose-sm', 'prose-base', 'prose-lg', 'prose-xl', 'prose-2xl'];

  const handleZoomIn = () => setPreviewSize(prev => Math.min(prev + 1, sizeClasses.length - 1));
  const handleZoomOut = () => setPreviewSize(prev => Math.max(prev - 1, 0));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileContent) {
      toast({
        variant: 'destructive',
        title: 'No hay contenido',
        description: 'Por favor, sube un archivo para generar tarjetas.',
      });
      return;
    }
    setIsGenerating(true);
    
    const result = await handleGenerateDeckFromText(fileContent);

    setIsGenerating(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error de Generación',
        description: result.error,
      });
    } else if (result.deck) {
      onDeckGenerated(result.deck);
      setIsOpen(false); // Close the modal on success
      toast({
        title: '¡Tarjetas Generadas!',
        description: 'Tus nuevas tarjetas se han añadido al editor.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Wand2 className="mr-2 h-4 w-4" /> Importación Mágica</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importación Mágica</DialogTitle>
          <DialogDescription>
            Sube un archivo y la IA creará las tarjetas de estudio por ti.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
          <div 
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleFileClick}
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-2">Arrastra y suelta tu archivo aquí</p>
            <p className="text-xs text-muted-foreground mb-4">o</p>
            <Button type="button" variant="secondary">Buscar archivo</Button>
            <Input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.md,.tex"
            />
          </div>
          <div className="flex flex-col gap-4">
            <Card className="flex-grow flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-2 border-b flex justify-between items-center">
                   <p className="text-sm font-medium px-3">Vista Previa del Archivo</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="p-4 overflow-auto flex-grow">
                  {fileContent ? (
                    <div className={cn('prose prose-invert max-w-none', sizeClasses[previewSize])}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {fileContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>Sube un archivo para ver la vista previa.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? 'Generando...' : 'Generar Tarjetas'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function CreateProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: 1, question: '', answer: '' },
  ]);
  const [suggestions, setSuggestions] = useState(true);

  const addCard = () => {
    setFlashcards(currentFlashcards => [
      ...currentFlashcards,
      { id: Date.now(), question: '', answer: '' },
    ]);
  };
  
  const handleDeckGenerated = (deck: { title: string; description: string; flashcards: { question: string; answer: string }[] }) => {
    setTitle(deck.title);
    setDescription(deck.description);
    const newFlashcards = deck.flashcards.map((fc, index) => ({
        ...fc,
        id: Date.now() + index, // Ensure unique IDs
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
            <Button variant="outline">Crear</Button>
            <Button>Crear y practicar</Button>
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
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <MagicImportModal onDeckGenerated={handleDeckGenerated} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
                <Switch id="suggestions" checked={suggestions} onCheckedChange={setSuggestions} />
                <Label htmlFor="suggestions">Sugerencias</Label>
            </div>
             <div className="flex items-center gap-1 p-1 rounded-md bg-card/70">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Undo className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Redo className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
