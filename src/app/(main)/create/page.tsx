
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
        title: 'Invalid File Type',
        description: 'Please upload a TXT or MD file.',
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
            title: 'File Ready',
            description: 'Text extracted from file. You can now generate the deck.',
        });
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Error',
            description: 'Could not read the selected file.',
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
            title: 'No Content',
            description: 'Please paste notes or upload a file before generating.',
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
            title: 'Generation Failed',
            description: result.error,
          });
          setIsLoading(false);
        }
        // On success, the page redirects via the server action, so no need to set loading to false.
    } catch (error) {
        console.error('Submission error', error);
        toast({
            variant: 'destructive',
            title: 'An Unexpected Error Occurred',
            description: 'Please try again.',
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
              <CardTitle className="text-2xl">Magic Import</CardTitle>
            </div>
            <CardDescription>
              Paste your study notes or upload a text file, and we'll magically convert them into a flashcard deck for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="paste-text" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="paste-text" disabled={!!file}>Paste Text</TabsTrigger>
                  <TabsTrigger value="upload-file">Upload File</TabsTrigger>
                </TabsList>

                <TabsContent value="paste-text">
                  <Textarea
                    name="studyNotesFromText"
                    placeholder="e.g., The pH of a neutral solution is 7. Mitochondria is the powerhouse of the cell..."
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
                                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">TXT, MD (MAX. 5MB)</p>
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
                      Generating Deck...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate Flashcards
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
