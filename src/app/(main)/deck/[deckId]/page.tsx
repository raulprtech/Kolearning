import type { Deck, Flashcard } from '@/types';
import FlashcardViewer from './FlashcardViewer';

async function getDeckDetails(deckId: string): Promise<Deck | null> {
  // Return mock data since auth and firestore are disabled
  const mockDecks: Record<string, Deck> = {
    '1': { id: '1', title: 'Basic Algebra', description: 'Learn the fundamentals of algebra.' },
    '2': { id: '2', title: 'World Capitals', description: 'Test your knowledge of world capitals.' },
    '3': { id: '3', title: 'Spanish Vocabulary', description: 'Expand your Spanish vocabulary.' },
  };

  if (mockDecks[deckId]) {
    return mockDecks[deckId];
  }

  console.error(`Error fetching deck ${deckId}: Not found in mock data`);
  return null;
}

async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  // Return mock data since auth and firestore are disabled
  const mockFlashcards: Record<string, Flashcard[]> = {
      '1': [
          {id: '1', question: 'What is `x` in `2x + 3 = 7`?', answer: '`x = 2`'},
          {id: '2', question: 'What is `(a+b)²`?', answer: '`a² + 2ab + b²`'},
          {id: '3', question: 'Solve for y: `y/3 = 4`', answer: '`y = 12`'},
          {id: '4', question: 'What is the slope of `y = 3x - 5`?', answer: 'The slope is `3`.'},
          {id: '5', question: 'Factor `x² - 9`', answer: '`(x-3)(x+3)`'},
          {id: '6', question: 'What is the value of 5! (5 factorial)?', answer: '`120`'},
      ],
      '2': [
          {id: '1', question: 'What is the capital of Japan?', answer: 'Tokyo'},
          {id: '2', question: 'What is the capital of Australia?', answer: 'Canberra'},
          {id: '3', question: 'What is the capital of Canada?', answer: 'Ottawa'},
          {id: '4', question: 'What is the capital of Brazil?', answer: 'Brasília'},
          {id: '5', question: 'What is the capital of Egypt?', answer: 'Cairo'},
      ],
      '3': [
          {id: '1', question: 'Hello', answer: 'Hola'},
          {id: '2', question: 'Goodbye', answer: 'Adiós'},
          {id: '3', question: 'Thank you', answer: 'Gracias'},
          {id: '4', question: 'Please', answer: 'Por favor'},
          {id: '5', question: 'Yes', answer: 'Sí'},
          {id: '6', question: 'No', answer: 'No'},
          {id: '7', question: 'Water', answer: 'Agua'},
      ],
  };

  if (mockFlashcards[deckId]) {
    return mockFlashcards[deckId];
  }
  
  console.error(`Error fetching flashcards for deck ${deckId}: Not found in mock data`);
  return [];
}

export default async function DeckPage({ params }: { params: { deckId: string } }) {
  const deck = await getDeckDetails(params.deckId);
  const flashcards = await getFlashcards(params.deckId);

  if (!deck) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Deck not found</h1>
        <p className="text-muted-foreground">The requested deck does not exist.</p>
      </div>
    );
  }

  return <FlashcardViewer deck={deck} initialFlashcards={flashcards} />;
}
