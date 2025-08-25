
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { useProjects } from "@/contexts/ProjectContext";
import { Zap, Brain, Flame, Store, CheckCircle, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { KoliAvatar } from "../icons/koli-avatar";
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const streakHistory = [true, true, false, true, true]; // Placeholder

export function Header() {
  const { energy, globalCognitiveCredits, dailyStreak, nextEnergyIn } = useProjects();

  const getDayLabels = () => {
    const today = new Date();
    const labels = [];
    for (let i = 0; i < 5; i++) {
        const date = subDays(today, i);
        if (i === 0) {
            labels.push("Hoy");
        } else {
            let dayName = format(date, 'E', { locale: es });
            // Capitalize first letter and remove period if it exists.
            dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '');
            labels.push(dayName);
        }
    }
    return labels.reverse();
  }
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dayLabels = useMemo(() => getDayLabels(), []);

  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline">
          Kolearning
        </h1>
      </Link>
      <div className="flex items-center gap-6">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer" title="Energía">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold text-lg">{energy}</span>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <div className="p-2 text-center">
                    <p className="font-bold text-lg">Regeneración de Energía</p>
                     {nextEnergyIn > 0 ? (
                        <>
                            <p className="text-sm text-muted-foreground mt-1">Próximo punto en:</p>
                            <p className="text-2xl font-mono mt-1">{formatTime(nextEnergyIn)}</p>
                        </>
                     ) : (
                         <p className="text-sm text-muted-foreground mt-2">¡Energía al máximo!</p>
                     )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
        
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
{/* 
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer" title="Racha de Días">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="font-bold text-lg">{dailyStreak}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
             <DropdownMenuLabel>Racha de los últimos 5 días</DropdownMenuLabel>
             <div className="flex justify-center gap-3 p-2">
                {streakHistory.map((completed, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    {completed ? <CheckCircle className="h-6 w-6 text-green-400" /> : <Circle className="h-6 w-6 text-muted-foreground/50" />}
                    <span className="text-xs text-muted-foreground">{dayLabels[index]}</span>
                  </div>
                ))}
             </div>
             <DropdownMenuSeparator />
             <div className="p-2 flex items-center gap-3">
                <KoliAvatar className="h-10 w-10 flex-shrink-0" />
                <p className="text-sm text-muted-foreground italic">¡Sigue así! La constancia es la clave del dominio.</p>
             </div>
          </DropdownMenuContent>
        </DropdownMenu> */}

        <Button>Acceder</Button>
      </div>
    </header>
  );
}
