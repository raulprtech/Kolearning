import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Deck, Flashcard } from '@/types';
import FlashcardViewer from './FlashcardViewer';

async function getDeckDetails(deckId: string) {
  try {
    const deckDoc = await adminDb.collection('decks').doc(deckId).get();
    if (!deckDoc.exists) return null;
    return { id: deckDoc.id, ...deckDoc.data() } as Deck;
  } catch (error) {
    console.error(`Error fetching deck ${deckId}:`, error);
    return null;
  }
}

async function getFlashcards(deckId: string) {
  try {
    const flashcardsSnapshot = await adminDb.collection('decks').doc(deckId).collection('flashcards').get();
    if (flashcardsSnapshot.empty) return [];
    return flashcardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Flashcard[];
  } catch (error) {
    console.error(`Error fetching flashcards for deck ${deckId}:`, error);
    return [];
  }
}

export default async function DeckPage({ params }: { params: { deckId: string } }) {
  const session = await getAuthSession();
  if (!session) {
    redirect('/login');
  }

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
