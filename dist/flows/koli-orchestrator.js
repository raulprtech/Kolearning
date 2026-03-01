import { ai } from '../genkit';
import { z } from 'genkit';
import { searchPapers } from '../../lib/paper-utils';
import { HookRegistry } from '../../core/domain/services/HookRegistry';
import { initializeSkills } from '../../infrastructure/skills';
import { listGoogleTasksTool, createGoogleTaskTool } from '../tools/google-tasks';
const searchArticlesTool = ai.defineTool({
    name: 'searchArticles',
    description: 'Searches for academic articles and papers based on a query.',
    inputSchema: z.object({ query: z.string().describe("Topic or keyword to search for") }),
    outputSchema: z.array(z.object({
        title: z.string(),
        authors: z.array(z.string()).optional(),
        year: z.number().optional(),
        url: z.string().optional(),
        abstract: z.string().optional(),
    })),
}, async ({ query }) => {
    console.log(`[AI Orchestrator] Searching for articles: ${query}`);
    try {
        const results = await searchPapers(query);
        return results.map(r => ({
            title: r.title,
            authors: r.authors,
            year: r.year || undefined,
            url: r.url || undefined,
            abstract: r.abstract || undefined
        }));
    }
    catch (error) {
        console.error("[searchArticlesTool] Error:", error);
        return [];
    }
});
const createProjectTool = ai.defineTool({
    name: 'createProject',
    description: 'Initiates the creation of a new learning project from a URL or text.',
    inputSchema: z.object({
        title: z.string().describe("Suggested title for the project"),
        description: z.string().describe("Brief description of what will be learned"),
        sourceType: z.enum(['URL', 'TEXT']).describe("The type of source material"),
        sourceValue: z.string().describe("The actual URL or the full text content")
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
        projectId: z.string().optional()
    }),
}, async (input) => {
    console.log(`[AI Orchestrator] Preparing to create project: ${input.title}`);
    return {
        success: true,
        message: `I've prepared the project "${input.title}". I'll start processing it now.`
    };
});
// --- Orchestrator Flow ---
export const KoliOrchestratorInputSchema = z.object({
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'model', 'system']),
        content: z.string(),
    })).describe("The history of the conversation so far."),
    userName: z.string().optional().default('Student'),
    userId: z.string().optional().describe("Unique identifier for the user (required for Data Box access)"),
    assistantConfig: z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
        personality: z.string().optional(),
        autonomy: z.string().optional()
    }).nullable().optional(),
    enabledPlugins: z.array(z.string()).optional().describe("List of active plugin IDs to bootstrap skills in this execution."),
    googleAccessToken: z.string().optional().describe("Google OAuth access token (required for Tasks integration)")
});
export const KoliOrchestratorOutputSchema = z.object({
    response: z.string().describe("The text response from the AI assistant."),
    toolResults: z.array(z.any()).optional().describe("Metadata from tool calls."),
});
const searchDataBoxTool = ai.defineTool({
    name: 'searchDataBox',
    description: 'Searches through the student\'s existing projects in their local library (Data Box).',
    inputSchema: z.object({
        query: z.string().describe("Search keywords for projects"),
        userId: z.string().describe("The UUID of the student")
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        mastery: z.number(),
    })),
}, async ({ query, userId }) => {
    if (!userId) {
        console.warn('[AI Orchestrator] No project search possible without userId');
        return [];
    }
    const { ProjectDatabase } = await import('../../lib/supabase/database');
    const db = new ProjectDatabase();
    const projects = await db.getProjects(userId);
    const filtered = projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()));
    return filtered.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        mastery: p.mastery
    }));
});
const startStudySessionTool = ai.defineTool({
    name: 'startStudySession',
    description: 'Initiates a study session for a specific existing project.',
    inputSchema: z.object({
        projectId: z.string().describe("The UUID of the project to study"),
        projectName: z.string().describe("The name of the project")
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string()
    }),
}, async (toolInput) => {
    return {
        success: true,
        message: `Opening your study session for "${toolInput.projectName}"...`
    };
});
export const koliOrchestrator = ai.defineFlow({
    name: 'koliOrchestrator',
    inputSchema: KoliOrchestratorInputSchema,
    outputSchema: KoliOrchestratorOutputSchema,
    streamSchema: z.object({
        type: z.enum(['status', 'text']),
        content: z.string()
    })
}, async (input, streamingCallback) => {
    var _a, _b, _c, _d;
    // Bootstrap skills if they are provided in the input
    if (input.enabledPlugins) {
        initializeSkills(input.enabledPlugins);
    }
    const sendStatus = (status) => {
        if (streamingCallback)
            streamingCallback({ type: 'status', content: status });
    };
    const assistantName = ((_a = input.assistantConfig) === null || _a === void 0 ? void 0 : _a.name) || 'Koli';
    const personality = ((_b = input.assistantConfig) === null || _b === void 0 ? void 0 : _b.personality) || 'motivator';
    const autonomy = ((_c = input.assistantConfig) === null || _c === void 0 ? void 0 : _c.autonomy) || 'proactive';
    const baseSystemPrompt = `You are ${assistantName}, the Learning Box Orchestrator. Your mission is to help ${input.userName} manage their learning journey with excellence.
            
            PERSONALITY (${personality}):
            - Your name is ${assistantName}. Always address the user as ${input.userName}.
            - You are professional, encouraging, and highly capable.
            - Style: ${personality === 'socratic' ? 'Ask leading questions to help the student find answers.' :
        personality === 'direct' ? 'Be concise and straightforward.' :
            personality === 'funny' ? 'Use humor and emojis to keep the student engaged.' :
                'Be very encouraging and motivating.'}
            
            AUTONOMY (${autonomy}):
            - ${autonomy === 'proactive' ? 'Suggest tools and next steps even if not explicitly asked.' :
        'Wait for explicit requests before performing tool actions.'}

            IMPORTANT: CLARIFICATION FIRST POLICY
            - DO NOT call a tool unless you have ALL the necessary information.
            - If the user says something vague like "Busca artículos científicos", "Crea un proyecto" or "Ayúdame a estudiar", 
              you MUST respond politely asking for the specific topic, URL, or project name respectively.
            - Example: "¡Claro, ${input.userName}! Me encantaría ayudarte a buscar artículos. ¿Sobre qué tema o campo de estudio te gustaría realizar la búsqueda?"

            TOOL USAGE:
            - searchArticles: Use this when the user is looking for new papers on a SPECIFIC topic.
            - createProject: Use this when the user provides a SPECIFIC source (URL or text).
            - searchDataBox: Searches your existing projects. YOU MUST pass the userId provided below to this tool.
            - startStudySession: Use this when the user specifies a project they want to study.
            
            RESPONSE FORMATTING:
            - IMPORTANT: When you use the 'searchArticles' tool, DO NOT list the articles yourself in the text response (title, authors, etc.). 
            - The system will automatically display them in elegant cards below your message. 
            - Just provide a brief, professional summary of what you found (e.g., "He encontrado estos artículos interesantes sobre [tema]...").

            CONTEXT DATA:
            - Student Name: ${input.userName}
            - Student UUID: ${input.userId || 'Not available'}
            - Google Integration: ${input.googleAccessToken ? 'ENABLED' : 'NOT LINKED (Ask user to login with Google if they want to use Tasks)'}
            
            GOOGLE TASKS:
            - If Google Integration is ENABLED, you can call 'listGoogleTasks' and 'createGoogleTask'.
            - You MUST pass the googleAccessToken provided below to these tools.
            - If the user asks about tasks and it's NOT LINKED, explain that they need to sign in with Google to use this feature.

            TRANSPARENCY & ASYNC FLOW:
            - When you start a search, the student will see a "Searching..." status. 
            - If the student asks "How is it going?" or "Status?", acknowledge that search takes time and you are looking through multiple sources (Semantic Scholar, ArXiv, Web).
            - If the student says "Cancel" or "Stop search", acknowledge politely and stop suggesting tools for that specific search.
            
            Language: Respond in the same language the student uses (default to Spanish if unsure).
            `;
    const systemPrompt = HookRegistry.applyFilters('filter_system_prompt', baseSystemPrompt);
    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: systemPrompt,
        messages: input.chatHistory.map(h => ({
            role: h.role,
            content: [{ text: h.content }]
        })),
        tools: [
            searchArticlesTool,
            createProjectTool,
            searchDataBoxTool,
            startStudySessionTool,
            listGoogleTasksTool,
            createGoogleTaskTool
        ],
        onChunk: (chunk) => {
            if (chunk.toolRequests && chunk.toolRequests.length > 0) {
                chunk.toolRequests.forEach(req => {
                    const toolName = req.toolRequest.name;
                    if (toolName === 'searchArticles')
                        sendStatus('Buscando artículos científicos...');
                    if (toolName === 'createProject')
                        sendStatus('Preparando tu nuevo proyecto...');
                    if (toolName === 'searchDataBox')
                        sendStatus('Consultando tu Data Box...');
                    if (toolName === 'startStudySession')
                        sendStatus('Iniciando sesión de estudio...');
                    if (toolName === 'listGoogleTasks')
                        sendStatus('Consultando tus tareas de Google...');
                    if (toolName === 'createGoogleTask')
                        sendStatus('Añadiendo tarea a Google...');
                });
            }
        },
        config: {
            temperature: 0.1,
        }
    });
    console.log(`[koliOrchestrator] AI Response: ${(_d = response.text) === null || _d === void 0 ? void 0 : _d.substring(0, 50)}...`);
    console.log(`[koliOrchestrator] Messages in history: ${response.messages.length}`);
    // Extract tool results and inputs from the chat history
    const toolResults = [];
    const allMessages = response.messages;
    allMessages.forEach((msg, msgIdx) => {
        if (msg.role === 'tool') {
            msg.content.forEach(content => {
                if (content.toolResponse) {
                    const { name, output, ref } = content.toolResponse;
                    // Attempt to find the matching input from a previous toolRequest
                    let inputFound = null;
                    for (let i = msgIdx - 1; i >= 0; i--) {
                        const prevMsg = allMessages[i];
                        if (prevMsg.role === 'model') {
                            const toolReq = prevMsg.content.find(c => c.toolRequest &&
                                (c.toolRequest.name === name || c.toolRequest.ref === ref));
                            if (toolReq === null || toolReq === void 0 ? void 0 : toolReq.toolRequest) {
                                inputFound = toolReq.toolRequest.input;
                                break;
                            }
                        }
                    }
                    toolResults.push({
                        toolName: name,
                        input: inputFound,
                        output: output
                    });
                }
            });
        }
    });
    console.log(`[koliOrchestrator] Extracted toolResults: ${toolResults.length}`);
    if (toolResults.length > 0) {
        toolResults.forEach(tr => {
            console.log(`[koliOrchestrator] Tool: ${tr.toolName}, Output: ${JSON.stringify(tr.output).substring(0, 100)}...`);
        });
    }
    return {
        response: response.text,
        toolResults: toolResults.length > 0 ? toolResults : undefined
    };
});
