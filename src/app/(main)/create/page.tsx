
'use client';

import { useState } from 'react';
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
  ZoomOut
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { handleGenerateDeckFromText } from '@/app/actions/decks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';

type Flashcard = {
  id: number;
  term: string;
  definition: string;
  image?: string;
};

const FlashcardEditor = ({ card, number }: { card: Flashcard; number: number }) => {
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
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1 grid gap-2">
            <Input 
              placeholder="Término" 
              className="bg-background/50 h-12" 
            />
            <Label className="text-xs text-muted-foreground pl-2">TÉRMINO</Label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 grid gap-2">
                <Input 
                    placeholder="Definición" 
                    className="bg-background/50 h-12" 
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

const MagicImportModal = () => {
  const [notes, setNotes] = useState('## Álgebra Básica\n\n- **Pregunta:** ¿Qué es `x` en `2x + 3 = 7`?\n- **Respuesta:** `x = 2`\n\n- **Pregunta:** ¿Cuál es la fórmula para el área de un círculo?\n- **Respuesta:** $A = \\pi r^2$');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSize, setPreviewSize] = useState(1); // 0=sm, 1=base, 2=lg, 3=xl

  const sizeClasses = ['prose-sm', 'prose-base', 'prose-lg', 'prose-xl', 'prose-2xl'];

  const handleZoomIn = () => setPreviewSize(prev => Math.min(prev + 1, sizeClasses.length - 1));
  const handleZoomOut = () => setPreviewSize(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    const formData = new FormData(event.currentTarget);
    await handleGenerateDeckFromText(formData);
    // The redirect will happen in the server action, no need to set isGenerating to false
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline"><Wand2 className="mr-2 h-4 w-4" /> Importación Mágica</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>Importación Mágica</DialogTitle>
          <DialogDescription>
            Pega tus apuntes o sube un archivo y la IA creará las tarjetas de estudio por ti.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
          <div className="flex flex-col gap-4">
            <Tabs defaultValue="paste" className="flex-grow flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Pegar Texto</TabsTrigger>
                <TabsTrigger value="upload" disabled>Subir Archivo</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="flex-grow flex flex-col">
                <Textarea
                  name="studyNotes"
                  placeholder="Pega aquí tus apuntes. Puedes usar Markdown y LaTeX..."
                  className="flex-grow w-full h-full resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>
          <div className="flex flex-col gap-4">
            <Card className="flex-grow flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-2 border-b flex justify-between items-center">
                   <Tabs defaultValue="preview" className="w-full">
                    <TabsList>
                      <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                      <TabsTrigger value="source">Fuente</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="p-4 overflow-auto flex-grow">
                  <div className={cn('prose prose-invert max-w-none', sizeClasses[previewSize])}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {notes}
                    </ReactMarkdown>
                  </div>
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
    { id: 1, term: '', definition: '' },
  ]);
  const [suggestions, setSuggestions] = useState(true);

  const addCard = () => {
    setFlashcards([
      ...flashcards,
      { id: Date.now(), term: '', definition: '' },
    ]);
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
            <MagicImportModal />
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
                <FlashcardEditor key={card.id} card={card} number={index + 1} />
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
