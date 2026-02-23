"use client";

import { useProjects } from "@/contexts/ProjectContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Search,
    Archive,
    CheckCircle,
    Clock,
    ArrowRight,
    Library,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
    const { projects, completedProjects, archivedProjects, isLoading } = useProjects();
    const { t } = useLanguage();

    return (
        <div className="flex-1 flex flex-col p-6 space-y-8 bg-background overflow-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">{t('projects.title') || 'Mis Proyectos'}</h1>
                    <p className="text-muted-foreground">
                        {t('projects.description') || 'Gestiona tus planes de estudio y progreso.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/explore">
                            <Search className="mr-2 h-4 w-4" />
                            {t('header.explore')}
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/new-project">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('header.new_project')}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Active Projects */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {t('dashboard.active_projects')}
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Card key={project.id} className="hover:shadow-md transition-shadow group">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex justify-between items-start gap-2">
                                            <span className="truncate">{project.title}</span>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                            {project.description || t('dashboard.no_description')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-muted-foreground">{t('dashboard.atoms')}</span>
                                                <span className="text-primary">{project.mastery}%</span>
                                            </div>
                                            <Progress value={project.mastery} className="h-2" />
                                            <div className="pt-2 flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">{project.atoms.length} {t('dashboard.atoms')}</span>
                                                <Button asChild size="sm" variant="ghost" className="group-hover:translate-x-1 transition-transform">
                                                    <Link href={`/projects/${project.id}`}>
                                                        {t('dashboard.study')}
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                            <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium">{t('dashboard.no_projects')}</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                                {t('dashboard.create_first')}
                            </p>
                            <Button asChild>
                                <Link href="/new-project">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('header.new_project')}
                                </Link>
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Completed Projects */}
                {completedProjects.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            {t('dashboard.completed_projects')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedProjects.map((project) => (
                                <Card key={project.id} className="bg-muted/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex justify-between items-start gap-2">
                                            <span className="truncate text-muted-foreground">{project.title}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-muted-foreground">100% {t('dashboard.study')}</span>
                                            <Button asChild size="sm" variant="link">
                                                <Link href={`/projects/${project.id}`}>
                                                    {t('dashboard.view_all')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Archive Section Link */}
                <div className="pt-8 border-t">
                    <Card className="bg-muted/20 border-dashed">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-muted rounded-full">
                                    <Archive className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Archivo de Proyectos</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {archivedProjects.length} proyectos guardados en el archivo.
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/archive">
                                    Ver Archivo
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
