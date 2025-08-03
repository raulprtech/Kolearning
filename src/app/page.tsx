import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, ArrowRight, FileText } from "lucide-react";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";

export default function KoliCanvasPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">Kolearning</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost">Log In</Button>
          <Link href="/dashboard">
            <Button>Dashboard</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 grid md:grid-cols-2 gap-8 p-4 md:p-8">
        {/* Left Panel: Workspace */}
        <Card className="flex flex-col items-center justify-center p-8 bg-card/30 border-2 border-dashed border-border/50 rounded-xl shadow-inner">
          <div className="text-center w-full">
            <h2 className="text-3xl font-bold font-headline text-foreground mb-4">Workspace</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Upload your study materials. We accept PDFs, text files, and will atomize them into a personalized learning plan.
            </p>
            <div className="w-full max-w-sm mx-auto">
              <label htmlFor="file-upload" className="cursor-pointer group">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-muted-foreground/30 rounded-lg group-hover:bg-accent/10 group-hover:border-primary transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                  <span className="font-semibold text-primary">Click to upload</span>
                  <span className="text-sm text-muted-foreground">or drag and drop</span>
                </div>
              </label>
              <Input id="file-upload" type="file" className="hidden" />
              <p className="text-xs text-muted-foreground mt-2">Maximum file size: 50MB</p>
            </div>
          </div>
        </Card>

        {/* Right Panel: Koli Chat */}
        <Card className="flex flex-col bg-card/30 rounded-xl shadow-sm">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-start gap-4 animate-in fade-in duration-500">
              <KoliAvatar className="w-10 h-10 shrink-0"/>
              <div className="bg-muted p-4 rounded-lg rounded-tl-none max-w-md shadow-sm">
                <p className="font-bold text-primary mb-1 font-headline">Koli</p>
                <p className="text-foreground">
                  Welcome, Learner. I am Koli, your AI strategic tutor.
                </p>
                <p className="mt-2 text-foreground">
                  Provide your study material, and we will begin your path to mastery.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 animate-in fade-in duration-500 delay-300">
              <KoliAvatar className="w-10 h-10 shrink-0"/>
              <div className="bg-muted p-4 rounded-lg rounded-tl-none max-w-md shadow-sm">
                <p className="text-foreground">
                  While I forge your knowledge atoms, please create an account to save your progress. The process is swift.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-background/50">
            <div className="relative">
              <Input placeholder="Begin the strategic calibration..." className="pr-12 bg-input" disabled />
              <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
