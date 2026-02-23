import { Atom } from '../../domain/models/atom';

export interface GenerateAtomsPreferences {
    availableTimePerSession?: number;
    totalAvailableTime?: number;
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyPreference?: 'gradual' | 'challenging' | 'mixed';
}

export interface ILLMService {
    /**
     * Extacts knowledge (atoms) from texts or Data URIs
     */
    generateAtomsFromText(
        textOrDataUri: string,
        preferences?: GenerateAtomsPreferences
    ): Promise<Atom[]>;

    /**
     * Classifies a document returning its topic, difficulty and tags
     */
    classifyDocument(
        title: string,
        abstract?: string,
        authors?: string[]
    ): Promise<{
        fieldOfKnowledge: string;
        difficultyLevel: string;
        paperType: string;
        tags: string[];
    }>;

    /**
     * Extracts raw textual content from an external web URL
     */
    extractContentFromUrl(url: string): Promise<string>;
}
