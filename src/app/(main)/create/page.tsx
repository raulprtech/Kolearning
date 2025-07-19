'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { handleGenerateDeckFromText } from '@/app/actions/decks';
import { Wand2, FileUp, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function CreateDeckPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const getPdfText = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ');
      fullText += '\n';
    }
    return fullText;
  }, []);

  const handleFileDrop = useCallback(async (files: FileList | null) => {
    if (files && files.length > 0) {
      const uploadedFile = files[0];
      if (uploadedFile.type === 'application/pdf') {
        setFile(uploadedFile);
        setFileName(uploadedFile.name);
        setIsLoading(true);
        try {
          const extractedText = await getPdfText(uploadedFile);
          setText(extractedText);
          toast({
            title: 'File Processed',
            description: 'Text extracted from PDF. You can now generate the deck.',
          });
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'File Error',
            description: 'Could not process the PDF file.',
          });
          setFile(null);
          setFileName('');
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
        });
      }
    }
  }, [toast, getPdfText]);

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };
  
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    handleFileDrop(e.dataTransfer.files);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileDrop(e.target.files);
  };

  const clearFile = () => {
    setFile(null);
    setFileName('');
    setText('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!text) {
        toast({
            variant: 'destructive',
            title: 'No Content',
            description: 'Please paste notes or upload a PDF before generating.',
        });
        return;
    }
    
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('studyNotes', text);
    const result = await handleGenerateDeckFromText(formData);

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error,
      });
      // Only set loading to false on error, success will redirect
      setIsLoading(false);
    }
  };

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
              Paste your study notes or upload a PDF, and we'll magically convert them into a flashcard deck for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paste-text">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="paste-text">Paste Text</TabsTrigger>
                <TabsTrigger value="upload-pdf">Upload PDF</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit}>
                <TabsContent value="paste-text">
                  <Textarea
                    name="studyNotesFromText"
                    placeholder="e.g., The pH of a neutral solution is 7. Mitochondria is the powerhouse of the cell..."
                    className="min-h-[250px] text-base"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLoading || file !== null}
                  />
                </TabsContent>
                <TabsContent value="upload-pdf">
                    {!file ? (
                        <label 
                            htmlFor="pdf-upload" 
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                            </div>
                            <input id="pdf-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={isLoading} />
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

                <div className="grid w-full gap-4 mt-4">
                  <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></span>
                        {file ? 'Processing File...' : 'Generating Deck...'}
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
            </TabsContent>
        </Card>
      </div>
    </div>
  );
}
