import { ILLMService } from '../../core/ports/outbound/ILLMService';
import { IProjectRepository } from '../../core/ports/outbound/IProjectRepository';
import { Paper } from '../../core/domain/models/paper';
import { Atom } from '../../core/domain/models/atom';

export class ExtractKnowledgeUseCase {
    constructor(
        private llmService: ILLMService,
        private projectRepository: IProjectRepository
    ) { }

    /**
     * Extracts text from a Paper object (URL or Abstract) and generates Atoms via LLM,
     * then appends them to a target project.
     */
    async execute(
        paper: Paper,
        targetProjectId: string
    ): Promise<Atom[]> {

        let extractedText = '';

        // 1. Gather text from URL if available
        if (paper.url && paper.url.includes('http') && !paper.url.includes('.pdf')) {
            try {
                console.log("[ExtractKnowledgeUseCase] Attempting to extract text from URL...");
                extractedText = await this.llmService.extractContentFromUrl(paper.url);
            } catch (e) {
                console.warn("[ExtractKnowledgeUseCase] Failed to extract from URL, falling back to abstract", e);
                extractedText = paper.notes || paper.title;
            }
        } else {
            // 2. Fallback to abstract/notes
            extractedText = paper.notes || paper.title;
            if (extractedText.length < 50) {
                extractedText += ". " + (paper.authors?.join(", ") || "");
            }
        }

        if (!extractedText || extractedText.length <= 20) {
            throw new Error("INSUFFICIENT_TEXT");
        }

        // 3. Transform to Data URI for LLM consumption
        const dataUri = `data:text/plain;base64,${Buffer.from(extractedText).toString('base64')}`;

        console.log("[ExtractKnowledgeUseCase] Calling LLM Service to generate Atoms...");
        const atoms = await this.llmService.generateAtomsFromText(dataUri, {
            availableTimePerSession: 30,
            totalAvailableTime: 300,
            difficultyPreference: 'gradual'
        });

        if (atoms && atoms.length > 0) {
            console.log(`[ExtractKnowledgeUseCase] Generated ${atoms.length} atoms. Adding to project ${targetProjectId}...`);
            await this.projectRepository.addAtoms(targetProjectId, atoms);
            return atoms;
        }

        return [];
    }
}
