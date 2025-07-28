
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreateProjectCard } from '@/components/project/CreateProjectCard';
import { DashboardProjectCard } from '@/components/deck/DashboardProjectCard';
import { getAllProjects } from '@/app/actions/projects';
import type { Project } from '@/types';
import { Zap, Flame, TrendingUp, Search, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

const StatCard = ({ icon, title, value, footer, progress }: { icon: React.ReactNode, title: string, value: string | number, footer: string, progress?: number }) => (
    <Card className="bg-card/70 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                <span>{title}</span>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
            <div className="text-4xl font-bold text-center mb-2">{value}</div>
            {progress !== undefined && <Progress value={progress} className="h-1 mb-2" />}
            <p className="text-xs text-muted-foreground text-center">{footer}</p>
        </CardContent>
    </Card>
);

const NoProjectsCard = ({ title, description, buttonText, buttonLink }: { title: string, description: string, buttonText: string, buttonLink: string }) => (
    <div className="text-center py-16">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
    </div>
);


export function LoggedInDashboard() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (user) {
        setIsLoading(true);
        const allProjects = await getAllProjects();
        const userProjects = allProjects.filter(p => p.author === user.uid);
        setProjects(userProjects);
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, [user]);

  if (!user) {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        </div>
    );
  }

  const weeklyActivityDots = user.weeklyActivity || Array(7).fill(false);
  const energyProgress = (user.energy / 10) * 100;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">¡Bienvenido de nuevo!</h1>
        <p className="text-muted-foreground">¿Qué aprenderás hoy?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
            icon={<Zap className="h-4 w-4"/>} 
            title="Energía Restante" 
            value={user.energy} 
            footer="Recuperas 1 de energía cada 2 horas"
            progress={energyProgress}
        />
        <Card className="bg-card/70 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4"/>
                    <span>Racha Actual</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                 <div className="text-4xl font-bold text-center mb-2">{user.currentStreak}</div>
                 <div className="flex justify-center gap-2 w-full mb-2">
                    {weeklyActivityDots.map((active, index) => (
                        <div key={index} className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-orange-500' : 'bg-muted'}`}></div>
                    ))}
                 </div>
                 <div className="flex justify-between w-full text-xs text-muted-foreground px-1">
                     <span>Lun</span>
                     <span>Mar</span>
                     <span>Mié</span>
                     <span>Jue</span>
                     <span>Vie</span>
                     <span>Sáb</span>
                     <span>Dom</span>
                 </div>
            </CardContent>
        </Card>
        <StatCard 
            icon={<TrendingUp className="h-4 w-4"/>} 
            title="Rango de Aprendedor" 
            value={user.rank || 'G'} 
            footer={user.rank === 'A' ? "¡Rango máximo alcanzado!" : "Sigue estudiando para subir de rango"}
        />
      </div>
      
      {/* My Projects Section */}
      <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Mis Proyectos de Estudio</h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                    <Link href="/proyectos">
                        <Search className="mr-2 h-4 w-4"/>
                        Explorar todos
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/crear">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Crear Proyecto
                    </Link>
                </Button>
            </div>
          </div>
          {isLoading ? (
             <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
             </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {projects.map((project) => (
                    <DashboardProjectCard key={project.id} project={project} />
                ))}
            </div>
          ) : (
             <NoProjectsCard 
                title="No tienes proyectos todavía" 
                description="Usa la importación mágica o explora los proyectos de la comunidad para empezar."
                buttonText="Explorar Proyectos"
                buttonLink="/proyectos"
             />
          )}
      </div>

       {/* Recommended Section */}
       <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Recomendado para ti</h2>
            </div>
            {/* Logic for recommendations would go here. For now, showing empty state. */}
            <NoProjectsCard 
                title="No hay proyectos recomendados en este momento." 
                description=""
                buttonText="Explorar Proyectos"
                buttonLink="/proyectos"
             />
       </div>

    </div>
  );
}
