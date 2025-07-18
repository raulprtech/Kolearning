'use server';

import { chatWithTutor } from '@/ai/flows/tutor-chat';
import { getAuthSession } from '@/lib/auth';

export async function handleTutorChat(message: string) {
  const session = await getAuthSession();
  if (!session) {
    return { error: 'You must be logged in to use the tutor.' };
  }

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
