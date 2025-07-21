
'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { handleGenerateDeckFromText } from '@/app/actions/decks';
import { Wand2, FileUp, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CreateDeckPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const processFile = useCallback((fileToProcess: File) => {
    const allowedTypes = ['text/plain', 'text/markdown'];
    const isAllowedType = allowedTypes.includes(fileToProcess.type) || fileToProcess.name.endsWith('.md') || fileToProcess.name.endsWith('.txt');

    if (!isAllowedType) {
      toast({
        variant: 'destructive',
        title: 'Tipo de archivo no válido',
        description: 'Por favor, sube un archivo TXT o MD.',
      });
      return;
    }

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
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Importación Mágica</CardTitle>
            </div>
            <CardDescription>
              Pega tus notas de estudio o sube un archivo de texto, y los convertiremos mágicamente en un mazo de tarjetas para ti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="paste-text" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="paste-text" disabled={!!file}>Pegar Texto</TabsTrigger>
                  <TabsTrigger value="upload-file">Subir Archivo</TabsTrigger>
                </TabsList>

                <TabsContent value="paste-text">
                  <Textarea
                    name="studyNotesFromText"
                    placeholder="Ej: El pH de una solución neutra es 7. La mitocondria es la central energética de la célula..."
                    className="min-h-[250px] text-base"
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
                
              <div className="grid w-full gap-4 mt-6">
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
