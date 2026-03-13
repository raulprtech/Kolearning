import { Atom } from './atom';

export type Session = {
    session: number;
    type: string;
    questions: string;
    duration: string;
    status: 'Completed' | 'Continue' | 'Locked';
    atoms: Atom[];
    phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
    questionFormats?: string;
};

export type LearningPathItem = {
    session: number;
    topic: string;
    sessionType: string;
    questions: string; // Added from CalibratePlanOutput
    phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
    questionFormats?: string;
};

export type SourceStatus = 'pending' | 'processing' | 'processed' | 'error';

export type Source = {
    id?: string;
    name: string;
    type: string;
    content: string;
    status: SourceStatus;
    inStudyBox?: boolean;
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    atomCount?: number;
    errorMessage?: string;
};

export type Project = {
    id: string;
    title: string;
    description: string;
    mastery: number;
    icon: string;
    categories: string[];
    atoms: Atom[];
    sessions: Session[];
    sources: Source[];
    learningPath: LearningPathItem[];
    fullLearningPlanMarkdown?: string;
    author?: string;
    category?: string;
    isPublic?: boolean;
    bestStreak?: number;
    totalAnswers?: number;
    correctAnswers?: number;
};
