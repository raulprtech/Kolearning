'use server';

import { chatWithTutor } from '@/ai/flows/tutor-chat';

export async function handleTutorChat(message: string) {
  if (!message) {
    return { error: 'Message cannot be empty.' };
  }

  try {
    const result = await chatWithTutor({ message });
    return { response: result.response };
  } catch (error) {
    console.error('Error with tutor AI:', error);
    return { error: 'Sorry, I am unable to respond right now.' };
  }
}
