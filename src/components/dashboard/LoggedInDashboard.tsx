
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DashboardProjectCard } from '@/components/deck/DashboardProjectCard';
import { getAllProjects } from '@/app/actions/projects';
import type { Project } from '@/types';
import { Zap, Flame, TrendingUp, Search, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

const StatCard = ({ icon, title, value, footer, progress, children }: { icon: React.ReactNode, title: string, value: string | number, footer: string, progress?: number, children?: React.ReactNode }) => (
    <Card className="bg-card/70 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-end">
            <div className="text-5xl font-bold text-center">{value}</div>
            <div className="flex-grow">
                {children}
            </div>
            {progress !== undefined && <Progress value={progress} className="h-1 my-2" />}
            <p className="text-xs text-muted-foreground text-center">{footer}</p>
        </CardContent>
    </Card>
);

const NoProjectsCard = ({ title, description }: { title: string, description: string }) => (
    <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
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
  const rankProgress = user.rank === 'A' ? 100 : (((user.rank?.charCodeAt(0) || 71) - 65) / 6) * 100;

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
            icon={<Zap className="h-4 w-4 text-muted-foreground"/>} 
            title="Energía Restante" 
            value={user.energy} 
            footer="Recuperas 1 de energía cada 2 horas"
            progress={energyProgress}
        />
        <StatCard 
            icon={<Flame className="h-4 w-4 text-muted-foreground"/>} 
            title="Racha Actual" 
            value={user.currentStreak} 
            footer=""
        >
             <div className="flex justify-center gap-3 w-full my-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                    <div key={day} className="flex flex-col items-center gap-2">
                        <span className="text-xs text-muted-foreground">{day}</span>
                        <div className={`h-2.5 w-2.5 rounded-full ${weeklyActivityDots[index] ? 'bg-orange-500' : 'bg-muted'}`}></div>
                    </div>
                ))}
             </div>
        </StatCard>
        <StatCard 
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground"/>} 
            title="Rango de Aprendedor" 
            value={user.rank || 'G'} 
            footer={user.rank === 'A' ? "¡Rango máximo alcanzado!" : "Sigue estudiando para subir de rango"}
            progress={rankProgress}
        />
      </div>
      
      {/* My Projects Section */}
      <div>
          <div className="flex items-center justify-between my-8">
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
             />
          )}
      </div>

       {/* Recommended Section */}
       <div>
            <div className="flex items-center justify-between my-8">
                <h2 className="text-2xl font-bold">Recomendado para ti</h2>
            </div>
            {/* Logic for recommendations would go here. For now, showing empty state. */}
            <NoProjectsCard 
                title="No hay proyectos recomendados en este momento." 
                description="Completa más sesiones para que Koli pueda aprender sobre tus intereses."
             />
       </div>

    </div>
  );
}
