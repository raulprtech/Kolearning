export type AtomPayload = {
    videoUrl?: string;
    startTime?: number;
    endTime?: number;
    pairs?: { id: string; term: string; definition: string }[];
    [key: string]: any;
};

export type Atom = {
    id?: string;
    type?: string;
    payload?: AtomPayload;
    question: string;
    answer: string;
    // FSRS Metrics
    difficulty?: number; // How hard is this to learn? (0-1)
    stability?: number; // How long will you remember this? (in days)
    lastReviewed?: string; // ISO date string
    retrievability?: number; // FSRS score from 1 to 4
    incorrectAnswers?: string[]; // For multiple choice questions
    // Learning phase fields
    phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
    zettelkastenNote?: string;
    dependencies?: string[]; // IDs of prerequisite atoms
    // Ordering question fields
    orderingItems?: string[];
    correctOrder?: string[];
};
