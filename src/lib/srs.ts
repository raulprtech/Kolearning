import type { Flashcard, SessionPerformanceSummary } from "@/types";

export type CardRating = 0 | 1 | 2 | 3; // 0: Muy Difícil, 1: Difícil, 2: Bien, 3: Fácil
export type SessionType = 'Calibración Inicial' | 'Incursión' | 'Refuerzo de Dominio' | 'Prueba de Dominio' | 'Consulta con Koli' | 'Brecha Detectada';

export type CardState = {
    id: string;
    // SM-2 Algorithm parameters
    interval: number; // in days
    repetitions: number;
    easeFactor: number; // q-factor
    // Session-specific data
    attempts: number;
    timesAskedForHelp: number;
    isCorrect: boolean | null;
    lastReviewed: Date | null;
    reviewQueue: 'new' | 'learning' | 'review';
};

export class SpacedRepetitionSystem {
    private cards: Flashcard[];
    private cardStates: Map<string, CardState> = new Map();
    private reviewQueue: string[] = [];
    private allCardsMap: Map<string, Flashcard>;
    private sessionType: SessionType;
    private planProgress: number; // 0.0 to 1.0

    constructor(cards: Flashcard[], sessionType: SessionType, planProgress: number) {
        this.cards = cards;
        this.sessionType = sessionType;
        this.planProgress = planProgress;
        this.allCardsMap = new Map(cards.map(c => [c.id, c]));

        cards.forEach(card => {
            this.cardStates.set(card.id, {
                id: card.id,
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                attempts: 0,
                timesAskedForHelp: 0,
                isCorrect: null,
                lastReviewed: null,
                reviewQueue: 'new',
            });
        });

        this.initializeReviewQueue();
    }

    private initializeReviewQueue() {
        let eligibleCards = [...this.cards];

        if (this.sessionType === 'Incursión') {
            // "Incursión" sessions focus on interactive formats, avoiding open-ended questions.
            const interactiveFormats = ["Identificación", "Comparación", "Procedimiento", "Ejemplificación"];
            eligibleCards = this.cards.filter(card => 
                card.formatos_presentacion.some(fp => interactiveFormats.includes(fp))
            );
        }
        
        // If for some reason filtering leaves no cards, fall back to all cards to avoid an empty session.
        if (eligibleCards.length === 0) {
            eligibleCards = [...this.cards];
        }

        this.reviewQueue = this.shuffleArray(eligibleCards.map(c => c.id));
    }
    
    public getQuestionTypeForCard(cardId: string): SessionQuestion['type'] {
        const card = this.allCardsMap.get(cardId);
        if (!card) return 'open-answer'; // Default fallback
        
        // Calibration sessions should only be multiple choice to gauge knowledge without friction.
        if (this.sessionType.startsWith('Calibración')) {
            return 'multiple-choice';
        }

        // Mastery tests should prioritize recall (open answer).
        if (this.sessionType === 'Prueba de Dominio') {
            // We can add more complex logic here later, but for now, prioritize open-answer.
            // If the card format is simple identification, MC is a fallback.
            if (card.formatos_presentacion.includes('Identificación')) {
                 return Math.random() > 0.3 ? 'open-answer' : 'multiple-choice';
            }
            return 'open-answer';
        }

        // "Incursión" (Incursion) should prioritize interactive formats.
        if (this.sessionType === 'Incursión') {
            if (card.formatos_presentacion.includes("Identificación")) return 'multiple-choice';
            // Add logic for 'matching' and 'ordering' when those types are implemented
        }

        // "Refuerzo de Dominio" (Mastery Reinforcement) should gradually introduce harder questions.
        if (this.sessionType === 'Refuerzo de Dominio') {
            const randomFactor = Math.random();
            // Early in the plan, less chance of open-answer.
            if (this.planProgress < 0.5 && randomFactor > (this.planProgress * 1.5)) { // Make it a bit harder to get open-answer early on
                 if (card.formatos_presentacion.includes("Identificación")) return 'multiple-choice';
            }
        }
        
        // Default to open-answer if no other type fits
        return 'open-answer';
    }


    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    public getNextCard(): string | null {
        if (this.reviewQueue.length === 0) {
            return null; // Session finished
        }
        return this.reviewQueue[0];
    }
    
    public getCard(id: string): Flashcard | undefined {
        return this.allCardsMap.get(id);
    }
    
    public getCardState(id: string): CardState | undefined {
        return this.cardStates.get(id);
    }

