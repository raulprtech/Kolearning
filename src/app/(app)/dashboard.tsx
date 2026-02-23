
"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { useProjects } from "@/contexts/ProjectContext";
import { Book, Landmark, FlaskConical, Code, Music, Palette } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const projectIcons: { [key: string]: React.ElementType } = {
    Book,
    Landmark,
    FlaskConical,
    Code,
    Music,
    Palette,
};

export default function DashboardPage() {
    const { projects, isLoading } = useProjects();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        console.log('[DashboardPage] Mounted. isLoading:', isLoading);
        setMounted(true);
    }, [isLoading]);

    return (
        <div className="space-y-8">
            <Card className="bg-card/50">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <KoliAvatar className="h-12 w-12 sm:h-16 sm:w-16" />
                    <div>
                        <CardTitle className="font-headline text-xl sm:text-2xl">Kolearning Daily Report</CardTitle>
                        <CardDescription>
                            The Tutor suggests your next study session to maximize retention.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">
                        Based on your progress in <strong>Quantum Physics</strong>, I recommend a <Link href="/study/1" className="text-primary hover:underline font-bold">Reinforcement</Link> session to consolidate key concepts.
                    </p>
                    <Link href="/study/1">
                        <Button>Start Reinforcement Session</Button>
                    </Link>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl text-center sm:text-left font-semibold mb-4">Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <Card key={i} className="bg-card/50 h-40 animate-pulse">
                                <CardHeader><div className="bg-muted rounded-md h-8 w-3/4"></div></CardHeader>
                                <CardContent><div className="bg-muted rounded-md h-4 w-full mt-2"></div></CardContent>
                            </Card>
                        ))
                    ) : projects.length > 0 ? (
                        projects.map(project => {
                            const Icon = projectIcons[project.icon] || Book;
                            return (
                                <Link href={`/study/${project.id}`} key={project.id}>
                                    <Card className="bg-card/50 hover:border-primary transition-colors h-full flex flex-col">
                                        <CardHeader className="flex-row items-center gap-4">
                                            {Icon && <Icon className="w-8 h-8 text-primary" />}
                                            <CardTitle>{project.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col justify-end">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-muted-foreground">Mastery</span>
                                                <span className="text-sm font-bold">{project.mastery}%</span>
                                            </div>
                                            <Progress value={project.mastery} className="h-2" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })
                    ) : (
                        <Card className="md:col-span-2 lg:col-span-3 bg-card/50">
                            <CardHeader>
                                <CardTitle>Welcome to Kolearning!</CardTitle>
                                <CardDescription>You don't have any projects yet. Create one to start learning!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/">
                                    <Button>Create New Project</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
