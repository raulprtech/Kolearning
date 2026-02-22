import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p className="text-muted-foreground text-center">Last updated: September 4, 2025</p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, such as when you create an account, and information generated through your use of the Service. This includes:
            <ul>
              <li><strong>Account Information:</strong> Your name, email address, and password.</li>
              <li><strong>User Content:</strong> Study materials you upload or create.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our Service, such as your learning progress, answers to questions, and feature usage.</li>
            </ul>
          </p>

          <h2>2. How We Use Information</h2>
          <p>
            We use the information we collect to:
            <ul>
              <li>Provide, maintain, and improve our Service.</li>
              <li>Personalize your learning experience.</li>
              <li>Communicate with you, including sending service-related emails and, if you have opted in, newsletters.</li>
              <li>Analyze Service usage to understand and improve our platform.</li>
            </ul>
          </p>

          <h2>3. Newsletter Subscription</h2>
          <p>
            If you choose to subscribe to our newsletter, we will use your email address to send you updates about new features, study tips, and news about Learning Box. You can unsubscribe from these communications at any time by clicking the "unsubscribe" link at the bottom of each email.
          </p>

          <h2>4. Information Sharing</h2>
          <p>
            We do not share your personal information with third parties, except in the following circumstances:
            <ul>
              <li>With your consent.</li>
              <li>To comply with laws or respond to legal processes.</li>
              <li>To protect the rights and property of Learning Box.</li>
            </ul>
          </p>

          <h2>5. Data Security</h2>
          <p>
            We take reasonable measures to protect your information against loss, theft, misuse, and unauthorized access.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@learningbox.com">privacy@learningbox.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
