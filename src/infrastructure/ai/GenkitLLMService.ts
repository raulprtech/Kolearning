import { ILLMService, GenerateAtomsPreferences } from '../../core/ports/outbound/ILLMService';
import { Atom } from '../../core/domain/models/atom';
import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { generateAtomsFromLargeContent } from '../../ai/flows/generate-atoms';
import { classifyPaper } from '../../ai/flows/classify-paper';
import { extractContentFromUrl } from '../../ai/flows/extract-content-from-url';

export class GenkitLLMService implements ILLMService {
    public async generateAtomsFromText(
        textOrDataUri: string,
        preferences?: GenerateAtomsPreferences
    ): Promise<Atom[]> {
        const defaultPrefs = {
            availableTimePerSession: preferences?.availableTimePerSession ?? 30,
            totalAvailableTime: preferences?.totalAvailableTime ?? 300,
            difficultyPreference: preferences?.difficultyPreference ?? 'gradual',
            learningStyle: preferences?.learningStyle
        };

        // Genkit expects the text exactly as DataURI if it starts with 'data:', 
        // but in case someone passes raw text we can assume DataURI packaging happens at higher level or here:
        let payload = textOrDataUri;
        if (!textOrDataUri.startsWith('data:')) {
            payload = `data:text/plain;base64,${Buffer.from(textOrDataUri).toString('base64')}`;
        }

        const result = await generateAtomsFromLargeContent({
            studyMaterial: payload,
            userPreferences: defaultPrefs,
        });

        // Apply filters to the generated atoms
        let atoms = HookRegistry.applyFilters<Atom[]>('filter_atoms_after_generation', result.atoms);

        // Notify actions that atoms have been generated
        HookRegistry.doAction('on_atoms_generated', atoms);

        return atoms;
    }

    public async classifyDocument(
        title: string,
        abstract?: string,
        authors?: string[]
    ) {
        const result = await classifyPaper({
            title,
            abstract: abstract || '',
            authors: authors || []
        });

        return {
            fieldOfKnowledge: result.fieldOfKnowledge,
            difficultyLevel: result.difficultyLevel,
            paperType: result.paperType,
            tags: result.tags || []
        };
    }

    public async extractContentFromUrl(url: string): Promise<string> {
        const result = await extractContentFromUrl({ url });
        return result.content;
    }
}
