
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Brain, Store, User, LogOut, Archive, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter, usePathname } from "next/navigation";
import { Progress } from "../ui/progress";

export function Header() {
  const { 
    energy, 
    globalCognitiveCredits, 
    nextEnergyIn, 
    learnerRankInfo 
  } = useProjects();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Only redirect to login if we're on a protected page
      const publicPaths = ['/new-project', '/login', '/signup', '/', '/terms', '/privacy'];
      const isOnPublicPage = publicPaths.some(path => pathname === path || pathname.startsWith(path));
      
      if (!isOnPublicPage) {
        router.push('/login');
      }
      // If on a public page, just stay there after logout
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: still redirect if not on public page
      const publicPaths = ['/new-project', '/login', '/signup', '/', '/terms', '/privacy'];
      const isOnPublicPage = publicPaths.some(path => pathname === path || pathname.startsWith(path));
      
      if (!isOnPublicPage) {
        router.push('/login');
      }
    }
  };

  const handleLinkClick = (href: string) => {
    router.push(href);
    setIsSheetOpen(false);
  };

  const renderUserStats = (isMobile = false) => (
    <>
      <div className="flex items-center gap-4" title="Energía">
        <Zap className="h-5 w-5 text-yellow-400" />
        <div className="flex flex-col">
          <span className="font-bold text-lg">{energy}</span>
          {isMobile && <span className="text-xs text-muted-foreground">Energía</span>}
        </div>
      </div>
      <div className="flex items-center gap-4" title="Créditos Cognitivos">
        <Brain className="h-5 w-5 text-blue-400" />
        <div className="flex flex-col">
          <span className="font-bold text-lg">{globalCognitiveCredits}</span>
          {isMobile && <span className="text-xs text-muted-foreground">Créditos</span>}
        </div>
      </div>
    </>
  );

  const renderProfileMenu = (isMobile = false) => (
    <div className="space-y-2">
      {learnerRankInfo && (
        <>
          <div className="p-2 rounded-md border">
              <p className="text-sm text-muted-foreground">Rango de Aprendedor</p>
              <p className="text-2xl font-bold font-headline">{learnerRankInfo.rankName}</p>
              <Progress value={learnerRankInfo.progress} className="h-1.5 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                  {learnerRankInfo.nextRankName !== "S" || learnerRankInfo.pointsToNext > 0
                      ? `${learnerRankInfo.pointsToNext} pts para Rango ${learnerRankInfo.nextRankName}`
                      : "¡Rango Máximo!"
                  }
              </p>
          </div>
        </>
      )}
      <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick('/profile')}>
        <User className="mr-2 h-4 w-4" />
        <span>Perfil</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick('/archive')}>
        <Archive className="mr-2 h-4 w-4" />
        <span>Archivo</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick('/store')}>
        <Store className="mr-2 h-4 w-4" />
        <span>Tienda</span>
      </Button>
      <DropdownMenuSeparator />
      <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Cerrar Sesión</span>
      </Button>
    </div>
  );

  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="hidden sm:block text-2xl font-bold font-headline">
          Kolearning
        </h1>
      </Link>
      
      {user ? (
        <>
          {/* Desktop View */}
          <div className="hidden md:flex items-center gap-6">
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
                    <AvatarFallback>{(profile?.name || user?.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{profile?.name || user?.email}</DropdownMenuLabel>
                {learnerRankInfo && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                        <p className="text-sm text-muted-foreground">Rango de Aprendedor</p>
                        <p className="text-2xl font-bold font-headline">{learnerRankInfo.rankName}</p>
                        <Progress value={learnerRankInfo.progress} className="h-1.5 mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {learnerRankInfo.nextRankName !== "S" || learnerRankInfo.pointsToNext > 0
                                ? `${learnerRankInfo.pointsToNext} pts para Rango ${learnerRankInfo.nextRankName}`
                                : "¡Rango Máximo!"
                            }
                        </p>
                    </div>
                  </>
                )}
                <DropdownMenuSeparator />
                <Link href="/profile" passHref>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                </Link>
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
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" className="flex items-center gap-3" onClick={() => setIsSheetOpen(false)}>
                      <Logo className="h-8 w-8 text-primary" />
                      <h1 className="text-2xl font-bold font-headline">
                        Kolearning
                      </h1>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border flex justify-around">
                    {renderUserStats(true)}
                  </div>
                  <div className="p-2">
                    {renderProfileMenu(true)}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
    </header>
  );
}