    public recordAttempt(cardId: string) {
        const state = this.cardStates.get(cardId);
        if (state) {
            state.attempts += 1;
        }
    }
    
    public recordHelp(cardId: string, helpType: 'hint' | 'explanation') {
        const state = this.cardStates.get(cardId);
        if (state) {
            state.timesAskedForHelp += 1;
        }
    }

    public updateCard(cardId: string, rating: CardRating, isCorrect: boolean) {
        const state = this.cardStates.get(cardId);
        if (!state) return;

        state.isCorrect = isCorrect;
        state.lastReviewed = new Date();
        
        if (!isCorrect) {
            // If incorrect, reset progress and move to back of learning queue
            state.repetitions = 0;
            state.interval = 1;
            // Move card to the back of the queue to be seen again soon
            this.reviewQueue.shift(); // remove from front
            this.reviewQueue.push(cardId);
            return;
        }

        // SM-2 algorithm implementation
        if (rating < 2) { // 0 or 1 (Forgot)
            state.repetitions = 0;
            state.interval = 1;
             this.reviewQueue.shift();
             this.reviewQueue.push(cardId); // See again in this session
        } else { // 2 or 3 (Remembered)
            if (state.repetitions === 0) {
                state.interval = 1;
            } else if (state.repetitions === 1) {
                state.interval = 6;
            } else {
                state.interval = Math.round(state.interval * state.easeFactor);
            }
            state.repetitions += 1;
        }

        state.easeFactor = state.easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
        if (state.easeFactor < 1.3) state.easeFactor = 1.3;

        // If card was very difficult, inject parent atoms into the queue
        if (rating === 0) { // 'Muy Difícil'
            const card = this.allCardsMap.get(cardId);
            if (card && card.atomos_padre && card.atomos_padre.length > 0) {
                const parentIds = card.atomos_padre.filter(pId => this.allCardsMap.has(pId));
                // Add parents to the front of the queue, avoiding duplicates
                this.reviewQueue = [...new Set([...parentIds.reverse(), ...this.reviewQueue])];
            }
        }
        
        // Remove the reviewed card from the front of the queue
        this.reviewQueue.shift();
    }
    
    public getReviewedCount(): number {
        return this.cards.length - this.reviewQueue.length;
    }

    public getTotalCards(): number {
        return this.cards.length;
    }

    public getStats() {
        let correct = 0;
        let incorrect = 0;
        let currentStreak = 0;
        let bestStreak = 0;

        this.cardStates.forEach(state => {
            if (state.isCorrect === true) {
                correct++;
                currentStreak++;
            } else if (state.isCorrect === false) {
                incorrect++;
                if (currentStreak > bestStreak) {
                    bestStreak = currentStreak;
                }
                currentStreak = 0;
            }
        });
        
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        
        const masteryPointsMap = { 3: 20, 2: 15, 1: 5, 0: 0 };
        const creditsMap = { 3: 10, 2: 8, 1: 2, 0: 0 };

        const masteryProgress = Array.from(this.cardStates.values()).reduce((acc, state) => {
            // Simplified points logic for now
            return acc + (state.isCorrect ? 10 : 0);
        }, 0);
        
         const cognitiveCredits = Array.from(this.cardStates.values()).reduce((acc, state) => {
            // Simplified credits logic for now
            return acc + (state.isCorrect ? 5 : 0);
        }, 0);


        return {
            masteryProgress,
            cognitiveCredits,
            bestStreak,
            currentStreak,
        };
    }
    
    public getPerformanceSummary(): SessionPerformanceSummary {
        let correct = 0;
        let incorrect = 0;
        const difficultCards: SessionPerformanceSummary['difficultCards'] = [];

        this.cardStates.forEach(state => {
            if (state.isCorrect === true) {
                correct++;
            } else if (state.isCorrect === false) {
                incorrect++;
            }
            // A card is "difficult" if it was answered incorrectly, or took multiple attempts, or help was needed.
            if (state.isCorrect === false || state.attempts > 1 || state.timesAskedForHelp > 0) {
                 const card = this.allCardsMap.get(state.id);
                 if (card) {
                    difficultCards.push({
                        question: card.question,
                        attempts: state.attempts,
                        timesAskedForHelp: state.timesAskedForHelp,
                    });
                 }
            }
        });

        return {
            totalCards: this.cards.length,
            correctCards: correct,
            incorrectCards: incorrect,
            difficultCards,
        }
    }
}

type SessionQuestion = Flashcard & { type: 'open-answer' | 'multiple-choice' | 'matching' | 'ordering' | 'fill-in-the-blank' };
