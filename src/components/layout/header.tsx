
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { useProjects } from "@/contexts/ProjectContext";
import { Zap, Brain, Flame, Store, User, LogOut, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function Header() {
  const { 
    energy, 
    globalCognitiveCredits, 
    nextEnergyIn, 
    isAuthenticated, 
    currentUser, 
    logout 
  } = useProjects();
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline">
          Kolearning
        </h1>
      </Link>
      <div className="flex items-center gap-6">
        {isAuthenticated ? (
          <>
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
                 <div className="p-2 text-xs text-muted-foreground">
                    <p>Gana créditos al estudiar y úsalos para obtener energía.</p>
                 </div>
                 <DropdownMenuSeparator />
                 <Link href="/store" passHref>
                    <DropdownMenuItem>
                      <Store className="mr-2 h-4 w-4" />
                      <span>Tienda de Créditos</span>
                    </DropdownMenuItem>
                 </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{currentUser?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{currentUser?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/archive" passHref>
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Archivo</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" passHref>
                <Button variant="ghost">Acceder</Button>
            </Link>
            <Link href="/signup" passHref>
                <Button>Registrarse</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
