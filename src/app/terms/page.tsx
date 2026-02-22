import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p className="text-muted-foreground text-center">Last updated: September 4, 2025</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Kolearning (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of the terms, you may not access the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Kolearning is an adaptive learning platform that uses artificial intelligence to help users study and retain information more effectively. The Service includes strategic tutoring, study material generation, and progress tracking.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To use most of the features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account and password. You agree to notify Kolearning immediately of any unauthorized use of your account.
          </p>

          <h2>4. User Content</h2>
          <p>
            You retain all rights to any study materials, text, or information that you upload or input into the Service ("User Content"). By providing User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content solely for the purpose of operating and providing the Service.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>
            You agree not to use the Service for any illegal purpose or any purpose prohibited by these Terms. You may not use the Service in any manner that could damage, disable, overburden, or impair the Service.
          </p>

          <h2>6. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will notify you of any changes by posting the new Terms and Conditions on this page.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:support@kolearning.com">support@kolearning.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
