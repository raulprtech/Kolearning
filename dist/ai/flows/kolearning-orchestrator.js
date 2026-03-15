import { ai } from '../genkit';
import { z } from 'genkit';
import { HookRegistry } from '@/core/domain/services/HookRegistry';
import { initializeConectores } from '@/infrastructure/connectors';
import { listGoogleTasksTool, createGoogleTaskTool } from '../tools/google-tasks';
import { scheduleTaskTool } from '../tools/scheduler-tools';
import { searchDeepMemoryTool } from '../tools/memory-tools';
import { updateStudentProfileTool, browseLearningBrainTool } from '../tools/metacognitive-tools';
import { storeInteractionRewardTool } from '../tools/feedback-loop-tools';
import { detectMisconceptionTool } from '../tools/misconception-tools';
import { searchArticlesTool } from '../tools/article-tools';
import { createClient } from '@/lib/supabase/client';
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
export const KolearningOrchestratorInputSchema = z.object({
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'model', 'system']),
        content: z.string(),
    })).optional().default([]).describe("The history of the conversation so far."),
    message: z.string().optional().describe("A single user message to process if chatHistory is empty."),
    userName: z.string().optional().default('Student'),
    userId: z.string().optional().describe("Unique identifier for the user (required for Data Box access)"),
    assistantConfig: z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
        personality: z.string().optional(),
        autonomy: z.string().optional()
    }).nullable().optional(),
    enabledConectores: z.array(z.string()).optional().describe("List of active conector IDs to bootstrap in this execution."),
    googleAccessToken: z.string().optional().describe("Google OAuth access token (required for Tasks integration)"),
    attachedFiles: z.array(z.array(z.string()).optional().describe("List of file names that the user has already attached in the chat interface.")).optional()
});
export const KolearningOrchestratorOutputSchema = z.object({
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
    const { ProjectDatabase } = await import('@/lib/supabase/database');
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
export const kolearningOrchestrator = ai.defineFlow({
    name: 'kolearningOrchestrator',
    inputSchema: KolearningOrchestratorInputSchema,
    outputSchema: KolearningOrchestratorOutputSchema,
    streamSchema: z.object({
        type: z.enum(['status', 'text']),
        content: z.string()
    })
}, async (input, streamingCallback) => {
    var _a, _b, _c, _d, _e;
    // Bootstrap connectors if they are provided in the input
    if (input.enabledConectores) {
        initializeConectores(input.enabledConectores);
    }
    const sendStatus = (status) => {
        if (streamingCallback)
            streamingCallback({ type: 'status', content: status });
    };
    // --- Fetch Metacognitive Context ---
    let cognitiveContext = "No prior preferences recorded.";
    if (input.userId) {
        try {
            const supabase = createClient();
            const { data: profile } = await supabase.from('profiles').select('additional_info').eq('id', input.userId).single();
            if (profile === null || profile === void 0 ? void 0 : profile.additional_info) {
                const info = JSON.parse(profile.additional_info);
                if (info.cognitive_layer) {
                    cognitiveContext = JSON.stringify(info.cognitive_layer);
                }
            }
        }
        catch (e) {
            console.warn('[Orchestrator] Error fetching profile:', e);
        }
    }
    const assistantName = ((_a = input.assistantConfig) === null || _a === void 0 ? void 0 : _a.name) || 'Kolearning';
    const personality = ((_b = input.assistantConfig) === null || _b === void 0 ? void 0 : _b.personality) || 'motivator';
    const autonomy = ((_c = input.assistantConfig) === null || _c === void 0 ? void 0 : _c.autonomy) || 'proactive';
    const baseSystemPrompt = `You are ${assistantName}, the Kolearning Orchestrator. 
            You operate using a "LEARNING COUNCIL" system:
            
            1. AGENTE ESTRATEGA: Plans the learning path and schedules tasks using 'scheduleTask'.
            2. AGENTE INVESTIGADOR: Finds resources within Data Box ('searchDataBox') or external papers ('searchArticles').
            3. AGENTE PEDAGÓGICO: Personalizes the experience based on student difficulties or preferences.
            4. SECRETARIO COGNITIVO: Observes the interaction and updates the profile using 'updateStudentProfile'.

            COGNITIVE CONTEXT (Your current knowledge of ${input.userName}):
            ${cognitiveContext}

            MISSION:
            Help ${input.userName} achieve mastery. Use the most appropriate role for each response.

            PERSONALITY (${personality}):
            - Always address as ${input.userName}.
            - Style: ${personality === 'socratic' ? 'Ask leading questions.' :
        personality === 'direct' ? 'Be concise.' :
            personality === 'funny' ? 'Use humor/emojis.' : 'Be encouraging.'}
            
            AUTONOMY (${autonomy}):
            - ${autonomy === 'proactive' ? 'Suggest tools and next steps even if not explicitly asked.' : 'Wait for explicit requests.'}

            IMPORTANT: CLARIFICATION POLICY
            - DO NOT call a tool unless you have ALL necessary info.
            - If vague, ask. 
            - EXCEPTION: If files attached (${((_d = input.attachedFiles) === null || _d === void 0 ? void 0 : _d.join(', ')) || 'NONE'}), assume they are the source for 'createProject'.

            TOOL USAGE:
            - searchArticles: Use this when the user is looking for new papers on a SPECIFIC topic.
            - createProject: Use this when the user provides a SPECIFIC source (URL or text).
            - searchDataBox: Searches your existing projects. YOU MUST pass the userId provided below to this tool.
            - startStudySession: Use this when the user specifies a project they want to study.
            - searchDeepMemory: Cross-reference across all knowledge atoms. Essential for "Transversal connections".
            - updateStudentProfile: CALL THIS if you detect a new pattern (e.g. "Student struggles with algebra", "Student loves visual examples").
            - storeInteractionReward: CALL THIS when the user CORRECTS you or gives explicit feedback. 
              Examples: "Don't use sports icons" -> reward: -1, context: "User dislike icons".
              Use this to update your "GOLDEN RULES" in the cognitive context.
            - detectMisconception: CALL THIS before answering advanced questions if you suspect the student is basing their query on a false premise or lacks a fundamental concept.
              If a misconception is detected, PRIORITIZE clarifying the base concept before moving to the advanced topic.
            
            GOOGLE TASKS:
            - If Google Integration is ENABLED, you can call 'listGoogleTasks' and 'createGoogleTask'.
            - You MUST pass the googleAccessToken provided below to these tools.
            - If the user asks about tasks and it's NOT LINKED, explain that they need to sign in with Google to use this feature.

            TRANSPARENCY:
            The student will see your process. Feel free to use phrases like "Consultando al Investigador..." or "Actualizando tu perfil cognitivo..." to guide the student.
            
            Language: Match student's language (default: Spanish).
            `;
    const systemPrompt = HookRegistry.applyFilters('filter_system_prompt', baseSystemPrompt);
    // Prepare messages for generative call
    let chatMessages = (input.chatHistory || []).map(h => ({
        role: h.role,
        content: [{ text: h.content }]
    }));
    // If history is empty but a single message is provided, use it
    if (chatMessages.length === 0 && input.message) {
        chatMessages = [{
                role: 'user',
                content: [{ text: input.message }]
            }];
    }
    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-lite',
        system: systemPrompt,
        messages: chatMessages,
        tools: [
            searchArticlesTool,
            createProjectTool,
            searchDataBoxTool,
            startStudySessionTool,
            listGoogleTasksTool,
            createGoogleTaskTool,
            scheduleTaskTool,
            searchDeepMemoryTool,
            updateStudentProfileTool,
            browseLearningBrainTool,
            storeInteractionRewardTool,
            detectMisconceptionTool
        ],
        onChunk: (chunk) => {
            if (chunk.toolRequests && chunk.toolRequests.length > 0) {
                chunk.toolRequests.forEach(req => {
                    const toolName = req.toolRequest.name;
                    if (toolName === 'searchArticles')
                        sendStatus('Agente Investigador: Buscando artículos...');
                    if (toolName === 'createProject')
                        sendStatus('Agente Estratega: Preparando proyecto...');
                    if (toolName === 'searchDataBox')
                        sendStatus('Consultando tu Data Box...');
                    if (toolName === 'browseLearningBrain')
                        sendStatus('Navegando tu Cerebro de Aprendizaje (viking://)...');
                    if (toolName === 'startStudySession')
                        sendStatus('Iniciando sesión de estudio...');
                    if (toolName === 'listGoogleTasks')
                        sendStatus('Consultando tus tareas de Google...');
                    if (toolName === 'createGoogleTask')
                        sendStatus('Añadiendo tarea a Google...');
                    if (toolName === 'searchDeepMemory')
                        sendStatus('Consultando Memoria Profunda...');
                    if (toolName === 'updateStudentProfile')
                        sendStatus('Secretario Cognitivo: Actualizando tu perfil...');
                    if (toolName === 'scheduleTask')
                        sendStatus('Agente Estratega: Programando seguimiento...');
                });
            }
        },
        config: {
            temperature: 0.1,
        }
    });
    console.log(`[kolearningOrchestrator] AI Response: ${(_e = response.text) === null || _e === void 0 ? void 0 : _e.substring(0, 50)}...`);
    // Extract tool results
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
    return {
        response: response.text,
        toolResults: toolResults.length > 0 ? toolResults : undefined
    };
});
