
'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { handleGenerateDeckFromText } from '@/app/actions/decks';
import { Wand2, FileUp, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

const sizeClasses = ['prose-xs', 'prose-sm', 'prose-base', 'prose-lg', 'prose-xl'];

export default function CreateDeckPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('## Álgebra Básica\n\nAquí tienes algunas notas sobre álgebra.\n\n### Ecuaciones Lineales\nUna ecuación lineal es una ecuación de primer grado. Por ejemplo:\n$2x + 3 = 7$\n\nPara resolverla, restamos 3 de ambos lados:\n$2x = 4$\n\nLuego dividimos por 2:\n$x = 2$\n\n### Fórmulas Cuadráticas\nLa fórmula cuadrática para $ax^2 + bx + c = 0$ es:\n$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$\n');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewSize, setPreviewSize] = useState(2); // Corresponds to prose-base
  const { toast } = useToast();

  const handleZoomIn = () => {
    setPreviewSize(prev => Math.min(prev + 1, sizeClasses.length - 1));
  };
  
  const handleZoomOut = () => {
    setPreviewSize(prev => Math.max(prev - 1, 0));
  };

  const processFile = useCallback((fileToProcess: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const fileText = e.target?.result as string;
        setText(fileText);
        setFile(fileToProcess);
        setFileName(fileToProcess.name);
        toast({
            title: 'Archivo listo',
            description: 'Texto extraído del archivo. Ahora puedes generar el mazo.',
        });
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Error de archivo',
            description: 'No se pudo leer el archivo seleccionado.',
        });
        setFile(null);
        setFileName('');
        setText('');
    };
    reader.readAsText(fileToProcess);
  }, [toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const clearFile = useCallback(() => {
    setFile(null);
    setFileName('');
    setText('');
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!text) {
        toast({
            variant: 'destructive',
            title: 'No hay contenido',
            description: 'Por favor, pega tus notas o sube un archivo antes de generar.',
        });
        return;
    }
    
    setIsLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('studyNotes', text);
        const result = await handleGenerateDeckFromText(formData);

        if (result?.error) {
          toast({
            variant: 'destructive',
            title: 'Falló la generación',
            description: result.error,
          });
          setIsLoading(false);
        }
        // On success, the page redirects via the server action, so no need to set loading to false.
    } catch (error) {
        console.error('Submission error', error);
        toast({
            variant: 'destructive',
            title: 'Ocurrió un error inesperado',
            description: 'Por favor, inténtalo de nuevo.',
        });
        setIsLoading(false);
    }
  }, [text, toast]);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-start mb-6">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wand2 className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Importación Mágica</h1>
                  </div>
                  <p className="text-muted-foreground">
                    Pega tus notas (en Markdown y LaTeX) o sube un archivo, y los convertiremos en un mazo.
                  </p>
              </div>
               <Button type="submit" size="lg" disabled={isLoading || !text}>
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></span>
                      Generando Mazo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generar Tarjetas
                    </>
                  )}
                </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Editor Column */}
              <Card>
                  <CardHeader>
                      <CardTitle>Editor</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Tabs defaultValue="paste-text" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="paste-text" disabled={!!file}>Pegar Texto</TabsTrigger>
                              <TabsTrigger value="upload-file">Subir Archivo</TabsTrigger>
                          </TabsList>
                          <TabsContent value="paste-text">
                              <Textarea
                                  name="studyNotesFromText"
                                  placeholder="Ej: El pH de una solución neutra es 7. La mitocondria es la central energética de la célula..."
                                  className="min-h-[400px] text-base font-mono"
                                  value={text}
                                  onChange={(e) => setText(e.target.value)}
                                  disabled={isLoading || !!file}
                              />
                          </TabsContent>
                          <TabsContent value="upload-file">
                              {!file ? (
                                  <label
                                      htmlFor="file-upload"
                                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                                      onDragOver={onDragOver}
                                      onDrop={onDrop}
                                  >
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                          <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                                          <p className="mb-2 text-sm text-muted-foreground">
                                              <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta
                                          </p>
                                          <p className="text-xs text-muted-foreground">TXT, MD (MÁX. 5MB)</p>
                                      </div>
                                      <input id="file-upload" type="file" className="hidden" accept=".txt,.md,text/plain,text/markdown" onChange={handleFileChange} disabled={isLoading} />
                                  </label>
                              ) : (
                                  <div className="flex items-center justify-between w-full h-24 border-2 border-dashed rounded-lg p-4 bg-muted">
                                      <p className="font-medium truncate">{fileName}</p>
                                      <Button variant="ghost" size="icon" onClick={clearFile} disabled={isLoading}>
                                          <X className="h-5 w-5" />
                                      </Button>
                                  </div>
                              )}
                          </TabsContent>
                      </Tabs>
                  </CardContent>
              </Card>

              {/* Preview Column */}
              <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Vista Previa</CardTitle>
                      <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="icon" onClick={handleZoomOut} disabled={previewSize === 0}>
                              <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="outline" size="icon" onClick={handleZoomIn} disabled={previewSize === sizeClasses.length - 1}>
                              <ZoomIn className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                      <div className={cn("prose prose-invert max-w-none p-4 border rounded-md min-h-[464px] bg-background/50 prose-p:my-2 prose-p:leading-relaxed prose-pre:bg-black/50 prose-headings:text-foreground prose-strong:text-foreground", sizeClasses[previewSize])}>
                          <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                          >
                              {text}
                          </ReactMarkdown>
                      </div>
                  </CardContent>
              </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
