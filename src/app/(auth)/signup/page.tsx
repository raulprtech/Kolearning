import SignupForm from './SignupForm'
import { Suspense } from 'react'

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function SignUpPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const redirect = resolvedParams?.redirect;
  const redirectUrl = Array.isArray(redirect) ? redirect[0] : redirect || '/';

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm redirectUrl={redirectUrl} />
    </Suspense>
  );
}

export default SignUpPage;