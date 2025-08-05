
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { useProjects } from "@/contexts/ProjectContext";
import { Zap, Brain, Flame, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { energy, globalCognitiveCredits, dailyStreak } = useProjects();

  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline">
          Kolearning
        </h1>
      </Link>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2" title="Energía">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-lg">{energy}</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <div className="flex items-center gap-2 cursor-pointer" title="Créditos Cognitivos">
                <Brain className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-lg">{globalCognitiveCredits}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <Link href="/store" passHref>
                <DropdownMenuItem>
                  <Store className="mr-2 h-4 w-4" />
                  <span>Tienda de Créditos</span>
                </DropdownMenuItem>
             </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2" title="Racha de Días">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-lg">{dailyStreak}</span>
        </div>
        <Button>Acceder</Button>
      </div>
    </header>
  );
}
