import { config } from 'dotenv';
config();

import '@/ai/flows/generate-deck-from-topic.ts';
import '@/ai/flows/generate-deck-from-text.ts';
import '@/ai/flows/tutor-chat.ts';
import '@/ai/flows/evaluate-open-answer.ts';
import '@/ai/flows/generate-options-for-question.ts';
import '@/ai/flows/generate-learning-plan.ts';
