'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { handleGenerateDeckFromText } from '@/app/actions/decks';
import { Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateDeckPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await handleGenerateDeckFromText(formData);

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error,
      });
      setIsLoading(false);
    }
    // On success, the action handles the redirect, so we don't need to do anything here.
    // If we reach here, it's likely the redirect is happening.
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
              Paste your study notes below, and we'll magically convert them into a flashcard deck for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid w-full gap-4">
                <Textarea
                  name="studyNotes"
                  placeholder="e.g., The pH of a neutral solution is 7. Mitochondria is the powerhouse of the cell..."
                  className="min-h-[250px] text-base"
                  disabled={isLoading}
                />
                <Button type="submit" size="lg" disabled={isLoading}>
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
