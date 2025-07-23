

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, Play, PlusCircle, Search, Flame, TrendingUp, BookOpen } from 'lucide-react';
import type { Project } from '@/types';
import { DashboardProjectCard } from '@/components/deck/DashboardProjectCard';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/context/UserContext';
import { useEffect, useState, useMemo } from 'react';
import { getAllProjects } from '@/app/actions/projects';
import { Skeleton } from '@/components/ui/skeleton';

const adventurerRanks = [
  { rank: 'G', name: 'Aprendedor Rango G', requiredPoints: 0 },
  { rank: 'F', name: 'Aprendedor Rango F', requiredPoints: 100 },
  { rank: 'E', name: 'Aprendedor Rango E', requiredPoints: 300 },
  { rank: 'D', name: 'Aprendedor Rango D', requiredPoints: 600 },
  { rank: 'C', name: 'Aprendedor Rango C', requiredPoints: 1000 },
  { rank: 'B', name: 'Aprendedor Rango B', requiredPoints: 1500 },
  { rank: 'A', name: 'Aprendedor Rango A', requiredPoints: 2500 },
  { rank: 'S', name: 'Aprendedor Rango S', requiredPoints: 5000 },
];

const calculateRank = (dominionPoints: number) => {
  let currentRank = adventurerRanks[0];
  let nextRank = adventurerRanks[1];

  for (let i = 0; i < adventurerRanks.length; i++) {
    if (dominionPoints >= adventurerRanks[i].requiredPoints) {
      currentRank = adventurerRanks[i];
      if (i + 1 < adventurerRanks.length) {
        nextRank = adventurerRanks[i + 1];
      } else {
        // Max rank reached
        nextRank = currentRank;
      }
    } else {
      break;
    }
  }

  const pointsForNextRank = nextRank.requiredPoints - currentRank.requiredPoints;
  const pointsProgress = dominionPoints - currentRank.requiredPoints;
  const progressPercentage = pointsForNextRank > 0 ? (pointsProgress / pointsForNextRank) * 100 : 100;

  return {
    currentRankLetter: currentRank.rank,
    currentRankName: currentRank.name,
    pointsToNextLevel: nextRank.requiredPoints - dominionPoints,
    progressPercentage,
  };
};

export default function DashboardPage() {
    const { user } = useUser();
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            setLoading(true);
            const projects = await getAllProjects();
            setAllProjects(projects);
            setLoading(false);
        }
        loadProjects();
    }, []);
    
    const myProjects = allProjects.filter(p => p.author === 'User');
    const recommendedProjects = allProjects.filter(p => p.author === 'Kolearning').slice(0, 4);


    const currentStreak = user?.currentStreak ?? 0;
    const energy = user?.energy ?? 10;
    const maxEnergy = 10;
    const energyPercentage = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;
    
    const rankInfo = useMemo(() => {
        if (!user) return null;
        return calculateRank(user.dominionPoints);
    }, [user]);

    const weeklyActivity = user?.weeklyActivity || [false, false, false, false, false, false, false];
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">¡Bienvenido de nuevo!</h1>
            <p className="text-muted-foreground mt-2">¿Qué aprenderás hoy?</p>
          </div>
          <Button size="lg" className="bg-primary/80 hover:bg-primary text-primary-foreground" disabled={myProjects.length === 0}>
            <BookOpen className="mr-2 h-4 w-4" />
            Aprender
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col justify-between text-center h-full">
              <div>
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <TrendingUp className="h-6 w-6" />
                  <p className="text-muted-foreground text-sm">Rango de Aprendedor</p>
                </div>
              </div>
              <div className="my-4">
                <p className="text-5xl font-bold">{rankInfo?.currentRankLetter || 'G'}</p>
              </div>
              <div className="w-full">
                <Progress value={rankInfo?.progressPercentage ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {rankInfo?.pointsToNextLevel && rankInfo.pointsToNextLevel > 0 
                    ? `${rankInfo.pointsToNextLevel} para el siguiente rango`
                    : '¡Rango máximo alcanzado!'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col justify-between text-center h-full">
              <div>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Zap className="h-6 w-6" />
                  <p className="text-muted-foreground text-sm">Energía Restante</p>
                </div>
              </div>
               <div className="my-4">
                  <p className="text-5xl font-bold">{energy}</p>
              </div>
              <div className="w-full">
                <Progress value={energyPercentage} className="h-2 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground mt-2 text-right">Recuperas 1 de energía cada 2 horas</p>
              </div>
            </CardContent>
          </Card>
           <Card className="bg-card/50">
            <CardContent className="p-6 flex flex-col justify-between text-center h-full">
               <div>
                  <div className="flex items-center justify-center gap-2 text-orange-500">
                    <Flame className="h-6 w-6" />
                    <p className="text-muted-foreground text-sm">Racha Actual</p>
                  </div>
              </div>
              <div className="my-4">
                <p className="text-5xl font-bold">{currentStreak}</p>
              </div>
              <div className="flex justify-center gap-3 w-full">
                {weeklyActivity.map((active, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <p className="text-xs text-muted-foreground">{dayLabels[index]}</p>
                    <div
                      className={`h-6 w-6 rounded-full ${active ? 'bg-orange-500' : 'bg-muted'}`}
                      title={`${dayLabels[index]}: ${active ? 'Activo' : 'Inactivo'}`}
                    ></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Mis Proyectos de Estudio</h2>
                 <div className="flex items-center gap-2">
                    <Button asChild variant="secondary">
                        <Link href="/proyectos">
                            <Search className="mr-2 h-5 w-5" />
                            Explorar todos
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/crear">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Crear Proyecto
                        </Link>
                    </Button>
                 </div>
            </div>
             {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
                </div>
             ) : myProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {myProjects.map((project) => (
                        <DashboardProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No tienes proyectos todavía</h2>
                    <p className="text-muted-foreground mt-2">
                        Usa la importación mágica o explora los proyectos de la comunidad para empezar.
                    </p>
                </div>
            )}
        </div>

        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Recomendado para ti</h2>
            </div>
             {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
                </div>
             ) : recommendedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {recommendedProjects.map((project) => (
                        <DashboardProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                     <p className="text-muted-foreground mt-2">No hay proyectos recomendados en este momento.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

    
