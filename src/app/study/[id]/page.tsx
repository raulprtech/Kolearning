import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Lightbulb, Repeat, BrainCircuit, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function StudySessionPage({
  params,
}: {
  params: { id: string };
}) {
  const question = {
    text: "Explain the principle of superposition in quantum mechanics.",
    answer:
      "The principle of superposition states that any two (or more) quantum states can be added together ('superposed') and the result will be another valid quantum state. Conversely, every quantum state can be represented as a sum of two or more other distinct states.",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="flex items-center justify-between mb-8">
          <Link href="/dashboard" passHref>
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="text-yellow-400" />
            <span className="font-bold text-lg text-foreground">⚡ 9/10</span>
          </div>
        </header>

        <Card className="bg-card/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary">Open Question</Badge>
          </div>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">
              {question.text}
            </CardTitle>
            <CardDescription className="text-center">
              Formulate your response below. Active recall is key to mastery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              placeholder="Your answer..."
              className="bg-background text-lg"
            />

            <div className="mt-6 flex justify-center">
              <Button size="lg" className="w-full max-w-xs">
                Reveal Answer
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
              <h3 className="font-headline text-muted-foreground mb-4">
                Tactical Support
              </h3>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" aria-label="Hint">
                  <Lightbulb />
                </Button>
                <Button variant="outline" size="icon" aria-label="Explain Answer">
                  <BrainCircuit />
                </Button>
                <Button variant="outline" size="icon" aria-label="Reformulate">
                  <Repeat />
                </Button>
                <Button variant="accent" size="icon" aria-label="Consult Koli">
                  <KoliAvatar className="h-6 w-6" />
                </Button>
              </div>
            </div>
            
            {/* This part would be shown after clicking "Reveal Answer" */}
            <div className="mt-8 pt-6 border-t">
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <h4 className="font-bold font-headline mb-2 text-primary">
                  Correct Answer
                </h4>
                <p>{question.answer}</p>
              </div>

              <h3 className="font-headline text-muted-foreground mb-4 text-center">
                Rate your recall performance:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Button variant="destructive" className="h-auto py-3 flex-col">
                    <span className="text-lg font-bold">Very Hard</span>
                    <span className="text-xs opacity-80">Again Soon</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col hover:border-primary">
                    <span className="text-lg font-bold">Hard</span>
                    <span className="text-xs opacity-80">Review in a day</span>
                </Button>
                <Button variant="secondary" className="h-auto py-3 flex-col">
                    <span className="text-lg font-bold">Good</span>
                    <span className="text-xs opacity-80">Review in a few days</span>
                </Button>
                <Button variant="default" className="h-auto py-3 flex-col">
                    <span className="text-lg font-bold">Easy</span>
                    <span className="text-xs opacity-80">Review in a week</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
