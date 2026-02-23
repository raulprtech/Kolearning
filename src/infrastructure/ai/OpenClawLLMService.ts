import { ILLMService, GenerateAtomsPreferences } from '../../core/ports/outbound/ILLMService';
import { Atom } from '../../core/domain/models/atom';

/**
 * OpenClawLLMService: An implementation of ILLMService that communicates 
 * with an OpenClaw or any OpenAI-compatible REST endpoint (like LMStudio, Ollama, vLLM).
 */
export class OpenClawLLMService implements ILLMService {
    private baseUrl: string;
    private apiKey: string;
    private model: string;

    constructor() {
        // Fallbacks to typical local setups if env flags are missing
        this.baseUrl = process.env.NEXT_PUBLIC_OPENCLAW_BASE_URL || 'http://localhost:11434/v1';
        this.apiKey = process.env.NEXT_PUBLIC_OPENCLAW_API_KEY || 'sk-openclaw';
        this.model = process.env.NEXT_PUBLIC_OPENCLAW_MODEL || 'llama-3';
    }

    private async callChatCompletion(systemPrompt: string, userMessage: string, forceJson: boolean = true) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                response_format: forceJson ? { type: "json_object" } : undefined,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenClaw API Error HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (forceJson) {
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error("[OpenClawLLMService] Failed to parse JSON response:", content);
                throw new Error("Invalid JSON returned by OpenClaw");
            }
        }
        return content;
    }

    async generateAtomsFromText(
        textOrDataUri: string,
        preferences?: GenerateAtomsPreferences
    ): Promise<Atom[]> {
        // If data uri, strip prefix and decode. Easiest path for now.
        let rawText = textOrDataUri;
        if (rawText.startsWith('data:')) {
            const base64Content = rawText.split(',')[1];
            if (base64Content) {
                rawText = Buffer.from(base64Content, 'base64').toString('utf-8');
            }
        }

        const systemPrompt = `You are an expert tutor. Your goal is to chunk the provided educational content into smaller, indivisible facts called "Atoms" using the SuperMemo spaced repetition principles. 
Output exactly a JSON object with this shape:
{
  "atoms": [
    {
       "question": "Front of the flashcard",
       "answer": "Back of the flashcard (definition or fact)",
       "type": "fact",
       "difficulty": 0.3,
       "dependencies": []
    }
  ]
}
Tailor the extraction for a ${preferences?.difficultyPreference || 'gradual'} difficulty scale. Limit the output to roughly 5 to 10 highly relevant atoms.`;

        const responseObj = await this.callChatCompletion(systemPrompt, `Content to process:\n\n${rawText.substring(0, 10000)}`);

        if (!responseObj.atoms || !Array.isArray(responseObj.atoms)) {
            throw new Error("OpenClaw did not return an atoms array.");
        }

        return responseObj.atoms.map((a: any) => ({
            id: a.id || crypto.randomUUID(),
            question: a.question,
            answer: a.answer,
            type: a.type || 'fact',
            difficulty: a.difficulty,
            dependencies: a.dependencies || [],
            topics: a.topics || []
        }));
    }

    async classifyDocument(
        title: string,
        abstract?: string,
        authors?: string[]
    ): Promise<{
        fieldOfKnowledge: string;
        difficultyLevel: string;
        paperType: string;
        tags: string[];
    }> {
        const systemPrompt = `You are a scientific librarian classifier. Return ONLY a JSON object evaluating the provided academic document.
Schema:
{
  "fieldOfKnowledge": "e.g. Neuroscience, Physics, Machine Learning",
  "difficultyLevel": "Beginner | Intermediate | Advanced | Expert",
  "paperType": "Review | Empirical | Theoretical | Meta-Analysis",
  "tags": ["tag1", "tag2", "tag3"]
}`;

        const userInput = `Title: ${title}\nAuthors: ${authors?.join(', ') || 'Unknown'}\nAbstract: ${abstract || 'None provided'}`;

        const responseJson = await this.callChatCompletion(systemPrompt, userInput);

        return {
            fieldOfKnowledge: responseJson.fieldOfKnowledge || 'Unknown',
            difficultyLevel: responseJson.difficultyLevel || 'Intermediate',
            paperType: responseJson.paperType || 'Empirical',
            tags: responseJson.tags || []
        };
    }

    async extractContentFromUrl(url: string): Promise<string> {
        // Extracting web content via LLMs generally requires an external browser-tool or proxy API
        // For simplicity in the adapter, we can fallback to standard fetch or simple scraping.
        // It's out of scope for a pure LLM completion endpoint to browse the web unless we use Function Calling.
        throw new Error("OpenClaw extractContentFromUrl mapping is not implemented natively. Implement a fetching proxy.");
    }
}
