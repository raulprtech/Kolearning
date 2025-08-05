
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { useProjects } from "@/contexts/ProjectContext";
import { Flame, Zap } from "lucide-react";


export function Header() {
  const { energy, streak } = useProjects();

  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline">
          Kolearning
        </h1>
      </Link>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 border-r border-border pr-4">
           <div className="flex items-center gap-2" title="Racha actual">
              <Flame className="text-orange-400" />
              <span className="font-bold text-lg text-foreground">{streak}</span>
          </div>
          <div className="flex items-center gap-2" title="Energía restante">
              <Zap className="text-yellow-400" />
              <span className="font-bold text-lg text-foreground">{energy}</span>
          </div>
        </div>
        <Button>Acceder</Button>
      </div>
    </header>
  );
}
