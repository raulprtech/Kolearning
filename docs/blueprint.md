# **App Name**: Kolearning MVP

## Core Features:

- User Authentication: Implements user authentication via Firebase Auth (email/password) with protected routes.
- Dashboard: Displays available flashcard decks from Firestore in a card grid on the dashboard.
- Flashcard Session: Presents flashcards one at a time, revealing the answer upon button click. Includes 'Incorrect' and 'Correct' buttons for navigation.
- Daily Streak System: Tracks daily streaks: increments for consecutive daily sessions, resets after a miss, and updates last session time.
- Session Complete API: Creates an API route to handle session completion and update user streaks in Firestore.
- Conversational Tutor: Provides a chat interface for conversational tutoring. Includes a placeholder for future integration with an LLM API.
- Browse Flashcard Decks: Users can browse flashcard decks ('Sets Originals') with title and description. Each deck contains a subcollection of flashcards with question and answer fields formatted using Markdown.

## Style Guidelines:

- Primary color: Soft violet (#A084CA) to convey a sense of calm and intellect.
- Background color: Very light gray (#F5F3F7), almost white, providing a clean backdrop.
- Accent color: Pale rose (#E2D8EF), used sparingly to add a gentle contrast and highlight key elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern and neutral aesthetic, providing readability and a clean design.
- Minimalist icons with rounded corners to complement the soft color palette.
- Clean and spacious layout using Tailwind CSS grid and flexbox for responsiveness.
- Subtle animations for card transitions and button interactions to enhance user experience.