import type { Deck, Flashcard } from '@/types';
import FlashcardViewer from './FlashcardViewer';
import { getGeneratedDeck } from '@/app/actions/decks';

async function getDeckDetails(deckId: string): Promise<Deck | null> {
  if (deckId.startsWith('gen-')) {
    const deck = await getGeneratedDeck(deckId);
    return deck ? { ...deck, flashcards: undefined } : null;
  }
  return null;
}

async function getFlashcards(deckId: string, deck: Deck | null): Promise<Flashcard[]> {
  // if it's a generated deck, flashcards are part of the deck object
  if (deckId.startsWith('gen-')) {
      const fullDeck = await getGeneratedDeck(deckId);
      return fullDeck?.flashcards || [];
  }
  
  console.error(`Error fetching flashcards for deck ${deckId}: Not found in mock data`);
  return [];
}

export default async function DeckPage({ params }: { params: { deckId: string } }) {
  const { deckId } = params;
  const deck = await getDeckDetails(deckId);
  const flashcards = await getFlashcards(deckId, deck);

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
