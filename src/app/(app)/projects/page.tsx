"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KolearningAvatar } from "@/components/icons/kolearning-avatar";
import {
    GraduationCap,
    Clock,
    ArrowRight,
    Plus,
    Archive,
    BrainCircuit,
    Library
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
    const { projects } = useProjects();
    const { profile } = useAuth();
    const router = useRouter();

    const handleStartNewProject = () => {
        router.push("/new-project");
    };

    return (
        <main className="flex-1 overflow-auto bg-background h-full">
            <DashboardView
                projects={projects}
                profile={profile}
                onStartNewProject={handleStartNewProject}
            />
        </main>
    );
}

const DashboardView = ({ projects, profile, onStartNewProject }: { projects: Project[], profile: any, onStartNewProject: () => void }) => {
    const { t } = useLanguage();

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-8">
            {/* Simple Top Bar */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Mis Proyectos</h1>
                    <p className="text-muted-foreground">Gestiona y organiza tus espacios de aprendizaje</p>
                </div>
                <Button onClick={onStartNewProject} size="lg" className="rounded-xl shadow-lg hover:shadow-primary/20 transition-all">
                    <Plus className="mr-2 h-5 w-5" /> {t('dashboard.create_project')}
                </Button>
            </div>

            {/* Active Projects Grid */}
            <section className="space-y-6">
                {projects.length === 0 ? (
                    <div className="bg-muted/30 border-2 border-dashed rounded-3xl p-16 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No hay proyectos activos</h3>
                        <p className="text-muted-foreground mb-6">Empieza importando material para crear tu primer proyecto.</p>
                        <Button onClick={onStartNewProject} variant="outline" className="rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Crear mi primer proyecto
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Card key={project.id} className="bg-card/50 hover:shadow-xl transition-all duration-300 border-primary/10 group h-full flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
                                            {project.icon === 'Book' ? '📚' : project.icon === 'Science' ? '🔬' : '💡'}
                                        </div>
                                    </div>
                                    <CardTitle className="mt-4 line-clamp-1">{project.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col">
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                        {project.description || t('dashboard.no_description')}
                                    </p>

                                    <div className="pt-4 border-t mt-auto">
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{project.atoms.length} {t('dashboard.atoms')}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button asChild variant="outline" size="sm" className="rounded-xl flex items-center gap-2 justify-center">
                                                <Link href={`/study/${project.id}?tab=study`}>
                                                    <BrainCircuit className="h-4 w-4" />
                                                    Study Box
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm" className="rounded-xl flex items-center gap-2 justify-center">
                                                <Link href={`/study/${project.id}?tab=data`}>
                                                    <Library className="h-4 w-4" />
                                                    Data Box
                                                </Link>
                                            </Button>
                                        </div>
                                        <Button asChild className="w-full mt-2 rounded-xl">
                                            <Link href={`/study/${project.id}`}>
                                                {t('dashboard.study')} <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Archived Section */}
            <div className="pt-12 border-t mt-12 mb-8">
                <div className="bg-muted/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center">
                            <Archive className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Proyectos Archivados</h3>
                            <p className="text-sm text-muted-foreground">Consulta material de estudios pasados</p>
                        </div>
                    </div>
                    <Button variant="outline" asChild className="rounded-xl px-8">
                        <Link href="/study/archive">Ver Archivo</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};
