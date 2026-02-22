import { differenceInDays } from 'date-fns';

export interface BaseAtom {
    id?: string;
    type?: string;
    question: string;
    answer: string;
    stability?: number;
    lastReviewed?: string;
    retrievability?: number;
    incorrectAnswers?: string[];
    phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
    zettelkastenNote?: string;
    dependencies?: string[];
    orderingItems?: string[];
    correctOrder?: string[];
}

export const calculateCurrentRetrievability = (stability: number, daysSinceLastReview: number): number => {
    return Math.pow(0.9, daysSinceLastReview / stability);
};

export const calculateMastery = (atoms: BaseAtom[]): number => {
    if (atoms.length === 0) {
        return 0;
    }

    const studiedAtoms = atoms.filter(atom => atom.lastReviewed && atom.stability);

    if (studiedAtoms.length === 0) {
        return 0;
    }

    const totalRetrievability = studiedAtoms.reduce((sum, atom) => {
        const daysSince = differenceInDays(new Date(), new Date(atom.lastReviewed!));
        const retrievability = calculateCurrentRetrievability(atom.stability!, daysSince);
        return sum + retrievability;
    }, 0);

    const averageRetrievability = totalRetrievability / studiedAtoms.length;
    const coverage = studiedAtoms.length / atoms.length;
    const masteryScore = (averageRetrievability * coverage) * 100;

    return Math.round(masteryScore);
};
