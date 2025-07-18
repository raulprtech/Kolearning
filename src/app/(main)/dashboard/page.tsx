import type { Deck } from '@/types';
import { DeckCard } from '@/components/deck/DeckCard';

async function getDecks(): Promise<Deck[]> {
  // Return mock data since auth and firestore are disabled
  return [
    { id: '1', title: 'Basic Algebra', description: 'Learn the fundamentals of algebra.' },
    { id: '2', title: 'World Capitals', description: 'Test your knowledge of world capitals.' },
    { id: '3', title: 'Spanish Vocabulary', description: 'Expand your Spanish vocabulary.' },
  ];
}

export default async function DashboardPage() {
  const decks = await getDecks();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Sets Originals</h1>
      <p className="text-muted-foreground mb-8">Choose a set to start your learning session.</p>
      
      {decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No decks available</h2>
          <p className="text-muted-foreground mt-2">Please check back later or contact an administrator to add decks.</p>
        </div>
      )}
    </div>
  );
}
