
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Logo } from "@/components/icons/logo";
import { Plus, Mic } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Kolearning
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button>Acceder</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md">
            <KoliAvatar className="h-24 w-24 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              Hola, soy Koli
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Tu asistente de IA personal. ¿En qué te puedo ayudar a aprender hoy?
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl mt-auto p-4">
          <div className="relative">
            <Input
              placeholder="Pregúntale a Koli..."
              className="w-full h-12 rounded-full pl-6 pr-20 bg-card border-border"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
