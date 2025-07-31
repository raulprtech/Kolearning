import type { Flashcard } from "@/types";

// FSRS Constants (weights optimized based on empirical data, can be user-specific in the future)
const DECAY = -0.5;
const FACTOR = 19 / Math.abs(Math.pow(0.9, 1 / DECAY) - 1);

// Default FSRS parameters for a new user. These would be updated based on user performance analysis.
const DEFAULT_WEIGHTS = {
    initialDifficulty: [0.4, 0.6, 2.4, 5.8],
    initialStability: [0.4, 0.9, 2.3, 5.8],
    stabilityAfterSuccess: [2.16, 0, 0, 0], // Only w0 is used for success
    stabilityAfterFailure: [0.54, 0.1, 0, 0], // w0, w1 are used for failure
    difficultyDelta: [1.44, 0, 0, 0], // Only w0 is used for difficulty change
};

export type UserRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type SessionType = 'Calibración Inicial' | 'Incursión' | 'Refuerzo de Dominio' | 'Prueba de Dominio' | 'Consulta con Koli' | 'Brecha Detectada';

/**
 * Represents the memory state of a single flashcard for a specific user.
 * This would typically be stored in a database table mapping (userId, cardId) -> CardMemoryState.
 */
export type CardMemoryState = {
    id: string;
    /** Difficulty (D): Represents the inherent complexity of the card for the user. */
    difficulty: number;
    /** Stability (S): The number of days the card will be remembered before recall chance drops below 90%. */
    stability: number;
    /** The date this card was last reviewed. */
    lastReviewed: Date | null;
    /** The date this card is scheduled for the next review. */
    nextReview: Date | null;
    // Session-specific data
    attempts: number;
};

export class SpacedRepetitionSystem {
    private cards: Flashcard[];
    private cardStates: Map<string, CardMemoryState> = new Map();
    private reviewQueue: string[] = [];
    private allCardsMap: Map<string, Flashcard>;

    constructor(cards: Flashcard[], existingStates?: CardMemoryState[]) {
        this.cards = cards;
        this.allCardsMap = new Map(cards.map(c => [c.id, c]));

        cards.forEach(card => {
            const existing = existingStates?.find(s => s.id === card.id);
            if (existing) {
                this.cardStates.set(card.id, { ...existing });
            } else {
                this.cardStates.set(card.id, {
                    id: card.id,
                    difficulty: 0, // Will be initialized on first review
                    stability: 0,  // Will be initialized on first review
                    lastReviewed: null,
                    nextReview: null,
                    attempts: 0,
                });
            }
        });

        this.initializeReviewQueue();
    }

    private initializeReviewQueue() {
        // For now, we review all cards in a random order.
        // A more advanced implementation would prioritize cards based on their nextReview date.
        this.reviewQueue = this.shuffleArray(this.cards.map(c => c.id));
    }

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Calculates the probability of recalling a card at a given time.
     * @param state The memory state of the card.
     * @param now The current date.
     * @returns The retrievability (R) from 0 to 1.
     */
    public calculateRetrievability(state: CardMemoryState, now: Date): number {
        if (!state.lastReviewed) return 1; // Not reviewed yet
        const daysSinceLastReview = (now.getTime() - state.lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
        return Math.pow(1 + daysSinceLastReview / (FACTOR * state.stability), DECAY);
    }
    
    /**
     * The core FSRS algorithm update function.
     * This is executed every time a user rates a card.
     * @param cardId The ID of the card being reviewed.
     * @param userRating The user's self-assessed rating (1-4).
     */
    public updateCard(cardId: string, userRating: UserRating) {
        let state = this.cardStates.get(cardId);
        if (!state) return;

        const ratingIndex = userRating - 1;
        const now = new Date();

        // If this is the first review, initialize D and S.
        const isFirstReview = state.stability === 0;
        if (isFirstReview) {
            state.difficulty = DEFAULT_WEIGHTS.initialDifficulty[ratingIndex];
            state.stability = DEFAULT_WEIGHTS.initialStability[ratingIndex];
        } else {
            // It's a subsequent review, calculate new D and S.
            const retrievability = this.calculateRetrievability(state, now);

            // Calculate new Difficulty
            const difficultyDelta = DEFAULT_WEIGHTS.difficultyDelta[0] * (1 / (1 + 9 * (1 - retrievability)));
            state.difficulty += difficultyDelta;
            state.difficulty = Math.max(0, Math.min(state.difficulty, 10)); // Clamp D between 0 and 10

            // Calculate new Stability
            if (userRating === 1) { // Failure
                const failureFactor = Math.pow(state.stability, DEFAULT_WEIGHTS.stabilityAfterFailure[1]);
                const nextStability = DEFAULT_WEIGHTS.stabilityAfterFailure[0] * failureFactor;
                state.stability = Math.max(0.1, nextStability); // Ensure stability doesn't drop too low
            } else { // Success (Hard, Good, Easy)
                const successFactor = Math.pow(Math.E, (1 - retrievability) * DEFAULT_WEIGHTS.stabilityAfterSuccess[0]);
                const stabilityIncrease = state.stability * successFactor;
                state.stability += stabilityIncrease;
            }
        }
        
        state.lastReviewed = now;
        state.attempts += 1;
        
        // Schedule next review date
        // The goal is to review when retrievability is about to fall to 90%
        const daysToNextReview = Math.round(state.stability * Math.log(0.9) / Math.log(0.9));
        const nextReviewDate = new Date(now.getTime());
        nextReviewDate.setDate(now.getDate() + Math.max(1, daysToNextReview)); // Review at least 1 day later
        state.nextReview = nextReviewDate;

        // Remove the card from the current session's queue
        this.reviewQueue = this.reviewQueue.filter(id => id !== cardId);
    }
    
    public getNextCardId(): string | null {
        return this.reviewQueue[0] || null;
    }

    public getCard(id: string): Flashcard | undefined {
        return this.allCardsMap.get(id);
    }
    
    public getCardState(id: string): CardMemoryState | undefined {
        return this.cardStates.get(id);
    }

    public getReviewedCount(): number {
        return this.cards.length - this.reviewQueue.length;
    }

    public getTotalCards(): number {
        return this.cards.length;
    }

    public getSessionProgress(): number {
        const total = this.getTotalCards();
        if (total === 0) return 0;
        return (this.getReviewedCount() / total) * 100;
    }
}
