import { redirect } from 'next/navigation';

export default function Home() {
  // The (main) route group will handle the / page.
  // This redirect ensures that if a user lands here, they are sent to the correct layout.
  redirect('/');
}
