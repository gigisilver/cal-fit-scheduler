import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 7, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              When you use FitScheduler, we collect information necessary to provide our service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Google account email address</li>
              <li>Google Calendar event data (read-only access)</li>
              <li>Workout preferences you configure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information solely to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Display your calendar events</li>
              <li>Recommend optimal workout times based on your schedule</li>
              <li>Personalize your experience based on your preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Storage & Security</h2>
            <p className="text-muted-foreground">
              Your Google OAuth tokens are securely stored and encrypted. We do not store your calendar events 
              permanently—they are fetched in real-time when you use the app. Your workout preferences are 
              stored locally in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-muted-foreground">
              We integrate with Google Calendar via OAuth 2.0. Your use of Google services is subject to 
              Google's Privacy Policy. We do not sell or share your data with any other third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-muted-foreground">
              You can disconnect your Google Calendar at any time, which will remove your OAuth tokens 
              from our system. You can also clear your local preferences by clearing your browser data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us through the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
